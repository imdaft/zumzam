'use client'

import Link from 'next/link'
import { Bell, MessageCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { initNotificationSound, playNotificationSound } from '@/lib/utils/notification-sound'

/**
 * Мобильные иконки уведомлений и сообщений в хедере
 * ОПТИМИЗИРОВАНО: 1 запрос вместо 2
 */
export function MobileHeaderIcons() {
  const { isAuthenticated, user } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const countsRef = useRef({ unreadNotifications: 0, unreadMessages: 0 })
  const hasLoadedCountsRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    
    initNotificationSound()

    const loadCounts = async () => {
      try {
        // ОДИН запрос вместо двух!
        const response = await fetch('/api/user/counts')
        
        if (!response.ok) {
          // Не логируем 401 (это нормально при выходе)
          if (response.status !== 401) {
            console.error('[MobileHeaderIcons] Failed to load counts:', response.status)
          }
          return
        }
        
        const data = await response.json()
        const nextUnreadNotifications = data.unreadNotifications || 0
        const nextUnreadMessages = data.unreadMessages || 0

        const prev = countsRef.current
        if (hasLoadedCountsRef.current) {
          if (nextUnreadNotifications > prev.unreadNotifications) {
            playNotificationSound('notification')
          }
          if (nextUnreadMessages > prev.unreadMessages) {
            playNotificationSound('message')
          }
        }
        countsRef.current = {
          unreadNotifications: nextUnreadNotifications,
          unreadMessages: nextUnreadMessages,
        }
        hasLoadedCountsRef.current = true

        setUnreadNotifications(nextUnreadNotifications)
        setUnreadMessages(nextUnreadMessages)
      } catch (error) {
        // Игнорируем ошибки сети (может быть оффлайн или сервер перезагружается)
        console.warn('[MobileHeaderIcons] Network error loading counts:', error)
      }
    }

    loadCounts()
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(loadCounts, 30000)
    
    // Слушаем событие обновления уведомлений из других компонентов
    const handleNotificationRead = () => {
      console.log('[MobileHeaderIcons] Notification read event received, reloading counts')
      loadCounts()
    }
    
    window.addEventListener('notification-read', handleNotificationRead)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('notification-read', handleNotificationRead)
    }
  }, [isAuthenticated, user?.id])

  if (!isAuthenticated) return null

  return (
    <div className="flex items-center gap-1">
      {/* Сообщения */}
      <Link 
        href="/messages"
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MessageCircle className="h-5 w-5" />
        {unreadMessages > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-blue-500 rounded-full">
            {unreadMessages > 99 ? '99+' : unreadMessages}
          </span>
        )}
      </Link>

      {/* Уведомления */}
      <Link 
        href="/notifications"
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-orange-500 rounded-full">
            {unreadNotifications > 99 ? '99+' : unreadNotifications}
          </span>
        )}
      </Link>
    </div>
  )
}


