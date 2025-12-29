/**
 * Zustand Store для управления режимом просмотра (клиент/сервис)
 * Для администраторов, которые могут переключаться между режимами
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ViewMode } from '@/types'

// ============================================
// Типы
// ============================================

interface ViewModeStore {
  // Состояние
  mode: ViewMode
  isAdmin: boolean
  
  // Действия
  setMode: (mode: ViewMode) => void
  toggleMode: () => void
  setIsAdmin: (isAdmin: boolean) => void
  
  // Утилиты
  isClientMode: () => boolean
  isServiceMode: () => boolean
}

// ============================================
// Store
// ============================================

export const useViewModeStore = create<ViewModeStore>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      mode: 'client', // По умолчанию клиентский режим
      isAdmin: false,

      // Установка режима
      setMode: (mode: ViewMode) => {
        console.log('[ViewModeStore] Переключение режима на:', mode)
        set({ mode })
      },

      // Переключение между режимами
      toggleMode: () => {
        const currentMode = get().mode
        const newMode = currentMode === 'client' ? 'service' : 'client'
        console.log('[ViewModeStore] Переключение с', currentMode, 'на', newMode)
        set({ mode: newMode })
      },

      // Установка флага администратора
      setIsAdmin: (isAdmin: boolean) => {
        console.log('[ViewModeStore] Установка isAdmin:', isAdmin)
        set({ isAdmin })
        
        // Если пользователь больше не админ, сбрасываем на клиентский режим
        if (!isAdmin) {
          set({ mode: 'client' })
        }
      },

      // Проверка: клиентский режим?
      isClientMode: () => {
        return get().mode === 'client'
      },

      // Проверка: режим сервиса?
      isServiceMode: () => {
        return get().mode === 'service'
      },
    }),
    {
      name: 'view-mode-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Хук для упрощенного использования режима просмотра
 */
export function useViewMode() {
  const { mode, isAdmin, setMode, toggleMode, isClientMode, isServiceMode } = useViewModeStore()
  
  return {
    mode,
    isAdmin,
    isClientMode: isClientMode(),
    isServiceMode: isServiceMode(),
    setMode,
    toggleMode,
  }
}


