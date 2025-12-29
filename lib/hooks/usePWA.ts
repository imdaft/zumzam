/**
 * Хук для работы с PWA функциональностью
 * 
 * Включает:
 * - Регистрация Service Worker
 * - Push-уведомления
 * - Установка приложения
 */

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAReturn {
  // Service Worker
  isServiceWorkerReady: boolean
  swRegistration: ServiceWorkerRegistration | null
  
  // Push уведомления
  isPushSupported: boolean
  isPushEnabled: boolean
  enablePush: () => Promise<boolean>
  disablePush: () => Promise<void>
  
  // Установка
  isInstallable: boolean
  isInstalled: boolean
  installApp: () => Promise<void>
}

// Ключ VAPID для push (нужно заменить на свой)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || ''

export function usePWA(): UsePWAReturn {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Проверка поддержки push
  const isPushSupported = typeof window !== 'undefined' && 
    'PushManager' in window && 
    'serviceWorker' in navigator

  // Проверка возможности установки
  const isInstallable = installPrompt !== null

  // Регистрация Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // В dev-режиме принудительно отключаем SW и чистим его кэши,
    // иначе браузер может отдавать "устаревший" UI из Cache Storage.
    if (process.env.NODE_ENV !== 'production') {
      const disableDevSW = async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((r) => r.unregister()))
        } catch (error) {
          logger.warn('[PWA] Failed to unregister Service Worker in dev', error)
        }

        try {
          if ('caches' in window) {
            const keys = await caches.keys()
            await Promise.all(keys.map((k) => caches.delete(k)))
          }
        } catch (error) {
          logger.warn('[PWA] Failed to clear Cache Storage in dev', error)
        }

        setSwRegistration(null)
        setIsServiceWorkerReady(false)
        setIsPushEnabled(false)
      }

      void disableDevSW()
      return
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        logger.info('[PWA] Service Worker registered', {
          scope: registration.scope
        })

        setSwRegistration(registration)
        setIsServiceWorkerReady(true)

        // Проверяем текущий статус push
        if (registration.pushManager) {
          const subscription = await registration.pushManager.getSubscription()
          setIsPushEnabled(!!subscription)
        }

        // Обновляем SW при обнаружении новой версии
        registration.addEventListener('updatefound', () => {
          logger.info('[PWA] New Service Worker found')
        })

      } catch (error) {
        logger.error('[PWA] Service Worker registration failed', error)
      }
    }

    registerSW()

    // Проверяем, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Слушаем событие beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      logger.info('[PWA] Install prompt available')
    }

    // Слушаем успешную установку
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      logger.info('[PWA] App installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Включение push-уведомлений
  const enablePush = useCallback(async (): Promise<boolean> => {
    if (!swRegistration || !isPushSupported) {
      logger.warn('[PWA] Push not supported')
      return false
    }

    try {
      // Запрашиваем разрешение
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        logger.info('[PWA] Push permission denied')
        return false
      }

      // Подписываемся на push
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Отправляем подписку на сервер
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setIsPushEnabled(true)
      logger.info('[PWA] Push enabled')
      return true

    } catch (error) {
      logger.error('[PWA] Enable push failed', error)
      return false
    }
  }, [swRegistration, isPushSupported])

  // Отключение push-уведомлений
  const disablePush = useCallback(async (): Promise<void> => {
    if (!swRegistration) return

    try {
      const subscription = await swRegistration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Уведомляем сервер
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsPushEnabled(false)
      logger.info('[PWA] Push disabled')

    } catch (error) {
      logger.error('[PWA] Disable push failed', error)
    }
  }, [swRegistration])

  // Установка приложения
  const installApp = useCallback(async (): Promise<void> => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      logger.info('[PWA] Install prompt result', { outcome })
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      
      setInstallPrompt(null)
    } catch (error) {
      logger.error('[PWA] Install failed', error)
    }
  }, [installPrompt])

  return {
    isServiceWorkerReady,
    swRegistration,
    isPushSupported,
    isPushEnabled,
    enablePush,
    disablePush,
    isInstallable,
    isInstalled,
    installApp,
  }
}

// Хелпер для конвертации VAPID ключа
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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

