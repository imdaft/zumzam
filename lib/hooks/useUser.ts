'use client'

import { useAuth } from '@/lib/contexts/auth-context'

/**
 * @deprecated Используйте useAuth() из @/lib/contexts/auth-context вместо useUser()
 * 
 * Этот хук оставлен ТОЛЬКО для обратной совместимости.
 * Внутри он просто вызывает useAuth() - новый правильный способ.
 * 
 * Миграция проста:
 * - Было: import { useUser } from '@/lib/hooks/useUser'
 * - Стало: import { useAuth } from '@/lib/contexts/auth-context'
 */
export function useUser() {
  const authContext = useAuth()
  
  // Добавляем deprecated метод reset для совместимости
  return {
    ...authContext,
    reset: () => {
      console.warn('[useUser] reset() is deprecated, use refreshProfile() instead')
    },
  }
}
