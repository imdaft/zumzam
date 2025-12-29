'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { logger } from '@/lib/logger'
import type { UserRole } from '@/types'

// Минимальный тип пользователя из cookies
type AppUser = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
}

// Тип для режима просмотра (только для админов)
type ViewAsRole = UserRole | null

interface AuthContextValue {
  user: AppUser | null
  profile: AppUser | null
  role: UserRole              // Реальная роль пользователя
  viewAsRole: ViewAsRole      // Виртуальная роль для просмотра (только для админов)
  effectiveRole: UserRole     // Эффективная роль (viewAsRole или role)
  isLoading: boolean
  isAuthenticated: boolean
  isClient: boolean           // На основе effectiveRole
  isProvider: boolean         // На основе effectiveRole
  isAdmin: boolean            // На основе effectiveRole
  isRealAdmin: boolean        // Настоящий админ (для показа переключателя)
  isViewingAs: boolean        // Админ смотрит от другой роли
  setViewAsRole: (role: ViewAsRole) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Ключ для localStorage
const VIEW_AS_ROLE_KEY = 'zumzam_view_as_role'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [role, setRole] = useState<UserRole>('client')
  const [viewAsRole, setViewAsRoleState] = useState<ViewAsRole>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Функция для чтения user-info из cookies
  const getUserFromCookies = (): AppUser | null => {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    const userInfo = cookies['user-info']
    if (!userInfo) return null
    
    try {
      const parsed = JSON.parse(decodeURIComponent(userInfo))
      return {
        id: parsed.id,
        email: parsed.email,
        full_name: parsed.full_name,
        avatar_url: parsed.avatar_url,
        role: parsed.role || 'client',
      }
    } catch (error) {
      logger.error('[Auth] Failed to parse user-info cookie', error)
      return null
    }
  }

  // Загружаем viewAsRole из localStorage при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VIEW_AS_ROLE_KEY)
      if (saved && ['client', 'provider', 'admin'].includes(saved)) {
        setViewAsRoleState(saved === 'admin' ? null : (saved as UserRole))
      }
    }
  }, [])

  // Функция для установки viewAsRole (сохраняет в localStorage)
  const setViewAsRole = (newRole: ViewAsRole) => {
    const normalized: ViewAsRole = newRole === 'admin' ? null : newRole
    setViewAsRoleState(normalized)
    if (typeof window !== 'undefined') {
      if (normalized) {
        localStorage.setItem(VIEW_AS_ROLE_KEY, normalized)
      } else {
        localStorage.removeItem(VIEW_AS_ROLE_KEY)
      }
    }
    logger.debug('[Auth] View as role changed', { viewAsRole: normalized })
  }

  // Инициализация auth при монтировании
  useEffect(() => {
    const initAuth = () => {
      const userFromCookies = getUserFromCookies()
      
      if (userFromCookies) {
        logger.info('[Auth] ✅ User loaded from JWT cookies', { 
          email: userFromCookies.email,
          role: userFromCookies.role 
        })
        
        setUser(userFromCookies)
        setRole(userFromCookies.role)
      } else {
        logger.debug('[Auth] No user in cookies')
      }
      
      setIsLoading(false)
    }

    initAuth()

    // Проверяем cookies при возврате на вкладку
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const userFromCookies = getUserFromCookies()
        
        if (userFromCookies && (!user || user.id !== userFromCookies.id)) {
          logger.info('[Auth] User session updated from another tab')
          setUser(userFromCookies)
          setRole(userFromCookies.role)
        } else if (!userFromCookies && user) {
          logger.info('[Auth] User logged out in another tab')
          setUser(null)
          setRole('client')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [])

  // Функция для обновления профиля
  const refreshProfile = async () => {
    const userFromCookies = getUserFromCookies()
    if (userFromCookies) {
      setUser(userFromCookies)
      setRole(userFromCookies.role)
      logger.debug('[Auth] Profile refreshed')
    }
  }

  // Вычисляем эффективную роль
  const effectiveRole: UserRole = viewAsRole || role
  const isRealAdmin = role === 'admin' || role === 'super_admin'
  const isViewingAs = isRealAdmin && viewAsRole !== null

  const value: AuthContextValue = {
    user,
    profile: user, // Для совместимости
    role,
    viewAsRole,
    effectiveRole,
    isLoading,
    isAuthenticated: !!user,
    isClient: effectiveRole === 'client',
    isProvider: effectiveRole === 'provider',
    isAdmin: effectiveRole === 'admin' || effectiveRole === 'super_admin',
    isRealAdmin,
    isViewingAs,
    setViewAsRole,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

