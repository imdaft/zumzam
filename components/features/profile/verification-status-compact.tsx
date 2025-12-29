/**
 * Компактный виджет статуса верификации для сайдбара
 * Показывает текущий статус и краткую информацию
 */

'use client'

import { useState } from 'react'
import { CheckCircle2, Shield, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { checkProfileReadiness, getVerificationStatusText } from '@/lib/utils/verification'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface VerificationStatusCompactProps {
  profile: any
  services?: any[]
  onStatusChange?: () => void
}

export function VerificationStatusCompact({ 
  profile, 
  services = [],
  onStatusChange 
}: VerificationStatusCompactProps) {
  const [showDetails, setShowDetails] = useState(false)
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
      
      setShowDetails(false)
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

  // Определяем иконку и цвет
  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" strokeWidth={2.5} />
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
      default:
        return <Shield className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
    }
  }

  return (
    <>
      {/* Компактный виджет */}
      <button
        onClick={() => setShowDetails(true)}
        className="w-full bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-slate-200 text-left group"
      >
        <div className="flex items-center gap-2 mb-2">
          {getStatusIcon()}
          <span className="text-xs font-bold text-slate-700">Верификация</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
        </div>
        
        {/* Прогресс бар для draft */}
        {verificationStatus === 'draft' && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all" 
                style={{ 
                  width: `${(Object.values(readiness.checklist).filter(Boolean).length / 6) * 100}%` 
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {Object.values(readiness.checklist).filter(Boolean).length}/6 выполнено
            </p>
          </div>
        )}
      </button>

      {/* Детальный диалог */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="rounded-[24px] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{statusInfo.icon}</span>
              Верификация профиля
            </DialogTitle>
            <DialogDescription>
              {statusInfo.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Статус */}
            <div className={`p-3 rounded-[16px] ${statusInfo.bgColor} border-2 border-opacity-50`}>
              <p className={`text-sm font-bold ${statusInfo.color}`}>
                Статус: {statusInfo.label}
              </p>
            </div>

            {/* Для статуса draft показываем чеклист */}
            {verificationStatus === 'draft' && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
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
                      <div key={key} className="flex items-center gap-2 py-1">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" strokeWidth={2.5} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={`text-xs ${isChecked ? 'text-gray-700' : 'text-gray-400'}`}>
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
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Отправить на верификацию
                    </>
                  )}
                </Button>

                {!readiness.isReady && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-[12px] border border-yellow-200">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-800">
                      Заполните все пункты чеклиста
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Для статуса pending */}
            {verificationStatus === 'pending' && (
              <div className="p-3 bg-yellow-50 rounded-[16px] border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  Ваш профиль на модерации. Обычно это занимает <strong>1-2 дня</strong>.
                </p>
              </div>
            )}

            {/* Для статуса rejected */}
            {verificationStatus === 'rejected' && profile.rejection_reason && (
              <>
                <div className="p-3 bg-red-50 rounded-[16px] border border-red-200">
                  <p className="text-xs font-semibold text-red-800 mb-1">Причина отклонения:</p>
                  <p className="text-xs text-red-700">{profile.rejection_reason}</p>
                </div>

                <Button
                  onClick={handleSubmitForVerification}
                  disabled={!readiness.isReady || isSubmitting}
                  variant="outline"
                  className="w-full rounded-[16px]"
                  size="sm"
                >
                  Отправить повторно
                </Button>
              </>
            )}

            {/* Для статуса approved */}
            {verificationStatus === 'approved' && (
              <div className="p-3 bg-green-50 rounded-[16px] border border-green-200">
                <p className="text-xs text-green-800">
                  🎉 Поздравляем! Ваш профиль верифицирован.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

