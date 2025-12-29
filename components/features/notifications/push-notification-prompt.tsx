'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'

/**
 * Компонент для запроса разрешения на браузерные push-уведомления
 * Показывается один раз, если пользователь ещё не дал разрешение
 */
export function PushNotificationPrompt() {
  const { isAuthenticated, user } = useAuth()
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Проверяем, поддерживает ли браузер push-уведомления
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return
    }

    // Проверяем, уже спрашивали или нет
    const hasAsked = localStorage.getItem('push-notification-asked')
    const permission = Notification.permission

    // Показываем промпт только если:
    // 1. Ещё не спрашивали
    // 2. Разрешение не дано и не запрещено
    if (!hasAsked && permission === 'default') {
      // Показываем через 5 секунд после загрузки
      const timeout = setTimeout(() => {
        setShow(true)
      }, 5000)

      return () => clearTimeout(timeout)
    }
  }, [isAuthenticated, user])

  const handleEnable = async () => {
    setIsLoading(true)
    
    try {
      // Запрашиваем разрешение
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Регистрируем service worker
        const registration = await navigator.serviceWorker.ready
        
        // Получаем VAPID public key
        const response = await fetch('/api/push/vapid-public-key')
        const { publicKey } = await response.json()
        
        // Подписываемся на push-уведомления
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
        
        // Отправляем подписку на сервер
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON())
        })
        
        console.log('[Push] Subscription saved')
      }
      
      // Сохраняем, что уже спрашивали
      localStorage.setItem('push-notification-asked', 'true')
      setShow(false)
    } catch (error) {
      console.error('[Push] Error enabling notifications:', error)
      localStorage.setItem('push-notification-asked', 'true')
      setShow(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('push-notification-asked', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm">
      <div className="bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 p-5 relative animate-in slide-in-from-bottom-4 fade-in duration-300">
        {/* Кнопка закрытия */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Иконка */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Включить уведомления?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Получайте мгновенные уведомления о новых заказах, сообщениях и откликах
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2">
          <Button
            onClick={handleEnable}
            disabled={isLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full h-10 font-semibold transition-all"
          >
            {isLoading ? 'Включаем...' : 'Включить'}
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full h-10 font-semibold transition-all"
          >
            Позже
          </Button>
        </div>
      </div>
    </div>
  )
}

// Utility для конвертации VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

