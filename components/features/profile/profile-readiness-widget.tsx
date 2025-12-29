/**
 * Виджет готовности профиля к публикации
 * Показывает чеклист и тумблер публикации
 */

'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { checkProfileReadiness } from '@/lib/utils/verification'

interface ProfileReadinessWidgetProps {
  profile: any
  services?: any[]
  onPublishChange?: () => void
}

export function ProfileReadinessWidget({ 
  profile, 
  services = [],
  onPublishChange 
}: ProfileReadinessWidgetProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [localPublished, setLocalPublished] = useState(profile.is_published || false)
  
  const readiness = checkProfileReadiness(profile, services)

  // Синхронизируем локальное состояние с профилем
  useEffect(() => {
    setLocalPublished(profile.is_published || false)
  }, [profile.is_published])

  // Debug: логируем состояние готовности
  console.log('[ProfileReadinessWidget] Readiness check:', {
    isReady: readiness.isReady,
    checklist: readiness.checklist,
    missingItems: readiness.missingItems,
    servicesCount: services.length,
    localPublished
  })

  const handlePublishToggle = async (checked: boolean) => {
    console.log('[ProfileReadinessWidget] 🔄 Toggle clicked:', {
      checked,
      isReady: readiness.isReady,
      localPublished,
      missingItems: readiness.missingItems
    })

    // Блокируем включение, если профиль не готов
    if (!readiness.isReady && checked) {
      console.log('[ProfileReadinessWidget] ❌ BLOCKED: Profile not ready!')
      const missingText = readiness.missingItems.join(', ')
      
      // Откладываем toast до следующего тика, чтобы не блокировать рендер
      setTimeout(() => {
        toast.error('Профиль не готов к публикации', {
          description: `Заполните: ${missingText}`,
          duration: 5000,
        })
      }, 0)
      return
    }

    console.log('[ProfileReadinessWidget] ✅ Proceeding with API request...')
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/profiles?id=${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: checked }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('[ProfileReadinessWidget] ❌ API Error:', errorData)
        throw new Error(errorData.message || 'Failed to update profile')
      }

      // Обновляем локальное состояние только после успешного ответа
      console.log('[ProfileReadinessWidget] ✅ API Success, updating local state to:', checked)
      setLocalPublished(checked)
      
      setTimeout(() => {
        toast.success(checked ? 'Профиль опубликован! 🎉' : 'Профиль снят с публикации')
      }, 0)
      
      onPublishChange?.()
    } catch (error: any) {
      console.error('[ProfileReadinessWidget] 💥 Error:', error)
      
      setTimeout(() => {
        toast.error('Ошибка обновления', {
          description: error.message || 'Попробуйте еще раз',
        })
      }, 0)
    } finally {
      setIsUpdating(false)
    }
  }

  // Определяем какие разделы нужно заполнить
  const getSectionForItem = (key: string): { section: string; label: string } => {
    const mapping: Record<string, { section: string; label: string }> = {
      hasName: { section: 'info', label: 'Данные → Основная информация' },
      hasContacts: { section: 'info', label: 'Данные → Контакты' },
      hasPhotos: { section: 'photos', label: 'Фото и видео' },
      hasServices: { section: 'services', label: 'Товары и услуги' },
      hasDescription: { section: 'info', label: 'Данные → Основная информация' },
      // Адреса/филиалы редактируются в отдельной вкладке
      hasAddress: { section: 'locations', label: 'Адреса и филиалы' },
    }
    return mapping[key] || { section: 'info', label: 'Данные' }
  }

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)]">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${readiness.isReady ? 'bg-green-50' : 'bg-orange-50'}`}>
          <div className={`w-3 h-3 rounded-full ${readiness.isReady ? 'bg-green-500' : 'bg-orange-500'}`} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          Готовность профиля
        </h3>
      </div>

      {/* Прогресс */}
      <div className="mb-4">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${readiness.isReady ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ 
              width: `${(Object.values(readiness.checklist).filter(Boolean).length / 6) * 100}%` 
            }}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-2 font-medium">
          {Object.values(readiness.checklist).filter(Boolean).length}/6 заполнено
        </p>
      </div>

      {/* Разделитель */}
      <div className="h-[1px] bg-gray-100 mb-4" />

      {/* Чеклист */}
      <div className="space-y-2 mb-4">
        {Object.entries(readiness.checklist).map(([key, isChecked]) => {
          const labels: Record<string, string> = {
            hasName: 'Название',
            hasContacts: 'Контакты',
            hasPhotos: 'Фотографии (3+)',
            hasServices: 'Услуги (1+)',
            hasDescription: 'Описание',
            hasAddress: 'Адрес',
          }

          return (
            <div key={key} className="flex items-center gap-3 p-2 rounded-[18px] hover:bg-gray-50 transition-colors">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                isChecked ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                {isChecked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" strokeWidth={2.5} />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-gray-300" strokeWidth={2.5} />
                )}
              </div>
              <span className={`text-[13px] font-medium ${isChecked ? 'text-gray-700' : 'text-gray-400'}`}>
                {labels[key]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Разделитель */}
      <div className="h-[1px] bg-gray-100 mb-4" />

      {/* Тумблер публикации - показываем всегда */}
      <div className="p-3 rounded-[18px] bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="publish-toggle" className="text-[13px] font-bold text-gray-900 cursor-pointer">
            Опубликован
          </Label>
          <Switch
            id="publish-toggle"
            checked={localPublished}
            onCheckedChange={handlePublishToggle}
            disabled={isUpdating}
          />
        </div>
        <p className="text-[11px] text-gray-500 font-medium">
          {localPublished ? 'Профиль виден всем' : 'Профиль скрыт'}
        </p>
        {!readiness.isReady && (
          <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-[18px] mt-3">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-orange-800 font-medium">
              Для публикации заполните: {readiness.missingItems.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Экспорт функции для получения незаполненных разделов
export function getIncompleteSections(profile: any, services: any[] = []): string[] {
  const readiness = checkProfileReadiness(profile, services)
  const incompleteSections = new Set<string>()

  Object.entries(readiness.checklist).forEach(([key, isChecked]) => {
    if (!isChecked) {
      const mapping: Record<string, string> = {
        hasName: 'info',
        hasContacts: 'info',
        hasPhotos: 'photos',
        hasServices: 'services',
        hasDescription: 'info',
        hasAddress: 'locations',
      }
      incompleteSections.add(mapping[key] || 'info')
    }
  })

  return Array.from(incompleteSections)
}

