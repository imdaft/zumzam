'use client'

import { Heart, Bell, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface HeaderIconsProps {
  mode: 'client' | 'service'
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'payment' | 'message' | 'system'
  read: boolean
  created_at: string
  action_url?: string
}

interface ChatPreview {
  id: string
  order_id: string
  order_number: string
  client_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export function HeaderIcons({ mode }: HeaderIconsProps) {
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Загрузка данных
  useEffect(() => {
    loadData()
    // Обновляем каждые 30 секунд
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [mode])

  const loadData = async () => {
    try {
      // Загрузка избранного (только для клиентов)
      if (mode === 'client') {
        const favResponse = await fetch('/api/favorites/count')
        if (favResponse.ok) {
          const { count } = await favResponse.json()
          setFavoritesCount(count)
        }
      }

      // Загрузка уведомлений
      const notifResponse = await fetch('/api/notifications')
      if (notifResponse.ok) {
        const { notifications: notifData } = await notifResponse.json()
        setNotifications(notifData)
        setUnreadNotifications(notifData.filter((n: Notification) => !n.read).length)
      }

      // Загрузка чатов/сообщений
      const chatsResponse = await fetch('/api/messages/chats')
      if (chatsResponse.ok) {
        const { chats: chatsData } = await chatsResponse.json()
        setChats(chatsData)
        setUnreadMessages(chatsData.reduce((sum: number, chat: ChatPreview) => sum + chat.unread_count, 0))
      }
    } catch (error) {
      console.error('Error loading header data:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      loadData()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Избранное - только для клиентов */}
      {mode === 'client' && (
        <Link href="/favorites">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-red-50 transition-all group"
          >
            <Heart className={cn(
              "h-5 w-5 transition-all group-hover:scale-110",
              favoritesCount > 0 ? "text-red-500 fill-red-500" : "text-slate-600"
            )} />
            {favoritesCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] bg-gradient-to-r from-red-500 to-pink-500 border-0 shadow-lg animate-in zoom-in-50"
              >
                {favoritesCount}
              </Badge>
            )}
          </Button>
        </Link>
      )}

      {/* Уведомления */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-orange-50 transition-all group"
          >
            <Bell className={cn(
              "h-5 w-5 transition-all group-hover:scale-110",
              unreadNotifications > 0 ? "text-orange-500 animate-pulse" : "text-slate-600"
            )} />
            {unreadNotifications > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] bg-gradient-to-r from-orange-500 to-red-500 border-0 shadow-lg animate-in zoom-in-50"
              >
                {unreadNotifications}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0 rounded-[24px] border-none shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] overflow-hidden bg-white mt-2" 
          align="end"
        >
          {/* Header Section */}
          <div className="p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-sm">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-[17px] font-bold text-gray-900">
                  Уведомления
                </h3>
              </div>
              {unreadNotifications > 0 && (
                <Badge className="text-xs font-bold bg-orange-100 text-orange-700 border-0 px-3 py-1 rounded-full shadow-sm">
                  {unreadNotifications} новых
                </Badge>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-gray-100" />

          {/* Notifications List */}
          <div className="p-2">
            <ScrollArea className="h-[400px] px-2">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-[15px] text-gray-900 font-semibold">
                    Нет уведомлений
                  </p>
                  <p className="text-[13px] text-gray-500 mt-1">
                    Здесь будут появляться важные события
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-[16px] cursor-pointer transition-all",
                        !notification.read 
                          ? "bg-gradient-to-br from-orange-50 to-pink-50 hover:bg-gradient-to-br hover:from-orange-100 hover:to-pink-100" 
                          : "bg-white hover:bg-gray-50"
                      )}
                      onClick={async () => {
                        // Отмечаем как прочитанное и переходим
                        if (!notification.read) {
                          await markNotificationAsRead(notification.id)
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0 shadow-sm">
                          <Bell className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[15px] font-semibold text-gray-900 leading-tight">{notification.title}</p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>

      {/* Сообщения */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-blue-50 transition-all group"
          >
            <MessageCircle className={cn(
              "h-5 w-5 transition-all group-hover:scale-110",
              unreadMessages > 0 ? "text-blue-500 animate-pulse" : "text-slate-600"
            )} />
            {unreadMessages > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 border-0 shadow-lg animate-in zoom-in-50"
              >
                {unreadMessages}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0 rounded-[24px] border-none shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] overflow-hidden bg-white mt-2" 
          align="end"
        >
          {/* Header Section */}
          <div className="p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-[17px] font-bold text-gray-900">
                  Сообщения
                </h3>
              </div>
              {unreadMessages > 0 && (
                <Badge className="text-xs font-bold bg-blue-100 text-blue-700 border-0 px-3 py-1 rounded-full shadow-sm">
                  {unreadMessages} новых
                </Badge>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-gray-100" />

          {/* Messages List */}
          <div className="p-2">
            <ScrollArea className="h-[400px] px-2">
              {chats.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-[15px] text-gray-900 font-semibold">
                    Нет сообщений
                  </p>
                  <p className="text-[13px] text-gray-500 mt-1">
                    Здесь будут ваши чаты с {mode === 'service' ? 'клиентами' : 'сервисами'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/crm/orders/${chat.order_id}`}
                      className={cn(
                        "block p-3 rounded-[16px] transition-all",
                        chat.unread_count > 0 
                          ? "bg-gradient-to-br from-blue-50 to-indigo-50 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100" 
                          : "bg-white hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[15px] font-semibold text-gray-900 leading-tight truncate">
                              {mode === 'service' ? chat.client_name : `Заказ #${chat.order_number}`}
                            </p>
                            {chat.unread_count > 0 && (
                              <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 border-0 shadow-sm shrink-0">
                                {chat.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed mt-1">
                            {chat.last_message}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                            {formatDistanceToNow(new Date(chat.last_message_at), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

