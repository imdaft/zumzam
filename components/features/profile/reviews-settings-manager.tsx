'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ReviewsSettingsManagerProps {
  profileId: string
  initialSource?: 'internal' | 'yandex'
}

export function ReviewsSettingsManager({ profileId, initialSource = 'internal' }: ReviewsSettingsManagerProps) {
  const [source, setSource] = useState(initialSource)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (newSource: 'internal' | 'yandex') => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          details: { reviews_source: newSource }
        })
      })

      if (!res.ok) throw new Error('Ошибка сохранения')

      setSource(newSource)
      setTimeout(() => toast.success('Настройки сохранены!'), 0)
    } catch (err) {
      setTimeout(() => toast.error('Не удалось сохранить'), 0)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Настройка отзывов</h3>
          <p className="text-sm text-gray-500">Выберите источник отзывов для профиля</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Внутренние отзывы */}
        <button
          type="button"
          onClick={() => handleSave('internal')}
          disabled={isSaving}
          className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
            source === 'internal'
              ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
              source === 'internal' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
            }`}>
              {source === 'internal' && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Внутренние отзывы</h4>
              <p className="text-sm text-gray-600">
                Клиенты оставляют отзывы напрямую на вашей странице ZumZam
              </p>
            </div>
          </div>
        </button>

        {/* Отзывы с Яндекс.Карт */}
        <button
          type="button"
          onClick={() => handleSave('yandex')}
          disabled={isSaving}
          className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
            source === 'yandex'
              ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
              source === 'yandex' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
            }`}>
              {source === 'yandex' && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Отзывы с Яндекс.Карт</h4>
              <p className="text-sm text-gray-600">
                Показывайте отзывы с Яндекс.Карт (укажите ссылку в настройках адресов)
              </p>
            </div>
          </div>
        </button>
      </div>

      {isSaving && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Сохранение...
        </div>
      )}
    </div>
  )
}















