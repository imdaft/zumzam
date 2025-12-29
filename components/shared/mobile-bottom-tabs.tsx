'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, MapPin, Sparkles, ShoppingCart, Menu, Mic, MicOff, X as XIcon } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  User, Settings, LogOut, Home, Search, Heart, MessageSquare, Bell, 
  ClipboardList, Building2, Shield, Kanban, FileText, BarChart3
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { useCartStore } from '@/lib/store/cart-store'
import { useFeatureAccess } from '@/components/shared/feature-gate'

/**
 * Mobile Bottom Tabs — стиль Яндекс.Еды
 * 5 табов: Главная, Карта, AI, Заявки, Меню (бургер)
 */
export function MobileBottomTabs() {
  const pathname = usePathname()
  const { user, profile, isAuthenticated, isProvider, isAdmin } = useAuth()
  const { fetchCart } = useCartStore()
  const { hasAccess: hasCrmAccess } = useFeatureAccess('crm')

  // Состояние бургер-меню
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  
  // AI Chat состояние
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'assistant', 
    content: string,
    suggestions?: string[],
    gallery?: Array<{
      id: string
      profileId: string
      profileName: string
      profileSlug: string
      serviceTitle?: string
      image?: string
      price?: number
      rating?: number
    }>
  }>>([
    { role: 'assistant', content: '👋 Привет! Я помогу вам найти идеальный праздник для вашего ребенка. Расскажите, что планируете?' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Голосовой ввод
  const {
    isRecording,
    isTranscribing,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onTranscriptionComplete: (text) => {
      // После транскрипции отправляем сообщение
      handleQuickQuestion(text)
    },
    onError: (error) => {
      console.error('[Voice] Error:', error)
      // Показываем ошибку пользователю
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `😔 ${error}` 
      }])
    },
  })
  
  // Проверяем доступность HTTPS (микрофон работает только на HTTPS)
  const [isSecureContext, setIsSecureContext] = useState(false)
  
  useEffect(() => {
    // window.isSecureContext доступен только в браузере
    setIsSecureContext(typeof window !== 'undefined' && window.isSecureContext)
  }, [])
  
  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (isAIChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAIChatOpen])
  
  // Для свайпа вниз
  const touchStartY = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Пользователь'
  const avatarUrl = profile?.avatar_url

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  // Блокировка скролла body при открытом меню
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Закрытие меню
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
    setDragOffset(0)
  }, [])

  // Выход из аккаунта
  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key)
        }
      })
    }
    window.location.href = '/api/auth/signout'
  }

  // Свайп вниз для закрытия
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaY = e.touches[0].clientY - touchStartY.current
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    if (dragOffset > 100) {
      closeMenu()
    }
    setDragOffset(0)
  }, [dragOffset, closeMenu])

  // Навигация для авторизованных пользователей
  const canShowCrm = hasCrmAccess === true
  const authNavItems = isProvider || isAdmin ? [
    ...(canShowCrm ? [{ href: '/crm', label: 'CRM', icon: Kanban }] : []),
    { href: '/profiles', label: 'Мои профили', icon: Building2 },
    { href: '/orders', label: 'Заказы', icon: ClipboardList },
    { href: '/my-requests', label: 'Мои объявления', icon: FileText },
    { href: '/messages', label: 'Сообщения', icon: MessageSquare },
    { href: '/favorites', label: 'Избранное', icon: Heart },
    { href: '/notifications', label: 'Уведомления', icon: Bell },
    { href: '/analytics', label: 'Статистика', icon: BarChart3 },
  ] : [
    { href: '/orders', label: 'Мои заказы', icon: ShoppingCart },
    { href: '/my-requests', label: 'Мои объявления', icon: ClipboardList },
    { href: '/messages', label: 'Сообщения', icon: MessageSquare },
    { href: '/favorites', label: 'Избранное', icon: Heart },
    { href: '/notifications', label: 'Уведомления', icon: Bell },
  ]

  // Навигация для гостей
  const guestNavItems = [
    { href: '/', label: 'Главная', icon: Home },
    { href: '/services', label: 'Услуги', icon: Search },
    { href: '/#board', label: 'Объявления', icon: ClipboardList },
    { href: '/scenario-generator', label: 'AI Сценарии', icon: Sparkles },
  ]

  const navItems = isAuthenticated ? authNavItems : guestNavItems
  
  const isNavActive = (href: string) => {
    return pathname.startsWith(href)
  }

  // Отправка сообщения в AI
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAILoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    
    // Добавляем сообщение пользователя
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsAILoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages
        })
      })

      if (!response.ok) throw new Error('AI request failed')

      const data = await response.json()
      
      // Добавляем ответ AI с вариантами вопросов и галереей
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        suggestions: data.suggestions || [],
        gallery: data.gallery || []
      }])
      
      // 🔥 ОБНОВЛЯЕМ КОРЗИНУ после любых операций AI
      // (add_to_cart, remove_from_cart, clear_cart)
      if (isAuthenticated) {
        await fetchCart()
        console.log('[AI Chat] Cart refreshed after AI operation')
      }
    } catch (error) {
      console.error('AI Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '😔 Извините, произошла ошибка. Попробуйте еще раз.' 
      }])
    } finally {
      setIsAILoading(false)
    }
  }

  // Быстрый вопрос из кнопки
  const handleQuickQuestion = async (question: string) => {
    if (isAILoading) return
    
    // Добавляем сообщение пользователя
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setIsAILoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          conversationHistory: messages
        })
      })

      if (!response.ok) throw new Error('AI request failed')

      const data = await response.json()
      
      // Добавляем ответ AI с вариантами вопросов и галереей
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        suggestions: data.suggestions || [],
        gallery: data.gallery || []
      }])
      
      // 🔥 ОБНОВЛЯЕМ КОРЗИНУ после любых операций AI
      if (isAuthenticated) {
        await fetchCart()
        console.log('[AI Chat] Cart refreshed after AI operation')
      }
    } catch (error) {
      console.error('AI Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '😔 Извините, произошла ошибка. Попробуйте еще раз.' 
      }])
    } finally {
      setIsAILoading(false)
    }
  }

  // Новый чат
  const handleNewChat = () => {
    setMessages([
      { role: 'assistant', content: '👋 Привет! Я помогу вам найти идеальный праздник для вашего ребенка. Расскажите, что планируете?' }
    ])
    setInputMessage('')
  }

  // Отправка примера вопроса (удалена - теперь встроена в onClick)

  // Основной таб: для авторизованных → заказы (/orders), для гостей → доска объявлений (/board)
  const requestsHref = isAuthenticated ? '/orders' : '/board'
  const requestsLabel = isAuthenticated ? 'Заказы' : 'Объявления'
  const RequestsIcon = isAuthenticated ? ShoppingCart : ClipboardList
  
  const tabs = [
    { href: '/', icon: House, label: 'Главная' },
    { href: '/map', icon: MapPin, label: 'Карта' },
    { href: requestsHref, icon: RequestsIcon, label: requestsLabel },
  ]

  // Проверка активности меню
  const isMenuActive = pathname.startsWith('/profiles') && !pathname.startsWith('/profiles/') ||
                       pathname.startsWith('/settings') ||
                       pathname.startsWith('/messages') ||
                       pathname.startsWith('/analytics') ||
                       pathname.startsWith('/notifications') ||
                       pathname.startsWith('/favorites') ||
                       pathname.startsWith('/orders') ||
                       pathname.startsWith('/my-requests') ||
                       pathname.startsWith('/crm')

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40 pb-safe-only">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto relative">
          {tabs.slice(0, 2).map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 transition-colors ${
                  active 
                    ? 'text-orange-500' 
                    : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </Link>
            )
          })}
          
          {/* AI Помощник - оранжевая кнопка с дугой СВЕРХУ (перевернутая) */}
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="relative flex flex-col items-center justify-center min-w-[64px] transition-transform active:scale-95"
          >
            {/* Кнопка с дугой СВЕРХУ - иконка по центру */}
            <div className="w-12 h-12 bg-orange-500 rounded-b-full flex items-center justify-center shadow-md relative overflow-hidden">
              <Sparkles className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
            </div>
          </button>
          
          {tabs.slice(2).map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 transition-colors ${
                  active 
                    ? 'text-orange-500' 
                    : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </Link>
            )
          })}
          
          {/* Меню (бургер) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 transition-colors ${
              isMenuActive 
                ? 'text-orange-500' 
                : 'text-gray-400 active:text-gray-600'
            }`}
          >
            <Menu className={`h-5 w-5 ${isMenuActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            <span className="text-[10px] font-medium leading-none">Меню</span>
          </button>
        </div>
      </nav>

      {/* Затемнение фона */}
      <div 
        className={`
          fixed inset-0 bg-black/50 z-[60] md:hidden transition-opacity duration-300
          ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeMenu}
      />
      
      {/* Bottom Sheet меню */}
      <div 
        className={`
          fixed left-0 right-0 bottom-0 bg-white z-[70] md:hidden
          rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)]
          max-h-[85vh] overflow-hidden
          ${!isDragging && 'transition-transform duration-300 ease-out'}
        `}
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: isMenuOpen 
            ? `translateY(${dragOffset}px)` 
            : 'translateY(100%)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ручка для свайпа */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full cursor-pointer" />
        </div>
        
        {/* Шапка с профилем */}
        <div className="px-5 pb-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{userName}</div>
                <div className="text-xs text-gray-500">
                  {isAdmin ? 'Администратор' : isProvider ? 'Исполнитель' : 'Клиент'}
                </div>
              </div>
              {/* Шестерёнка — переход на /settings */}
              <Link 
                href="/settings" 
                onClick={closeMenu}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link 
                href="/login" 
                onClick={closeMenu}
                className="flex-1 py-3 text-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
              >
                Войти
              </Link>
              <Link 
                href="/register" 
                onClick={closeMenu}
                className="flex-1 py-3 text-center text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-2xl transition-colors"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>

        {/* Навигация */}
        <nav className="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          {isAdmin && (
            <>
              <Link
                href="/admin"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-red-500 text-white'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <Shield className="h-5 w-5" />
                Админ-панель
              </Link>
              <div className="h-px bg-gray-100 my-3" />
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl text-sm font-medium transition-all ${
                  isNavActive(item.href)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-center text-xs">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Дополнительные ссылки */}
          <div className="h-px bg-gray-100 my-4" />
          
          <div className="space-y-1">
            <Link
              href="/help"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Помощь
            </Link>
            <Link
              href="/terms"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Условия использования
            </Link>
          </div>

          {/* Кнопка выхода убрана — теперь в Настройках */}
        </nav>
      </div>
      
      {/* AI Chat Modal - стиль Яндекса */}
      {isAIChatOpen && (
        <div className="fixed inset-0 bg-black/50 z-[80] md:hidden">
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[24px] shadow-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">AI Помощник 🎉</h2>
              <div className="flex gap-2">
                {messages.length > 1 && (
                  <button
                    onClick={handleNewChat}
                    className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                  >
                    Новый чат
                  </button>
                )}
                <button
                  onClick={() => setIsAIChatOpen(false)}
                  className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Сообщения */}
              {messages.map((msg, index) => {
                return (
                  <div key={index} className="space-y-2">
                    <div 
                      className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div 
                        className={`max-w-[80%] px-4 py-3 rounded-[16px] text-sm ${
                          msg.role === 'user'
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-50 text-slate-700'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p>{msg.content}</p>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Картинки (обложки профилей)
                              img: ({node, ...props}) => (
                                <img 
                                  src={props.src}
                                  alt={props.alt || 'Профиль'}
                                  className="w-full max-w-sm rounded-2xl my-3 shadow-md"
                                  loading="lazy"
                                />
                              ),
                              // Ссылки
                              a: ({node, ...props}) => (
                                <Link 
                                  href={props.href || '#'}
                                  className="font-semibold text-orange-600 hover:text-orange-700 underline decoration-2"
                                  onClick={() => setIsAIChatOpen(false)}
                                >
                                  {props.children}
                                </Link>
                              ),
                              // Жирный
                              strong: ({node, ...props}) => (
                                <strong className="font-bold text-slate-900">{props.children}</strong>
                              ),
                              // Курсив
                              em: ({node, ...props}) => (
                                <em className="text-slate-600 not-italic font-medium">{props.children}</em>
                              ),
                              // Списки
                              ul: ({node, ...props}) => (
                                <ul className="space-y-1.5 my-2 pl-0">{props.children}</ul>
                              ),
                              ol: ({node, ...props}) => (
                                <ol className="space-y-1.5 my-2 list-decimal list-inside">{props.children}</ol>
                              ),
                              li: ({node, ...props}) => (
                                <li className="leading-relaxed flex items-start gap-2">
                                  <span className="text-orange-500 mt-0.5">•</span>
                                  <span className="flex-1">{props.children}</span>
                                </li>
                              ),
                              // Параграфы
                              p: ({node, ...props}) => (
                                <p className="leading-relaxed mb-2.5 last:mb-0">{props.children}</p>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                    
                    {/* Горизонтальная галерея */}
                    {msg.gallery && msg.gallery.length > 0 && (
                      <div className="overflow-x-auto -mx-5 px-5">
                        <div className="flex gap-3 pb-2 min-w-min">
                          {msg.gallery.map((item, gIndex) => (
                            <Link
                              key={gIndex}
                              href={`/profiles/${item.profileSlug}`}
                              onClick={() => setIsAIChatOpen(false)}
                              className="flex-shrink-0 w-48 bg-white rounded-[16px] shadow-md overflow-hidden hover:shadow-lg transition-all active:scale-98"
                            >
                              <div className="relative aspect-square bg-gray-100">
                                {item.image && (
                                  <img 
                                    src={item.image}
                                    alt={item.profileName}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}
                                {item.rating && (
                                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <span>⭐</span>
                                    <span>{item.rating}</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-sm text-slate-900 mb-1 line-clamp-1">{item.profileName}</h4>
                                {item.serviceTitle && (
                                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">{item.serviceTitle}</p>
                                )}
                                {item.price && (
                                  <p className="text-sm font-bold text-orange-600">
                                    {item.price.toLocaleString()} ₽
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Варианты быстрых вопросов */}
                    {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                      <div className="flex flex-col gap-2 px-4">
                        <p className="text-xs text-slate-500 font-medium">Возможно, вас интересует:</p>
                        {msg.suggestions.map((suggestion, sIndex) => (
                          <button
                            key={sIndex}
                            onClick={() => handleQuickQuestion(suggestion)}
                            disabled={isAILoading}
                            className="text-left px-3 py-2 bg-white border border-slate-200 rounded-[12px] text-xs text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-98 disabled:opacity-50"
                          >
                            💬 {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Загрузка */}
              {isAILoading && (
                <div className="flex justify-start">
                  <div className="bg-orange-50 rounded-[16px] px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Примеры вопросов - показываем только если нет истории */}
              {messages.length === 1 && !isAILoading && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium px-1">Примеры вопросов:</p>
                  <button 
                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-[16px] text-sm text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-98"
                    onClick={() => handleQuickQuestion('Помоги организовать день рождения для ребенка 7 лет')}
                  >
                    🎂 Помоги организовать день рождения для ребенка 7 лет
                  </button>
                  <button 
                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-[16px] text-sm text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-98"
                    onClick={() => handleQuickQuestion('Какие шоу-программы есть для детей 5-6 лет?')}
                  >
                    🎪 Какие шоу-программы есть для детей 5-6 лет?
                  </button>
                  <button 
                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-[16px] text-sm text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-98"
                    onClick={() => handleQuickQuestion('Где провести мастер-класс для детей?')}
                  >
                    🎨 Где провести мастер-класс для детей?
                  </button>
                </div>
              )}
              
              {/* Маркер конца чата для автоскролла */}
              <div ref={chatEndRef} />
            </div>
            
            {/* Input */}
            <div className="border-t border-gray-100 p-4">
              {/* Индикатор записи/транскрипции */}
              {(isRecording || isTranscribing) && (
                <div className="mb-3 p-3 bg-orange-50 rounded-[16px] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isRecording && (
                      <>
                        <div className="relative">
                          <Mic className="w-5 h-5 text-orange-600" />
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Запись...</p>
                          <p className="text-xs text-slate-600">{recordingDuration} сек</p>
                        </div>
                      </>
                    )}
                    {isTranscribing && (
                      <>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-sm font-medium text-slate-900">Распознаю речь...</p>
                      </>
                    )}
                  </div>
                  {isRecording && (
                    <div className="flex gap-2">
                      <button
                        onClick={stopRecording}
                        className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="6" width="12" height="12" rx="1" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelRecording}
                        className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Input field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Напишите ваш вопрос..."
                  disabled={isAILoading || isRecording || isTranscribing}
                  className="flex-1 px-4 py-3 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                />
                
                {/* Кнопка микрофона (только на HTTPS) */}
                {!inputMessage.trim() && !isRecording && !isTranscribing && isSecureContext && (
                  <button 
                    onClick={startRecording}
                    disabled={isAILoading}
                    className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Голосовое сообщение"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
                
                {/* Кнопка отправки */}
                {inputMessage.trim() && !isRecording && !isTranscribing && (
                  <button 
                    onClick={handleSendMessage}
                    disabled={isAILoading}
                    className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
