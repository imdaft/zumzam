'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  Bell, FileText, MessageSquare, Star, CreditCard, 
  CheckCircle, Clock, Trash2, Check, Loader2, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAuth } from '@/lib/contexts/auth-context'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read_at: string | null
  created_at: string
  action_url?: string
  data?: any
}

export default function NotificationsPage() {
  const { user } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Загружаем уведомления из API
  const loadNotifications = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read_at)
    : notifications

  const unreadCount = notifications.filter(n => !n.read_at).length

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ))
      // Отправляем событие для обновления маркеров в других компонентах
      window.dispatchEvent(new CustomEvent('notification-read'))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read_at)
    if (unread.length === 0) return

    // Оптимистично обновляем UI (одним проходом)
    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => (!n.read_at ? { ...n, read_at: now } : n)))

    // Параллельно отправляем запросы на сервер
    try {
      await Promise.all(
        unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'POST' }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
      // Перезагружаем, чтобы синхронизироваться с сервером
      loadNotifications()
    } finally {
      window.dispatchEvent(new CustomEvent('notification-read'))
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_response':
      case 'order': 
        return <FileText className="h-5 w-5 text-orange-600" />
      case 'new_message':
      case 'message': 
        return <MessageSquare className="h-5 w-5 text-orange-500" />
      case 'response_accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'response_rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'review': 
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'payment': 
        return <CreditCard className="h-5 w-5 text-green-600" />
      default: 
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getIconBg = (type: string) => {
    switch (type) {
      case 'new_response':
      case 'order': 
      case 'new_message':
      case 'message': 
        return 'bg-orange-50'
      case 'response_accepted':
      case 'payment': 
        return 'bg-green-50'
      case 'response_rejected':
        return 'bg-red-50'
      case 'review': 
        return 'bg-yellow-50'
      default: 
        return 'bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20 px-0">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Sticky Header Panel */}
      <div className="sticky top-0 z-10 bg-[#F7F8FA] pt-2 max-w-3xl mx-auto">
        <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Уведомления</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет новых уведомлений'}
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="rounded-full h-10 px-4 text-sm font-semibold border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Check className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Прочитать все</span>
                <span className="sm:hidden">Все</span>
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-full h-10 px-5 text-sm font-bold shrink-0 transition-all',
                filter === 'all'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={cn(
                'rounded-full h-10 px-5 text-sm font-bold shrink-0 transition-all',
                filter === 'unread'
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Непрочитанные{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full py-4 pb-24 space-y-4 px-0 max-w-3xl mx-auto">
        {/* Notifications List */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-600">
              {filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет уведомлений'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={[
                  'p-4 sm:p-5 hover:bg-gray-50 transition-colors',
                  !notification.read_at ? 'bg-orange-50/60' : '',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-[18px] ${getIconBg(notification.type)} flex items-center justify-center flex-shrink-0`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {notification.action_url ? (
                          <Link href={notification.action_url} onClick={() => markAsRead(notification.id)}>
                            <h3 className={`font-semibold hover:text-orange-600 ${!notification.read_at ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                          </Link>
                        ) : (
                          <h3 className={`font-semibold ${!notification.read_at ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.body}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </span>
                      
                      <div className="flex items-center gap-1 ml-auto">
                        {!notification.read_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-sm rounded-full"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Прочитано
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-gray-400 hover:text-red-600"
                          onClick={() => deleteNotification(notification.id)}
                          aria-label="Удалить уведомление"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
