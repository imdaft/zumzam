import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

interface RealtimeNotification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  created_at: string
}

interface RealtimeMessage {
  id: string
  conversation_id: string
  sender_name: string
  sender_avatar?: string
  content: string
  created_at: string
}

interface UseRealtimeNotificationsOptions {
  onNotificationCreated?: (data: { count: number; notifications: RealtimeNotification[] }) => void
  onMessageReceived?: (data: { count: number; messages: RealtimeMessage[] }) => void
  enabled?: boolean
}

/**
 * Хук для подключения к SSE (Server-Sent Events) для realtime обновлений
 * 
 * @example
 * useRealtimeNotifications({
 *   onNotificationCreated: (data) => {
 *     console.log('New notifications:', data.count)
 *     loadNotifications()
 *   },
 *   onMessageReceived: (data) => {
 *     console.log('New messages:', data.count)
 *     loadMessages()
 *   }
 * })
 */
export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { isAuthenticated, user } = useAuth()
  const { onNotificationCreated, onMessageReceived, enabled = true } = options
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id || !enabled) return

    // Закрываем предыдущее соединение
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    console.log('[Realtime] Connecting to SSE...')

    const eventSource = new EventSource('/api/realtime/notifications')
    eventSourceRef.current = eventSource

    // Обработка события "notification-created"
    eventSource.addEventListener('notification-created', (event) => {
      const data = JSON.parse(event.data)
      console.log('[Realtime] Notification created:', data)
      
      // Воспроизводим звук уведомления
      const audio = new Audio('/sounds/notification.mp3')
      audio.play().catch(err => console.warn('Cannot play notification sound:', err))
      
      // Вызываем callback
      if (onNotificationCreated) {
        onNotificationCreated(data)
      }
      
      // Диспатчим событие для других компонентов
      window.dispatchEvent(new CustomEvent('realtime-notification-created', { detail: data }))
    })

    // Обработка события "message-received"
    eventSource.addEventListener('message-received', (event) => {
      const data = JSON.parse(event.data)
      console.log('[Realtime] Message received:', data)
      
      // Воспроизводим звук сообщения
      const audio = new Audio('/sounds/message.mp3')
      audio.play().catch(err => console.warn('Cannot play message sound:', err))
      
      // Вызываем callback
      if (onMessageReceived) {
        onMessageReceived(data)
      }
      
      // Диспатчим событие для других компонентов
      window.dispatchEvent(new CustomEvent('realtime-message-received', { detail: data }))
    })

    // Обработка ошибок и переподключение
    eventSource.onerror = (error) => {
      console.error('[Realtime] SSE error:', error)
      eventSource.close()
      
      // Переподключаемся через 3 секунды
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[Realtime] Reconnecting...')
        connect()
      }, 3000)
    }

    eventSource.onopen = () => {
      console.log('[Realtime] SSE connected')
    }
  }, [isAuthenticated, user?.id, enabled, onNotificationCreated, onMessageReceived])

  useEffect(() => {
    connect()

    // Очистка при размонтировании
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect
  }
}

