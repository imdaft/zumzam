'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuthStore } from '@/lib/store/auth'
import type { User as AppUser } from '@/types'

/**
 * Хук для получения текущего пользователя
 * Автоматически подписывается на изменения auth состояния
 */
export function useUser() {
  const { user, profile, isLoading, isInitialized, setUser, setProfile, setLoading, setInitialized, reset } = useAuthStore()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем текущего пользователя при монтировании
    const initializeAuth = async () => {
      try {
        console.log('[useUser] 1. Starting auth initialization...')
        setLoading(true)
        
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        console.log('[useUser] 2. Auth user:', authUser ? `ID: ${authUser.id}, Email: ${authUser.email}` : 'NULL')

        if (authUser) {
          setUser(authUser)

          // Загружаем расширенный профиль из таблицы users
          console.log('[useUser] 3. Fetching from public.users...')
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          console.log('[useUser] 4. DB result - Data:', userData ? 'EXISTS' : 'NULL', 'Error:', error?.code || 'NONE')

          if (error) {
            console.error('[useUser] Error fetching user profile:', error)
            // Если запись не найдена, создаем базовый профиль
            if (error.code === 'PGRST116') {
              console.log('[useUser] 5a. User record not found, creating fallback profile')
              const fallbackProfile = {
                id: authUser.id,
                email: authUser.email || '',
                full_name: authUser.user_metadata?.full_name || null,
                avatar_url: authUser.user_metadata?.avatar_url || null,
                phone: authUser.user_metadata?.phone || null,
                role: 'parent',
                created_at: authUser.created_at,
                updated_at: new Date().toISOString(),
              } as AppUser
              console.log('[useUser] 5b. Fallback profile:', fallbackProfile)
              setProfile(fallbackProfile)
            }
          } else if (userData) {
            console.log('[useUser] 5c. Setting profile from DB:', userData)
            setProfile(userData as AppUser)
          }
        } else {
          console.log('[useUser] 6. No auth user, resetting')
          reset()
        }
      } catch (error) {
        console.error('[useUser] Exception during initialization:', error)
        reset()
      } finally {
        console.log('[useUser] 7. Initialization complete, setting loading=false')
        setLoading(false)
        setInitialized(true)
      }
    }

    // Инициализируем только один раз
    if (!isInitialized) {
      initializeAuth()
    }

    // Подписываемся на изменения auth состояния
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)

        // Загружаем профиль
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userData) {
          setProfile(userData as AppUser)
        }
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        reset()
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user)
      }
    })

    // Отписываемся при размонтировании
    return () => {
      subscription.unsubscribe()
    }
  }, [isInitialized, setUser, setProfile, setLoading, setInitialized, reset])

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
  }
}


