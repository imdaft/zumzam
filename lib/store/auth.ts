import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types'

/**
 * Состояние авторизации
 */
interface AuthState {
  // Пользователь из Supabase Auth
  user: User | null
  // Расширенные данные пользователя из таблицы users
  profile: AppUser | null
  // Флаг загрузки
  isLoading: boolean
  // Флаг инициализации
  isInitialized: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: AppUser | null) => void
  setLoading: (isLoading: boolean) => void
  setInitialized: (isInitialized: boolean) => void
  reset: () => void
}

/**
 * Zustand store для управления состоянием авторизации
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  
  reset: () =>
    set({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    }),
}))

