'use client'

import Link from 'next/link'
import { Heart, Bell, MessageSquare, LayoutDashboard, Shield, ChevronRight, User, MoreHorizontal, Trash2, FileText, CheckCircle, XCircle, Megaphone } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useState, useEffect, useCallback, useRef } from 'react'
import { initNotificationSound, playNotificationSound } from '@/lib/utils/notification-sound'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  action_url?: string
  created_at: string
  read_at: string | null
}

interface MessageItem {
  id: string
  sender: string
  context: string
  text: string
  time: string
}

/**
 * Кнопки быстрого доступа в header
 * Синхронизировано с dashboard layout
 */
export function HeaderActions() {
  const { isAuthenticated, isClient, isProvider, isAdmin, user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const countsRef = useRef({ unreadNotifications: 0, unreadMessages: 0 })
  const hasLoadedRef = useRef(false)

  // Форматирование времени
  const formatTimeAgo = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'только что'
    if (diffMins < 60) return `${diffMins} мин`
    if (diffHours < 24) return `${diffHours} ч`
    if (diffDays < 7) return `${diffDays} д`
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }, [])

  // Загрузка уведомлений
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      const response = await fetch('/api/notifications?limit=5')
      if (response.ok) {
        const data = await response.json()
        const nextUnread = data.notifications?.filter((n: NotificationItem) => !n.read_at).length || 0

        if (hasLoadedRef.current && nextUnread > countsRef.current.unreadNotifications) {
          playNotificationSound('notification')
        }
        countsRef.current.unreadNotifications = nextUnread
        hasLoadedRef.current = true

        setNotifications(data.notifications || [])
        setUnreadNotifications(nextUnread)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }, [user?.id])

  // Загрузка сообщений
  const loadMessages = useCallback(async () => {
    if (!user?.id) return
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        const conversations = data.conversations || []
        
        // Определяем собеседника
        const getInterlocutorName = (conv: any) => {
          const isProfileOwner = conv.profiles?.user_id === user?.id
          if (isProfileOwner) {
            return conv.other_participant?.full_name || 'Клиент'
          }
          return conv.profiles?.display_name || conv.other_participant?.full_name || 'Пользователь'
        }
        
        const recent = conversations
          .filter((c: any) => c.last_message_preview)
          .slice(0, 3)
          .map((c: any) => ({
            id: c.id,
            sender: getInterlocutorName(c),
            context: (() => {
              if (c.source_type === 'request') {
                const title = c.order_requests?.title
                return title ? `Объявление: ${title}` : 'Объявление'
              }
              if (c.source_type === 'order') {
                const num = c.order?.order_number
                return num ? `Заказ №${num}` : 'Заказ'
              }
              return 'Диалог'
            })(),
            text: c.last_message_preview || '',
            time: c.last_message_at ? formatTimeAgo(c.last_message_at) : '',
          }))
        
        setMessages(recent)
        const nextUnread = conversations.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0)

        if (hasLoadedRef.current && nextUnread > countsRef.current.unreadMessages) {
          playNotificationSound('message')
        }
        countsRef.current.unreadMessages = nextUnread
        hasLoadedRef.current = true

        setUnreadMessages(nextUnread)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [user?.id, formatTimeAgo])

  // Пометка уведомления как прочитанного
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      // Обновляем список уведомлений
      await loadNotifications()
      // Отправляем событие для обновления счетчика в других компонентах
      window.dispatchEvent(new CustomEvent('notification-read'))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Загружаем данные при монтировании и открытии dropdown'ов
  useEffect(() => {
    if (user?.id) {
      initNotificationSound()
      loadNotifications()
      loadMessages()
    }
  }, [user?.id, loadNotifications, loadMessages])

  // Периодическое обновление, чтобы маркеры были "живыми" даже без realtime на public layout
  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(() => {
      loadNotifications()
      loadMessages()
    }, 30000)
    return () => clearInterval(interval)
  }, [user?.id, loadNotifications, loadMessages])

  useEffect(() => {
    if (notificationsOpen) loadNotifications()
  }, [notificationsOpen, loadNotifications])

  useEffect(() => {
    if (messagesOpen) loadMessages()
  }, [messagesOpen, loadMessages])

  // Слушаем событие обновления уведомлений из других компонентов
  useEffect(() => {
    const handleNotificationRead = () => {
      loadNotifications() // Перезагружаем уведомления
    }
    
    window.addEventListener('notification-read', handleNotificationRead)
    
    return () => {
      window.removeEventListener('notification-read', handleNotificationRead)
    }
  }, [loadNotifications])

  if (!isAuthenticated) {
    return null
  }

  // Иконка уведомления по типу
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_response': return <FileText className="w-4 h-4 text-orange-600" />
      case 'response_accepted': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'response_rejected': return <XCircle className="w-4 h-4 text-red-600" />
      case 'new_message': return <MessageSquare className="w-4 h-4 text-blue-600" />
      default: return <Bell className="w-4 h-4 text-orange-600" />
    }
  }

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'new_response': return 'bg-orange-100'
      case 'response_accepted': return 'bg-green-100'
      case 'response_rejected': return 'bg-red-100'
      case 'new_message': return 'bg-blue-100'
      default: return 'bg-orange-100'
    }
  }

  return (
    <div className="flex items-center">
      {/* Избранное - для клиентов */}
      {isClient && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              href="/favorites" 
              className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Heart className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Избранное</TooltipContent>
        </Tooltip>
      )}

      {/* Уведомления - dropdown в стиле Яндекса */}
      {isAuthenticated && (
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Уведомления</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-96 p-0" align="end">
            {/* Заголовок в стиле Яндекса */}
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setNotifications([])}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить все
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Список уведомлений */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bell className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Нет новых уведомлений</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.action_url || '/notifications'}
                    className={`flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100 first:border-t-0 ${!notif.read_at ? 'bg-orange-50/50' : ''}`}
                    onClick={() => {
                      // Помечаем как прочитанное при клике
                      if (!notif.read_at) {
                        markNotificationAsRead(notif.id)
                      }
                      setNotificationsOpen(false)
                    }}
                  >
                    {/* Иконка */}
                    <div className={`w-10 h-10 ${getNotificationBg(notif.type)} rounded-full flex items-center justify-center shrink-0`}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    
                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-medium text-gray-900 leading-snug">
                          {notif.title}
                          <ChevronRight className="w-4 h-4 inline ml-1 text-gray-400" />
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {notif.body}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            
            {/* Футер */}
            <div className="border-t border-gray-100">
              <Link
                href="/notifications"
                className="flex items-center justify-center gap-1 px-5 py-3 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-gray-50 transition-colors"
                onClick={() => setNotificationsOpen(false)}
              >
                Все уведомления
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Сообщения - dropdown в стиле Яндекса */}
      {isAuthenticated && (
        <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Сообщения</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-96 p-0" align="end">
            {/* Заголовок */}
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Сообщения</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setMessages([])}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить все
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Список чатов */}
            <div className="max-h-[400px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Нет сообщений</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <Link
                    key={msg.id}
                    href={`/messages?chat=${msg.id}`}
                    className="flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100 first:border-t-0"
                    onClick={() => setMessagesOpen(false)}
                  >
                    {/* Аватар */}
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-medium text-gray-900">
                          {msg.sender}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                        {msg.context}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {msg.text}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            
            {/* Футер */}
            <div className="border-t border-gray-100">
              <Link
                href="/messages"
                className="flex items-center justify-center gap-1 px-5 py-3 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMessagesOpen(false)}
              >
                Все сообщения
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Доска объявлений */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/#board"
            className="p-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
          >
            <Megaphone className="w-5 h-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom">Доска объявлений</TooltipContent>
      </Tooltip>

      {/* Админ-панель */}
      {isAdmin && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              href="/admin" 
              className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <Shield className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Админ-панель</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
