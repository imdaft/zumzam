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
        setLoading(true)
        
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setUser(authUser)

          // Загружаем расширенный профиль из таблицы users
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (error) {
            console.error('Error fetching user profile:', error)
          } else if (userData) {
            setProfile(userData as AppUser)
          }
        } else {
          reset()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        reset()
      } finally {
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


