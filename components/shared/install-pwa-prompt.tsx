'use client'

import { useState, useEffect } from 'react'
import { X, Download, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/lib/hooks/usePWA'

/**
 * Компонент предложения установки PWA
 * Показывается внизу экрана на мобильных устройствах
 */
export function InstallPWAPrompt() {
  const { isInstallable, isInstalled, installApp, isPushSupported, isPushEnabled, enablePush } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showPushPrompt, setShowPushPrompt] = useState(false)

  // Проверяем, отклонял ли пользователь ранее
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) {
      const dismissedAt = new Date(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
      // Показываем снова через 7 дней
      if (daysSinceDismissed < 7) {
        setIsDismissed(true)
      }
    }
  }, [])

  // Скрываем если уже установлено или отклонено
  if (isInstalled || isDismissed || (!isInstallable && !showPushPrompt)) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString())
  }

  const handleInstall = async () => {
    await installApp()
    // После установки предлагаем включить уведомления
    if (isPushSupported && !isPushEnabled) {
      setShowPushPrompt(true)
    }
  }

  const handleEnablePush = async () => {
    await enablePush()
    setShowPushPrompt(false)
    setIsDismissed(true)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 safe-area-inset-bottom">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-4 animate-in slide-in-from-bottom duration-300">
        {/* Кнопка закрытия */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {showPushPrompt ? (
          // Промпт для push-уведомлений
          <div className="flex items-start gap-4 pr-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Включить уведомления?
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Узнавайте о статусе заказов и акциях первыми
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEnablePush}>
                  Включить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsDismissed(true)}>
                  Позже
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Промпт для установки
          <div className="flex items-start gap-4 pr-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Установить ZumZam
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Добавьте на главный экран для быстрого доступа
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall}>
                  Установить
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Не сейчас
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

