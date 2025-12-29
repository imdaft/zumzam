'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ProfileCategory } from '@/lib/constants/profile-categories'

export interface ProfileDraft {
  id: string
  category: ProfileCategory
  display_name: string
  currentStep: number
  totalSteps: number
  data: {
    display_name?: string
    bio?: string
    city?: string
    address?: string
    geo_location?: [number, number] | null
    logo?: string | null
    cover_photo?: string | null
    details?: any
    photos?: string[]
    videos?: string[]
    [key: string]: any
  }
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'zumzam_profile_drafts'

// Валидация структуры черновика (вынесена вне компонента)
function isValidDraft(draft: any): draft is ProfileDraft {
  return (
    draft &&
    typeof draft === 'object' &&
    typeof draft.id === 'string' &&
    typeof draft.category === 'string' &&
    ['venue', 'animator', 'show', 'agency', 'quest', 'master_class', 'photographer'].includes(draft.category) &&
    typeof draft.display_name === 'string' &&
    typeof draft.currentStep === 'number' &&
    typeof draft.totalSteps === 'number' &&
    typeof draft.createdAt === 'number' &&
    typeof draft.updatedAt === 'number' &&
    draft.data &&
    typeof draft.data === 'object'
  )
}

export function useProfileDrafts() {
  const [drafts, setDrafts] = useState<ProfileDraft[]>([])

  // Функция загрузки черновиков (можно переиспользовать)
  const loadDrafts = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Проверяем, что это массив
        if (!Array.isArray(parsed)) {
          console.warn('Invalid drafts format in localStorage, clearing...')
          localStorage.removeItem(STORAGE_KEY)
          return
        }

        // Валидируем и фильтруем черновики
        const now = Date.now()
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000) // 30 дней в миллисекундах
        
        const validDrafts = parsed
          .filter(isValidDraft)
          .filter((draft, index, self) => 
            // Убираем дубликаты по ID (оставляем последний)
            index === self.findIndex((d) => d.id === draft.id)
          )
          .filter((draft) => {
            // Удаляем черновики старше 30 дней
            return draft.updatedAt > thirtyDaysAgo
          })
          .slice(0, 20) // Лимит: максимум 20 черновиков

        // Если были невалидные данные или старые черновики, сохраняем очищенный список
        if (validDrafts.length !== parsed.length) {
          const removed = parsed.length - validDrafts.length
          console.warn(`Cleaned drafts: ${parsed.length} → ${validDrafts.length} (удалено ${removed})`)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validDrafts))
        }

        // Предупреждение, если всё ещё много черновиков
        if (validDrafts.length > 10) {
          console.warn(`Много черновиков (${validDrafts.length}). Рекомендуется очистить старые.`)
        }

        setDrafts(validDrafts)
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
      // Очищаем повреждённые данные
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (e) {
        console.error('Error clearing corrupted drafts:', e)
      }
    }
  }

  // Загрузка черновиков при монтировании
  useEffect(() => {
    loadDrafts()
  }, []) // Только при монтировании!

  // Слушаем изменения в других вкладках/компонентах
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        console.log('[useProfileDrafts] Storage changed, reloading...')
        // Используем setTimeout чтобы избежать setState во время рендера
        setTimeout(() => {
          loadDrafts()
        }, 0)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Сохранить черновик
  const saveDraft = useCallback((draft: Omit<ProfileDraft, 'updatedAt'>) => {
    const now = Date.now()
    const newDraft: ProfileDraft = {
      ...draft,
      updatedAt: now,
    }

    // Валидация перед сохранением
    if (!isValidDraft(newDraft)) {
      console.error('Invalid draft structure:', newDraft)
      return newDraft
    }

    setDrafts((prev) => {
      // Обновляем существующий или добавляем новый
      const existingIndex = prev.findIndex((d) => d.id === draft.id)
      let updated: ProfileDraft[]
      
      if (existingIndex >= 0) {
        updated = [...prev]
        updated[existingIndex] = newDraft
      } else {
        // Лимит: максимум 20 черновиков (удаляем самые старые)
        if (prev.length >= 20) {
          const sorted = [...prev].sort((a, b) => a.updatedAt - b.updatedAt)
          updated = [...sorted.slice(1), newDraft]
        } else {
          updated = [...prev, newDraft]
        }
      }

      // Сохраняем в localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Error saving draft:', error)
        // Если localStorage переполнен, удаляем самые старые черновики
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          const sorted = updated.sort((a, b) => a.updatedAt - b.updatedAt)
          const cleaned = sorted.slice(-10) // Оставляем только 10 последних
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
            return cleaned
          } catch (e) {
            console.error('Error cleaning drafts:', e)
          }
        }
      }

      return updated
    })

    return newDraft
  }, [])

  // Получить черновик по ID
  const getDraft = useCallback((id: string): ProfileDraft | undefined => {
    return drafts.find((d) => d.id === id)
  }, [drafts])

  // Получить все черновики
  const getAllDrafts = useCallback((): ProfileDraft[] => {
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [drafts])

  // Удалить черновик
  const deleteDraft = useCallback((id: string) => {
    console.log('[useProfileDrafts] Deleting draft:', id)
    
    setDrafts((prev) => {
      console.log('[useProfileDrafts] Current drafts count:', prev.length)
      const updated = prev.filter((d) => d.id !== id)
      console.log('[useProfileDrafts] After delete count:', updated.length)
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        console.log('[useProfileDrafts] ✅ Saved to localStorage')
        
        // Триггерим событие для других компонентов в том же окне
        window.dispatchEvent(new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify(updated),
          url: window.location.href,
        }))
      } catch (error) {
        console.error('[useProfileDrafts] ❌ Error deleting draft:', error)
      }

      return updated
    })
  }, [])

  // Очистить все черновики
  const clearAllDrafts = useCallback(() => {
    setDrafts([])
    try {
      localStorage.removeItem(STORAGE_KEY)
      
      // Триггерим событие для других компонентов
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: null,
        url: window.location.href,
      }))
    } catch (error) {
      console.error('Error clearing drafts:', error)
    }
  }, [])

  // Получить последний черновик
  const getLatestDraft = useCallback((): ProfileDraft | undefined => {
    if (drafts.length === 0) return undefined
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt)[0]
  }, [drafts])

  // Проверить, есть ли активные черновики
  const hasDrafts = useCallback((): boolean => {
    return drafts.length > 0
  }, [drafts])

  return {
    drafts,
    saveDraft,
    getDraft,
    getAllDrafts,
    deleteDraft,
    clearAllDrafts,
    getLatestDraft,
    hasDrafts,
  }
}

