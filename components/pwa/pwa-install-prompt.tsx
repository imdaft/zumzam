'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Проверяем, установлено ли уже приложение
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    checkInstalled()

    // Слушаем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Показываем промпт через некоторое время
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // Слушаем событие appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('Пользователь установил PWA')
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Ошибка установки PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Сохраняем в localStorage, чтобы не показывать снова
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Не показываем если уже установлено или пользователь отказался
  if (isInstalled || !showPrompt || localStorage.getItem('pwa-prompt-dismissed')) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-orange-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Установить ZumZam
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Добавьте приложение на домашний экран для быстрого доступа и уведомлений
            </p>

            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleInstall}
                size="sm"
                className="text-xs px-3 py-1 h-7"
              >
                Установить
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="text-xs px-3 py-1 h-7"
              >
                Позже
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}













