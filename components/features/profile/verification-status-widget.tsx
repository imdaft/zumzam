/**
 * Виджет статуса верификации профиля
 * Показывает текущий статус и чеклист для отправки на проверку
 */

'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, AlertCircle, Send } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { checkProfileReadiness, getVerificationStatusText } from '@/lib/utils/verification'

interface VerificationStatusWidgetProps {
  profile: any
  services?: any[]
  onStatusChange?: () => void
}

export function VerificationStatusWidget({ 
  profile, 
  services = [],
  onStatusChange 
}: VerificationStatusWidgetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const verificationStatus = profile.verification_status || 'draft'
  const statusInfo = getVerificationStatusText(verificationStatus)
  const readiness = checkProfileReadiness(profile, services)

  const handleSubmitForVerification = async () => {
    if (!readiness.isReady) {
      toast.error('Профиль не готов', {
        description: 'Пожалуйста, заполните все обязательные поля',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/profiles/${profile.id}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit for verification')
      }

      toast.success('Отправлено на проверку!', {
        description: 'Мы проверим ваш профиль в течение 1-2 рабочих дней',
      })
      
      onStatusChange?.()
    } catch (error) {
      console.error('Submit verification error:', error)
      toast.error('Ошибка отправки', {
        description: 'Не удалось отправить профиль на проверку',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 rounded-[24px] border-0 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{statusInfo.icon}</div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Верификация профиля</h3>
            <p className="text-sm text-gray-500 mt-1">{statusInfo.description}</p>
          </div>
        </div>
        <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0 px-3 py-1`}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Для статуса draft показываем чеклист */}
      {verificationStatus === 'draft' && (
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Чеклист для верификации:
            </p>
            
            {Object.entries(readiness.checklist).map(([key, isChecked]) => {
              const labels: Record<string, string> = {
                hasName: 'Название профиля',
                hasContacts: 'Телефон и email',
                hasPhotos: 'Минимум 3 фотографии',
                hasServices: 'Хотя бы 1 услуга',
                hasDescription: 'Описание (50+ символов)',
                hasAddress: 'Город и адрес',
              }

              return (
                <div key={key} className="flex items-center gap-3 py-2">
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300" strokeWidth={2.5} />
                  )}
                  <span className={`text-sm ${isChecked ? 'text-gray-700' : 'text-gray-400'}`}>
                    {labels[key]}
                  </span>
                </div>
              )
            })}
          </div>

          <Button
            onClick={handleSubmitForVerification}
            disabled={!readiness.isReady || isSubmitting}
            className="w-full rounded-[16px] bg-blue-500 hover:bg-blue-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Отправить на верификацию
              </>
            )}
          </Button>

          {!readiness.isReady && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-[16px] border border-yellow-200">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Заполните все поля</p>
                <p className="text-xs">
                  Для отправки на верификацию необходимо выполнить все пункты чеклиста
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Для статуса pending показываем информацию об ожидании */}
      {verificationStatus === 'pending' && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-[16px] border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Ваш профиль отправлен на модерацию. Обычно проверка занимает <strong>1-2 рабочих дня</strong>.
            Мы уведомим вас по email о результатах проверки.
          </p>
        </div>
      )}

      {/* Для статуса rejected показываем причину и возможность переотправки */}
      {verificationStatus === 'rejected' && profile.rejection_reason && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-red-50 rounded-[16px] border border-red-200">
            <p className="text-sm font-semibold text-red-800 mb-2">Причина отклонения:</p>
            <p className="text-sm text-red-700">{profile.rejection_reason}</p>
          </div>

          <Button
            onClick={handleSubmitForVerification}
            disabled={!readiness.isReady || isSubmitting}
            variant="outline"
            className="w-full rounded-[16px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Отправить повторно
              </>
            )}
          </Button>
        </div>
      )}

      {/* Для статуса approved показываем поздравление */}
      {verificationStatus === 'approved' && (
        <div className="mt-6 p-4 bg-green-50 rounded-[16px] border border-green-200">
          <p className="text-sm text-green-800">
            🎉 Поздравляем! Ваш профиль успешно прошёл верификацию.
            Теперь у вас есть значок подтверждённого профиля.
          </p>
        </div>
      )}
    </Card>
  )
}

