'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/lib/contexts/auth-context'
import { initNotificationSound, playNotificationSound } from '@/lib/utils/notification-sound'
import { 
  Loader2, LayoutDashboard, Settings, ShoppingBag, FileText, 
  Heart, Building2, BarChart3, TrendingUp, MessageSquare, 
  Shield, Bell, X, Home, LogOut, User, ChevronRight, MoreHorizontal, Trash2, Sparkles, ClipboardList, Megaphone
} from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UserMenu } from '@/components/shared/user-menu'
import { MobileBottomTabs } from '@/components/shared/mobile-bottom-tabs'
import { DatabaseIndicator } from '@/components/shared/database-indicator'
import { PushNotificationPrompt } from '@/components/features/notifications/push-notification-prompt'
import { cn } from '@/lib/utils'

// Email админа для показа тестовых данных
const ADMIN_EMAIL = 'vanekseleznev@yandex.ru'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, isAuthenticated, isLoading, isClient, isProvider, isAdmin, role } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const cartItems = useCartStore((state) => state.items)
  
  // Показываем тестовые данные только админу
  const isTestDataUser = user?.email === ADMIN_EMAIL
  
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const countsRef = useRef({ unreadNotifications: 0, unreadMessages: 0 })
  const hasLoadedCountsRef = useRef(false)
  
  // Реальные данные для dropdown'ов
  interface MessagePreview {
    id: string
    sender: string
    context: string
    text: string
    time: string
  }
  interface NotificationPreview {
    id: string
    title: string
    text: string
    time: string
    date: string
    action_url?: string
    read_at?: string | null
  }
  const [messages, setMessages] = useState<MessagePreview[]>([])
  const [notifications, setNotifications] = useState<NotificationPreview[]>([])

  // Загружаем реальные счётчики - ВСЕ из одного API
  const loadCounts = async () => {
    try {
      const response = await fetch('/api/user/counts')
      if (response.ok) {
        const data = await response.json()
        const nextUnreadNotifications = data.unreadNotifications || 0
        const nextUnreadMessages = data.unreadMessages || 0

        // Звук: только если счётчик вырос и только после user gesture
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

        setNewOrdersCount(data.newOrdersCount || 0)
        setUnreadNotifications(nextUnreadNotifications)
        setUnreadMessages(nextUnreadMessages) // Из того же запроса!
        // newResponsesCount можно использовать для клиентов
        if (isClient && data.newResponsesCount) {
          setNewOrdersCount(data.newResponsesCount)
        }
      }
    } catch (error) {
      console.error('Error loading counts:', error)
    }
  }

  // Отмечаем раздел как просмотренный
  const markSectionViewed = async (section: string) => {
    try {
      await fetch('/api/user/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      })
      // Перезагружаем счётчики после просмотра
      loadCounts()
    } catch (error) {
      console.error('Error marking section viewed:', error)
    }
  }

  // Определяем собеседника в чате
  const getInterlocutorName = (conv: any, currentUserId?: string) => {
    // Если текущий пользователь — владелец профиля (исполнитель), показываем клиента
    const isProfileOwner = conv.profiles?.user_id === currentUserId
    
    if (isProfileOwner) {
      // Текущий пользователь — исполнитель, показываем имя клиента
      return conv.other_participant?.full_name || 'Клиент'
    } else {
      // Текущий пользователь — клиент, показываем профиль исполнителя
      return conv.profiles?.display_name || conv.other_participant?.full_name || 'Пользователь'
    }
  }

  // Загружаем последние сообщения для dropdown
  const loadRecentMessages = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        const conversations = data.conversations || []
        
        // Берём последние 3 диалога с сообщениями
        const recent = conversations
          .filter((c: any) => c.last_message_preview)
          .slice(0, 3)
          .map((c: any) => ({
            id: c.id,
            sender: getInterlocutorName(c, user?.id),
            context: (() => {
              if (c.source_type === 'request') {
                const title = c.order_requests?.title
                return title ? `Объявление: ${title}` : 'Объявление'
              }
              if (c.source_type === 'order') {
                const num = c.order?.order_number
                const label = num ? `Заказ №${num}` : 'Заказ'
                return label
              }
              return 'Диалог'
            })(),
            text: c.last_message_preview || '',
            time: c.last_message_at ? formatTimeAgo(c.last_message_at) : '',
          }))
        
        setMessages(recent)
        // Счётчик unreadMessages теперь загружается из loadCounts
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Форматирование времени "X минут назад"
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMin < 1) return 'Только что'
    if (diffMin < 60) return `${diffMin} мин`
    if (diffHours < 24) return `${diffHours} ч`
    if (diffDays === 1) return 'Вчера'
    return `${diffDays} дн`
  }

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }

  // Загружаем последние уведомления для dropdown
  const loadRecentNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=3')
      if (response.ok) {
        const data = await response.json()
        const notifs = data.notifications || []
        
        const recent = notifs.slice(0, 3).map((n: any) => ({
          id: n.id,
          title: n.title || 'Уведомление',
          text: n.body || '',
          time: n.created_at ? formatTimeAgo(n.created_at) : '',
          date: n.created_at ? formatDate(n.created_at) : '',
          action_url: n.action_url || undefined,
          read_at: n.read_at ?? null,
        }))
        
        setNotifications(recent)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      // Мгновенно синхронизируем маркеры во всех компонентах
      window.dispatchEvent(new CustomEvent('notification-read'))
      // И обновляем локально (чтобы UI не ждал интервала)
      loadCounts()
      loadRecentNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Загружаем ТОЛЬКО счётчики при авторизации (быстрый запрос)
  // Сообщения и уведомления загружаются лениво при открытии dropdown
  useEffect(() => {
    if (user) {
      initNotificationSound()
      loadCounts()
    } else {
      setUnreadMessages(0)
      setMessages([])
      setNotifications([])
    }
  }, [user?.id, isClient])
  
  // ✨ REALTIME: Подключаемся к SSE для мгновенных обновлений (вместо polling)
  useEffect(() => {
    if (!user?.id) return

    console.log('[Dashboard Layout] Connecting to SSE realtime...')
    const eventSource = new EventSource('/api/realtime/notifications')

    eventSource.addEventListener('notification-created', (event) => {
      const data = JSON.parse(event.data)
      console.log('[Realtime] New notifications:', data.count)
      
      // Обновляем счётчики и список
      loadCounts()
      if (notificationsOpen) loadRecentNotifications()
      
      // Воспроизводим звук
      playNotificationSound()
    })

    eventSource.addEventListener('message-received', (event) => {
      const data = JSON.parse(event.data)
      console.log('[Realtime] New messages:', data.count)
      
      // Обновляем счётчики и список
      loadCounts()
      if (messagesOpen) loadRecentMessages()
      
      // Воспроизводим звук
      playNotificationSound()
    })

    eventSource.onerror = (error) => {
      console.error('[Realtime] SSE error:', error)
      eventSource.close()
    }

    return () => {
      console.log('[Dashboard Layout] Closing SSE connection')
      eventSource.close()
    }
  }, [user?.id, notificationsOpen, messagesOpen])
  
  // Ленивая загрузка сообщений — только при открытии dropdown
  useEffect(() => {
    if (messagesOpen && messages.length === 0) {
      loadRecentMessages()
    }
  }, [messagesOpen])
  
  // Ленивая загрузка уведомлений — только при открытии dropdown
  useEffect(() => {
    if (notificationsOpen) loadRecentNotifications()
  }, [notificationsOpen])

  // Слушаем событие синхронизации маркеров (прочитано в другом месте)
  useEffect(() => {
    const onNotificationRead = () => {
      loadCounts()
      // Обновляем превью, если dropdown открыт
      if (notificationsOpen) {
        loadRecentNotifications()
      }
    }
    window.addEventListener('notification-read', onNotificationRead)
    return () => window.removeEventListener('notification-read', onNotificationRead)
  }, [notificationsOpen])

  // Real-time подписки отключены (Supabase больше не используется)
  // Для обновления данных используется polling через loadRecentMessages/loadRecentNotifications

  // Отмечаем раздел просмотренным при переходе
  useEffect(() => {
    if (!user) return
    
    // Определяем раздел по pathname
    if (pathname === '/orders' || pathname.startsWith('/orders/')) {
      markSectionViewed('orders')
    } else if (
      pathname === '/board' ||
      pathname.startsWith('/board/') ||
      pathname === '/my-requests' ||
      pathname.startsWith('/my-requests/')
    ) {
      markSectionViewed('my-board')
    } else if (pathname === '/notifications') {
      markSectionViewed('notifications')
    }
  }, [pathname, user])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname === path || pathname.startsWith(path + '/')
  }

  // Скрываем sidebar на страницах с собственным меню (настройки профиля)
  const hideSidebar = pathname.startsWith('/profiles/') && pathname.includes('/edit')
  const isNotificationsPage = pathname === '/notifications'
  const isMessagesPage = pathname === '/messages' || pathname.startsWith('/messages/')
  const isAnalyticsPage = pathname === '/analytics'
  const isWideMobileDashboardPage =
    isNotificationsPage ||
    pathname === '/my-requests' ||
    pathname.startsWith('/my-requests/') ||
    pathname === '/orders' ||
    pathname.startsWith('/orders/') ||
    pathname === '/profiles'

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      // Очищаем localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key)
        }
      })
    }
    // Редирект на серверный signout (он сам сделает redirect на /login)
    window.location.href = '/api/auth/signout'
  }

  // Данные пользователя
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null

  // Навигация для ИСПОЛНИТЕЛЯ/АДМИНА — sidebar
  const providerNavItems = [
    { href: '/crm', icon: Sparkles, label: 'CRM' },
    { href: '/profiles', icon: Building2, label: 'Мои профили' },
    { href: '/orders', icon: FileText, label: 'Заказы', badge: newOrdersCount },
    { href: '/my-requests', icon: ClipboardList, label: 'Мои объявления' },
    { href: '/messages', icon: MessageSquare, label: 'Сообщения', badge: unreadMessages },
    { href: '/analytics', icon: BarChart3, label: 'Статистика' },
    { href: '/advertising', icon: Megaphone, label: 'Реклама' },
  ]

  // Навигация для КЛИЕНТА — sidebar
  const clientNavItems = [
    { href: '/orders', icon: FileText, label: 'Мои заказы', badge: newOrdersCount },
    { href: '/my-requests', icon: ClipboardList, label: 'Мои объявления' },
    { href: '/favorites', icon: Heart, label: 'Избранное' },
    { href: '/messages', icon: MessageSquare, label: 'Сообщения', badge: unreadMessages },
    { href: '/notifications', icon: Bell, label: 'Уведомления' },
  ]

  // Выбираем навигацию в зависимости от роли
  const sidebarNavItems = isClient ? clientNavItems : providerNavItems

  return (
    <TooltipProvider delayDuration={200}>
    <div className={isMessagesPage ? "h-screen bg-[#F7F8FA] overflow-hidden" : "min-h-screen bg-[#F7F8FA]"}>
      {/* Header */}
      <header id="dashboard-header" className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Left — только логотип */}
            <Link href={ROUTES.HOME} className="flex items-center">
              <Image 
                src="/zumzam_mob.svg" 
                alt="ZumZam" 
                width={36}
                height={24}
                className="h-6 w-auto md:hidden"
                priority
              />
              <Image 
                src="/zumzam.svg" 
                alt="ZumZam" 
                width={130}
                height={26}
                className="h-6 w-auto hidden md:block"
                priority
              />
            </Link>

            {/* Right */}
            <div className="flex items-center gap-1">
              {/* Корзина для клиентов */}
              {isClient && cartItems.length > 0 && (
                <Link 
                  href="/cart"
                  className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                </Link>
              )}

              {/* Мобильные иконки — простые ссылки */}
              <Link 
                href="/messages"
                className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-blue-500 rounded-full">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
              <Link 
                href="/notifications"
                className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-orange-500 rounded-full">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Сообщения - Dropdown (только десктоп) */}
              <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
                <PopoverTrigger asChild>
                  <button className="hidden md:flex relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Сообщения</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => setMessages([])}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 text-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Очистить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        Нет сообщений
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <Link
                          key={msg.id}
                          href={`/messages?chat=${msg.id}`}
                          className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          onClick={() => setMessagesOpen(false)}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{msg.sender}</p>
                              <span className="text-xs text-gray-400 shrink-0">{msg.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{msg.context}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{msg.text}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link
                    href="/messages"
                    className="block px-4 py-2.5 text-center text-sm font-medium text-orange-600 hover:bg-gray-50 border-t border-gray-100"
                    onClick={() => setMessagesOpen(false)}
                  >
                    Все сообщения
                  </Link>
                </PopoverContent>
              </Popover>

              {/* Уведомления - Dropdown (только десктоп) */}
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <button className="hidden md:flex relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Уведомления</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => setNotifications([])}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 text-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Очистить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        Нет уведомлений
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <Link
                          key={notif.id}
                          href={notif.action_url || '/notifications'}
                          className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.read_at ? 'bg-orange-50/50' : ''}`}
                          onClick={() => {
                            if (!notif.read_at) {
                              markNotificationAsRead(notif.id)
                            }
                            setNotificationsOpen(false)
                          }}
                        >
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <span className="text-xs text-gray-400 shrink-0">{notif.date}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{notif.text}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link
                    href="/notifications"
                    className="block px-4 py-2.5 text-center text-sm font-medium text-orange-600 hover:bg-gray-50 border-t border-gray-100"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Все уведомления
                  </Link>
                </PopoverContent>
              </Popover>

              {/* Доска объявлений — только десктоп */}
              <Link
                href="/#board"
                className="hidden md:flex p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
                title="Доска объявлений"
              >
                <Megaphone className="h-5 w-5" />
              </Link>

              {/* User Menu — только десктоп */}
              <div className="hidden md:block">
                <UserMenu />
              </div>

              {/* Аватарка профиля — только мобильные, ведёт на dashboard */}
              <Link
                href="/dashboard"
                className="md:hidden p-1"
              >
                {avatarUrl ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-orange-300 transition-all">
                    <img src={avatarUrl} alt="Профиль" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-gray-200 hover:ring-orange-300 transition-all">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout — центрированный контент с sidebar */}
      <div
        className={
          isMessagesPage
            ? 'w-full h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]'
            : isAnalyticsPage
            ? 'w-full py-4 px-1 sm:container sm:mx-auto sm:py-6 sm:px-6'
            : isWideMobileDashboardPage
            ? 'w-full py-4 px-2 sm:container sm:mx-auto sm:py-6 sm:px-6'
            : `container mx-auto py-6 ${
                pathname === '/profiles/create' || (pathname.startsWith('/profiles/') && pathname.includes('/edit'))
                  ? 'px-0 sm:px-6'
                  : 'px-6'
              }`
        }
      >
        <div className={`grid items-start ${
          isMessagesPage ? '' : 'gap-6'
        } ${
          !hideSidebar
            ? 'lg:grid-cols-[220px_1fr]' 
            : ''
        }`}>
          
          {/* Sidebar — для всех авторизованных, только десктоп, скрыт на страницах с своим меню */}
          {!hideSidebar && (
            <aside className="hidden lg:block sticky top-20">
              <div className="p-2">
                {/* Админ-панель */}
                {isAdmin && (
                  <>
                    <Link
                      href="/admin"
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                        pathname.startsWith('/admin')
                          ? 'bg-red-500 text-white'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      Админ-панель
                    </Link>
                    <div className="h-px bg-gray-100 my-3" />
                  </>
                )}

                {/* Навигация — стиль как в настройках профиля */}
                <nav className="space-y-1">
                  {sidebarNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-[16px] text-[13px] font-medium transition-all ${
                        isActive(item.href)
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive(item.href) ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>

                <div className="h-px bg-gray-200/60 my-3" />

                <Link
                  href="/settings"
                  className={`flex items-center gap-3 px-3 py-3 rounded-[16px] text-[13px] font-medium transition-all ${
                    isActive('/settings')
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                  }`}
                >
                  <Settings className={`w-4 h-4 ${isActive('/settings') ? 'text-gray-700' : 'text-gray-400'}`} />
                  Настройки
                </Link>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className={cn(
            "min-w-0",
            isMessagesPage ? "" : "pb-20 lg:pb-0"
          )}>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Tabs */}
      <MobileBottomTabs />
      
      {/* Database Indicator */}
      <DatabaseIndicator />
      
      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
    </div>
    </TooltipProvider>
  )
}
