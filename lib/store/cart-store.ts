/**
 * Zustand Store для управления корзиной
 * Простое и понятное хранилище состояния корзины
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartValidation } from '@/types'
import tracker from '@/lib/analytics/tracker'

// ============================================
// Типы
// ============================================

interface CartStore {
  // Состояние
  items: CartItem[]
  isLoading: boolean
  error: string | null
  
  // Действия
  fetchCart: () => Promise<void>
  addItem: (serviceId: string, profileId: string, quantity?: number, notes?: string, customPrice?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  updateNotes: (itemId: string, notes: string) => Promise<void>
  clearCart: () => Promise<void>
  
  // Вычисляемые значения
  getTotal: () => number
  getItemsCount: () => number
  getActiveProfileId: () => string | null
  getActiveProfileName: () => string | null
  validateCart: () => Promise<CartValidation>
  
  // Утилиты
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// ============================================
// Store
// ============================================

// Уведомляем другие части клиента, что корзина обновилась
const notifyCartUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart:updated'))
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      items: [],
      isLoading: false,
      error: null,

      // Утилиты
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      // Загрузка корзины с сервера
      fetchCart: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch('/api/cart')
          if (!response.ok) {
            // Если пользователь не авторизован (401) или таблица не создана (404/500), 
            // просто используем пустую корзину без ошибки
            if (response.status === 401 || response.status === 404 || response.status === 500) {
              if (response.status === 401) {
                console.log('[CartStore] User not authenticated. Using empty cart.')
              } else {
                console.warn('[CartStore] Cart table might not exist yet. Using empty cart.')
              }
              set({ items: [], isLoading: false })
              return
            }
            throw new Error('Не удалось загрузить корзину')
          }
          
          const data = await response.json()
          set({ items: data.items || [], isLoading: false })
          notifyCartUpdated()
        } catch (error: any) {
          console.error('[CartStore] Ошибка загрузки корзины:', error)
          // Не показываем ошибку пользователю, просто используем пустую корзину
          set({ items: [], error: null, isLoading: false })
        }
      },

      // Добавление товара в корзину
      addItem: async (serviceId: string, profileId: string, quantity = 1, notes?: string, customPrice?: number) => {
        try {
          set({ isLoading: true, error: null })

          // Клик по услуге (переход к добавлению) — для воронки
          tracker.track('service_click', {
            service_id: serviceId,
            profile_id: profileId,
            quantity,
            custom_price: customPrice ?? null,
            notes: notes ?? null,
            source: 'cart_store',
          })

          // Фиксируем попытку добавления (для воронки)
          tracker.track('cart_add', {
            service_id: serviceId,
            profile_id: profileId,
            quantity,
            custom_price: customPrice ?? null,
            notes: notes ?? null,
            stage: 'attempt',
          })

          // Локальная проверка: в корзине уже есть услуги другого профиля
          const currentItems = get().items
          const existingProfileId = currentItems[0]?.profile_id || null
          if (currentItems.length > 0 && existingProfileId && existingProfileId !== profileId) {
            const currentProfileName = currentItems[0]?.profile?.display_name || 'другого исполнителя'
            const conflictError = {
              code: 'DIFFERENT_PROFILE_EXISTS',
              message: `В корзине уже есть услуги от "${currentProfileName}". Очистить корзину перед добавлением?`,
              current_profile_name: currentProfileName,
            }
            set({ isLoading: false, error: conflictError.message })
            throw conflictError
          }
          
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service_id: serviceId, profile_id: profileId, quantity, notes, custom_price: customPrice }),
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            
            // Если конфликт профилей (409), прокидываем объект ошибки целиком
            if (response.status === 409) {
              throw errorData
            }
            
            throw new Error(errorData.error || 'Не удалось добавить в корзину')
          }
          
          const data = await response.json()
          
          // Обновляем локальное состояние
          const updatedItemsAfterFetch = get().items
          const existingItemIndex = updatedItemsAfterFetch.findIndex(item => item.service_id === serviceId)
          
          if (existingItemIndex >= 0) {
            // Обновляем существующий элемент
            const updatedItems = [...updatedItemsAfterFetch]
            updatedItems[existingItemIndex] = data.item
            set({ items: updatedItems, isLoading: false })
          } else {
            // Добавляем новый элемент
            set({ items: [...updatedItemsAfterFetch, data.item], isLoading: false })
          }

          // Успешное добавление (для воронки)
          tracker.track('cart_add', {
            service_id: serviceId,
            profile_id: profileId,
            quantity,
            custom_price: customPrice ?? null,
            notes: notes ?? null,
            stage: 'success',
          })

          notifyCartUpdated()
        } catch (error: any) {
          console.error('[CartStore] Ошибка добавления в корзину:', error)
          const errorMessage = error?.message || 'Не удалось добавить в корзину'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      // Удаление товара из корзины
      removeItem: async (itemId: string) => {
        try {
          set({ isLoading: true, error: null })

          const item = get().items.find((i) => i.id === itemId)
          
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            throw new Error('Не удалось удалить из корзины')
          }
          
          // Удаляем из локального состояния
          const currentItems = get().items
          set({ items: currentItems.filter(item => item.id !== itemId), isLoading: false })

          // Фиксируем удаление (для воронки)
          tracker.track('cart_remove', {
            item_id: itemId,
            service_id: item?.service_id || null,
            profile_id: item?.profile_id || null,
            quantity: item?.quantity || null,
          })

          notifyCartUpdated()
        } catch (error: any) {
          console.error('[CartStore] Ошибка удаления из корзины:', error)
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      // Обновление количества
      updateQuantity: async (itemId: string, quantity: number) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
          })
          
          if (!response.ok) {
            throw new Error('Не удалось обновить количество')
          }
          
          const data = await response.json()
          
          // Обновляем локальное состояние
          const currentItems = get().items
          const updatedItems = currentItems.map(item => 
            item.id === itemId ? data.item : item
          )
          set({ items: updatedItems, isLoading: false })
          notifyCartUpdated()
        } catch (error: any) {
          console.error('[CartStore] Ошибка обновления количества:', error)
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      // Обновление заметок
      updateNotes: async (itemId: string, notes: string) => {
        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          })
          
          if (!response.ok) {
            throw new Error('Не удалось обновить заметки')
          }
          
          const data = await response.json()
          
          // Обновляем локальное состояние
          const currentItems = get().items
          const updatedItems = currentItems.map(item => 
            item.id === itemId ? data.item : item
          )
          set({ items: updatedItems })
          notifyCartUpdated()
        } catch (error: any) {
          console.error('[CartStore] Ошибка обновления заметок:', error)
          throw error
        }
      },

      // Очистка корзины
      clearCart: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch('/api/cart', {
            method: 'DELETE',
          })
          
          if (!response.ok) {
            throw new Error('Не удалось очистить корзину')
          }
          
          set({ items: [], isLoading: false })
          notifyCartUpdated()
        } catch (error: any) {
          console.error('[CartStore] Ошибка очистки корзины:', error)
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      // Вычисление общей стоимости
      getTotal: () => {
        const items = get().items
        return items.reduce((total, item) => {
          return total + (item.price_snapshot * item.quantity)
        }, 0)
      },

      // Подсчет количества товаров
      getItemsCount: () => {
        const items = get().items
        return items.reduce((count, item) => count + item.quantity, 0)
      },

      // Активный профиль (первый в корзине)
      getActiveProfileId: () => {
        const items = get().items
        return items[0]?.profile_id || null
      },

      getActiveProfileName: () => {
        const items = get().items
        return items[0]?.profile?.display_name || null
      },

      // Валидация корзины
      validateCart: async () => {
        try {
          const response = await fetch('/api/cart/validate')
          if (!response.ok) {
            throw new Error('Не удалось проверить корзину')
          }
          
          const validation = await response.json()
          return validation
        } catch (error: any) {
          console.error('[CartStore] Ошибка валидации корзины:', error)
          return {
            is_valid: false,
            error_message: error.message,
            has_main_or_package: false,
            has_only_additional: false,
          }
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только items, остальное загружается с сервера
      partialize: (state) => ({ items: state.items }),
    }
  )
)

