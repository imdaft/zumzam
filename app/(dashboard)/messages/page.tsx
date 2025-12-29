'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/contexts/auth-context'
// Realtime подписки будут заменены на polling или WebSocket позже
import { format, isToday, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { safeFormatDate } from '@/lib/utils'
import { 
  MessageSquare, Search, Send, ArrowLeft,
  User, CheckCheck, Loader2, ExternalLink,
  ClipboardList, FileText, Calendar, MapPin, Banknote,
  PanelRightOpen, PanelRightClose, CheckCircle, XCircle, AlertTriangle, Ban,
  ChevronDown, Folder, FolderPlus, Plus, MoreVertical, Trash2, Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'

interface ConversationFolder {
  id: string
  name: string
  user_id: string
}

interface Conversation {
  id: string
  source_type: 'request' | 'order'
  source_id: string
  response_id?: string
  participant_1_id: string
  participant_2_id: string
  profile_id?: string
  last_message_at?: string
  last_message_preview?: string
  folder_ids?: string[] // IDs папок, в которых состоит диалог
  profiles?: {
    id: string
    slug: string
    display_name: string
    main_photo?: string
    logo?: string
    photos?: string[]
    user_id?: string
  }
  order_requests?: {
    id: string
    title: string
    category: string
    status: string
    event_date?: string
    event_time?: string
    city?: string
    budget?: number
    client_id?: string
    client_type?: string
  }
  order?: {
    id: string
    order_number?: string
    status: string
    total_amount: number
    event_date?: string
    event_time?: string
    event_address?: string
    client_name?: string
    client_id?: string
    provider_id?: string
    profile?: {
      id: string
      display_name: string
      main_photo?: string
      logo?: string
    }
  }
  other_participant?: {
    id: string
    full_name?: string
    avatar_url?: string
  }
  unread_count: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments?: any[]
  read_at?: string
  created_at: string
}

// Определить данные собеседника
// Если текущий пользователь — владелец профиля (исполнитель), показываем клиента
// Если текущий пользователь — клиент, показываем профиль исполнителя
const getInterlocutor = (conv: Conversation, currentUserId?: string) => {
  const isProfileOwner = conv.profiles?.user_id === currentUserId
  
  if (isProfileOwner) {
    // Текущий пользователь — исполнитель, показываем клиента
    return {
      name: conv.other_participant?.full_name || 'Клиент',
      avatar: conv.other_participant?.avatar_url || null,
      isClient: true,
    }
  } else {
    // Текущий пользователь — клиент, показываем профиль исполнителя
    return {
      name: conv.profiles?.display_name || conv.other_participant?.full_name || 'Пользователь',
      avatar: conv.profiles?.main_photo || conv.profiles?.logo || conv.profiles?.photos?.[0] || conv.other_participant?.avatar_url || null,
      isClient: false,
    }
  }
}

// Получить аватар (deprecated, используйте getInterlocutor)
const getAvatar = (conv: Conversation, currentUserId?: string) => {
  const interlocutor = getInterlocutor(conv, currentUserId)
  return interlocutor.avatar
}

// Маппинг категорий
const categoryLabels: Record<string, string> = {
  animator: 'Аниматор',
  quest: 'Квест',
  photo_video: 'Фото/видео',
  show: 'Шоу-программа',
  face_painting: 'Аквагрим',
  master_class: 'Мастер-класс',
  candy_bar: 'Кенди-бар',
  venue: 'Площадка',
  other: 'Другое',
}

// Маппинг типа клиента
const clientTypeLabels: Record<string, string> = {
  parent: 'Родитель',
  venue: 'Площадка',
  organizer: 'Организатор',
  colleague: 'Коллега',
}

// Форматировать время
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Вчера'
  return format(date, 'd MMM', { locale: ru })
}

// Название источника
const getSourceLabel = (conv: Conversation) => {
  if (conv.source_type === 'request') {
    return conv.order_requests?.title || 'Объявление'
  }
  if (conv.source_type === 'order' && conv.order) {
    const orderNum = conv.order.order_number || conv.order.id?.slice(0, 8)
    return `Заказ № ${orderNum}`
  }
  return 'Диалог'
}

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatIdFromUrl = searchParams.get('chat')
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [reactions, setReactions] = useState<Record<string, { emoji: string; user_id: string }[]>>({}) // messageId -> reactions array
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set()) // Кто печатает
  
  // Ref для троттлинга события "печатает"
  const lastTypingSentRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isDesktopCheck = useMediaQuery('(min-width: 1200px)')
  const [showDealInfo, setShowDealInfo] = useState(isDesktopCheck)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  
  // Мобильная панель информации о сделке (выезжает сверху)
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false)
  const [panelDragOffset, setPanelDragOffset] = useState(0) // Для анимации перетягивания
  const [isDraggingPanel, setIsDraggingPanel] = useState(false)
  // Для чата используем порог 1200px - оптимальный баланс для 3 панелей
  const isDesktop = useMediaQuery('(min-width: 1200px)')
  const isMobile = !isDesktop


  // --- FOLDERS STATE ---
  const [folders, setFolders] = useState<ConversationFolder[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<ConversationFolder | null>(null)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  // Загрузка папок
  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders')
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
      }
    } catch (e) {
      console.error('Error loading folders:', e)
    }
  }, [])

  // Создание папки
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      })
      
      if (res.ok) {
        const data = await res.json()
        setFolders(prev => [...prev, data.folder])
        setNewFolderName('')
        setIsCreateFolderOpen(false)
        // Toast отключён по запросу
      } else {
        setIsCreateFolderOpen(false)
      }
    } catch (e) {
      console.error('Error creating folder:', e)
      setIsCreateFolderOpen(false)
    }
  }

  // Удаление папки
  const handleDeleteFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
      if (res.ok) {
        setFolders(prev => prev.filter(f => f.id !== folderId))
        if (activeFolderId === folderId) setActiveFolderId(null)
        setFolderToDelete(null)
      }
    } catch (e) {
      console.error('Error deleting folder:', e)
      setFolderToDelete(null)
    }
  }

  // Добавить/удалить диалог из папки
  const toggleChatFolder = async (folderId: string, conversationId: string, isChecked: boolean) => {
    // Оптимистичное обновление
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c
      const currentFolders = c.folder_ids || []
      let newFolders
      if (isChecked) {
        newFolders = [...currentFolders, folderId]
      } else {
        newFolders = currentFolders.filter(fid => fid !== folderId)
      }
      return { ...c, folder_ids: newFolders }
    }))

    try {
      await fetch('/api/folders/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId,
          conversationId,
          action: isChecked ? 'add' : 'remove'
        })
      })
    } catch (e) {
      console.error('Error toggling folder link:', e)
      toast.error('Ошибка сохранения папки')
      // Revert (можно добавить, если критично)
      loadConversations() 
    }
  }

  // Initial load for folders
  useEffect(() => {
    if (user) {
      loadFolders()
    }
  }, [user, loadFolders])
  
  // Для свайпа по шапке чата
  const headerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const panelMaxHeight = 280 // Максимальная высота панели в px
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Проверка, является ли текущий пользователь владельцем объявления
  const isOrderOwner = (conv: Conversation) => {
    return conv.order_requests?.client_id === user?.id
  }

  // Принять заявку (установить статус in_progress)
  const handleAcceptResponse = async () => {
    if (!selectedConversation?.response_id) return
    
    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/requests/responses/${selectedConversation.response_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      })
      
      if (res.ok) {
        toast.success('Исполнитель принят!')
        // Обновляем локальный статус
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, order_requests: { ...c.order_requests!, status: 'in_progress' } }
            : c
        ))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Не удалось принять заявку')
      }
    } catch (error) {
      toast.error('Ошибка при принятии заявки')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Отклонить заявку
  const handleRejectResponse = async () => {
    if (!selectedConversation?.response_id) return
    
    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/requests/responses/${selectedConversation.response_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })
      
      if (res.ok) {
        toast.success('Заявка отклонена')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Не удалось отклонить заявку')
      }
    } catch (error) {
      toast.error('Ошибка при отклонении заявки')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Отменить исполнителя (вернуть статус active)
  const handleCancelPerformer = async () => {
    if (!selectedConversation?.order_requests?.id) return
    
    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/requests/${selectedConversation.order_requests.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      
      if (res.ok) {
        toast.success('Исполнитель отменён, объявление снова активно')
        // Обновляем локальный статус
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, order_requests: { ...c.order_requests!, status: 'active' } }
            : c
        ))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Не удалось отменить исполнителя')
      }
    } catch (error) {
      toast.error('Ошибка при отмене исполнителя')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Пожаловаться (заглушка)
  const handleReport = () => {
    toast.info('Функция жалобы будет доступна в ближайшее время')
  }

  // Загрузка реакций для сообщений - ОПТИМИЗИРОВАНО: batch запрос
  const loadReactionsForMessages = useCallback(async (msgs: Message[]) => {
    if (msgs.length === 0) return
    
        try {
      // ОДИН запрос для всех сообщений вместо N запросов!
      const messageIds = msgs.map(msg => msg.id).join(',')
      const res = await fetch(`/api/messages/reactions/batch?messageIds=${messageIds}`)
      
          if (res.ok) {
            const data = await res.json()
        setReactions(data.reactions || {})
          }
        } catch (e) {
      console.error('Error loading reactions:', e)
        }
  }, [])

  // Добавить/удалить реакцию
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const currentReactions = reactions[messageId] || []
    const existingReaction = currentReactions.find(r => r.user_id === user?.id)
    
    if (existingReaction?.emoji === emoji) {
      // Удаляем реакцию
      try {
        await fetch(`/api/messages/${messageId}/reactions`, { method: 'DELETE' })
        setReactions(prev => {
          const updated = { ...prev }
          updated[messageId] = (updated[messageId] || []).filter(r => r.user_id !== user?.id)
          if (updated[messageId].length === 0) delete updated[messageId]
          return updated
        })
      } catch (e) {
        console.error('Error removing reaction:', e)
      }
    } else {
      // Добавляем/обновляем реакцию
      try {
        const res = await fetch(`/api/messages/${messageId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji })
        })
        if (res.ok) {
          setReactions(prev => {
            const updated = { ...prev }
            const msgReactions = [...(updated[messageId] || []).filter(r => r.user_id !== user?.id)]
            msgReactions.push({ emoji, user_id: user?.id || '' })
            updated[messageId] = msgReactions
            return updated
          })
        }
      } catch (e) {
        console.error('Error adding reaction:', e)
      }
    }
  }, [reactions, user?.id])

  // Загрузка диалогов
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])

  // Загрузка сообщений
  const loadMessages = useCallback(async (conversationId: string, showLoader = true) => {
    if (showLoader) {
      setIsLoadingMessages(true)
    }
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        // Загружаем реакции для всех сообщений
        loadReactionsForMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      if (showLoader) {
        setIsLoadingMessages(false)
      }
    }
  }, [])

  // Начальная загрузка
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])

  // Polling для обновления conversations и messages (замена Realtime подписок)
  useEffect(() => {
    if (!user) return

    // Обновляем список диалогов каждые 5 секунд
    const conversationsInterval = setInterval(() => {
      loadConversations()
    }, 5000)

    // Обновляем сообщения в открытом чате каждые 2 секунды
    let messagesInterval: NodeJS.Timeout | null = null
    if (selectedChatId) {
      messagesInterval = setInterval(() => {
        loadMessages(selectedChatId, false)
      }, 2000)
    }

    return () => {
      clearInterval(conversationsInterval)
      if (messagesInterval) clearInterval(messagesInterval)
    }
  }, [user?.id, selectedChatId, loadConversations, loadMessages])

  // Отправка события "печатает" (заглушка - будет реализовано через API позже)
  const handleTyping = async () => {
    // TODO: Реализовать через API endpoint для typing status
    // Пока оставляем пустым, так как это не критично для основной функциональности
  }

  // Синхронизация selectedChatId с URL
  useEffect(() => {
    if (chatIdFromUrl && chatIdFromUrl !== selectedChatId) {
      setSelectedChatId(chatIdFromUrl)
    }
  }, [chatIdFromUrl])

  // Функция пометки сообщений как прочитанных (вынесена для переиспользования)
  const markMessagesAsRead = useCallback(async () => {
    if (!selectedChatId) return

    try {
      // Оптимистично убираем бейджи в списке диалогов
      setConversations(prev => prev.map(c => 
        c.id === selectedChatId 
          ? { ...c, unread_count: 0 }
          : c
      ))

      await fetch(`/api/conversations/${selectedChatId}/mark-read`, {
        method: 'POST',
      })
      console.log('[MessagesPage] ✅ Marked messages as read via Action')
    } catch (error) {
      console.error('[MessagesPage] Error marking messages as read:', error)
    }
  }, [selectedChatId])

  // Загрузка сообщений при выборе чата + пометка как прочитанные
  useEffect(() => {
    if (!selectedChatId) return
    
    // Первая загрузка с лоадером
    loadMessages(selectedChatId, true)
    
    // Помечаем как прочитанные при открытии
    markMessagesAsRead()
  }, [selectedChatId, loadMessages, markMessagesAsRead])

  // Обновление URL при выборе чата
  useEffect(() => {
    if (selectedChatId && selectedChatId !== chatIdFromUrl) {
      router.replace(`/messages?chat=${selectedChatId}`, { scroll: false })
    }
  }, [selectedChatId, chatIdFromUrl, router])

  // Скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // После отправки сообщения — немедленно обновляем
  const refreshMessages = useCallback(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId, false)
    }
  }, [selectedChatId, loadMessages])

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || isSending || !user) return

    const tempId = `temp-${Date.now()}`
    const content = newMessage.trim()
    
    // Оптимистичное добавление
    const optimisticMessage: any = {
      id: tempId,
      conversation_id: selectedChatId,
      sender_id: user.id,
      content: content,
      created_at: new Date().toISOString(),
      read_at: null,
      is_optimistic: true
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    // Скролл вниз сразу
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)

    try {
      const response = await fetch(`/api/conversations/${selectedChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const savedMessage = await response.json()
        // Заменяем временное сообщение на настоящее
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m))
        // Обновляем список диалогов
        loadConversations()
      } else {
        // Ошибка — удаляем временное сообщение и показываем тост
        setMessages(prev => prev.filter(m => m.id !== tempId))
        toast.error('Не удалось отправить сообщение')
        setNewMessage(content) // Возвращаем текст
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error('Ошибка отправки')
      setNewMessage(content)
    }
  }

  // Нажатие Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Обработка свайпа влево в чате — возврат к списку диалогов
  const handleChatTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleChatTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX.current
    const deltaY = Math.abs(touchEndY - touchStartY.current)
    
    // Свайп вправо (deltaX > 80px и вертикальное смещение небольшое) — назад к списку
    if (deltaX > 80 && deltaY < 50) {
      setSelectedChatId(null)
      setMobileInfoOpen(false)
    }
  }, [])

  // Свайп вниз по шапке чата — открывает панель информации с анимацией
  const handleHeaderSwipeStart = useCallback((e: React.TouchEvent) => {
    if (mobileInfoOpen) return
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
    setIsDraggingPanel(true)
  }, [mobileInfoOpen])

  const handleHeaderSwipeMove = useCallback((e: React.TouchEvent) => {
    if (mobileInfoOpen || !isDraggingPanel) return
    const deltaY = e.touches[0].clientY - touchStartY.current
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current)
    
    // Только если тянем вниз и не сильно влево/вправо
    if (deltaY > 0 && deltaX < 50) {
      setPanelDragOffset(Math.min(deltaY, panelMaxHeight))
    }
  }, [mobileInfoOpen, isDraggingPanel, panelMaxHeight])

  const handleHeaderSwipeEnd = useCallback(() => {
    if (mobileInfoOpen) return
    setIsDraggingPanel(false)
    
    // Если потянули больше 60px — открываем, иначе закрываем
    if (panelDragOffset > 60) {
      setMobileInfoOpen(true)
    }
    setPanelDragOffset(0)
  }, [mobileInfoOpen, panelDragOffset])

  // Свайп вверх по панели информации — закрывает её с анимацией
  const handlePanelSwipeStart = useCallback((e: React.TouchEvent) => {
    if (!mobileInfoOpen) return
    touchStartY.current = e.touches[0].clientY
    setIsDraggingPanel(true)
    setPanelDragOffset(0)
  }, [mobileInfoOpen])

  const handlePanelSwipeMove = useCallback((e: React.TouchEvent) => {
    if (!mobileInfoOpen || !isDraggingPanel) return
    const deltaY = e.touches[0].clientY - touchStartY.current
    
    // Только если тянем вверх (отрицательное значение)
    if (deltaY < 0) {
      setPanelDragOffset(deltaY) // Отрицательное значение уменьшит высоту
    }
  }, [mobileInfoOpen, isDraggingPanel])

  const handlePanelSwipeEnd = useCallback(() => {
    if (!mobileInfoOpen) return
    setIsDraggingPanel(false)
    
    // Если потянули вверх больше 60px — закрываем
    if (panelDragOffset < -60) {
      setMobileInfoOpen(false)
    }
    setPanelDragOffset(0)
  }, [mobileInfoOpen, panelDragOffset])

  // Выбранный диалог
  const selectedConversation = conversations.find(c => c.id === selectedChatId)

  // Фильтрация по поиску и папкам
  const filteredConversations = conversations.filter(conv => {
    // Фильтр по папке
    if (activeFolderId && (!conv.folder_ids || !conv.folder_ids.includes(activeFolderId))) {
      return false
    }

    if (!searchQuery) return true
    const interlocutor = getInterlocutor(conv, user?.id)
    const name = interlocutor.name
    const title = conv.order_requests?.title || ''
    const query = searchQuery.toLowerCase()
    return name.toLowerCase().includes(query) || title.toLowerCase().includes(query)
  })

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Контейнер чата - полноэкранный на мобильных и планшетах, разделённый на desktop */}
      <div
        className={cn(
          "flex bg-white overflow-hidden",
          // Мобильная/планшетная версия - полноэкранный с z-index
          "fixed left-0 right-0 z-30 chat:relative chat:inset-auto chat:z-auto",
          "chat:h-full"
        )}
        style={{
          top: '0',
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* Список диалогов — 1/3 ширины */}
        <div className={cn(
          "w-full chat:w-1/3 chat:min-w-[280px] chat:max-w-[400px] border-r border-gray-100 flex flex-col bg-white",
          // На мобильных скрываем при выборе чата, на desktop всегда показываем
          selectedChatId ? 'hidden chat:flex' : 'flex'
        )}>
          {/* Поиск */}
          <div className="px-4 py-3 chat:p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск диалогов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-100 border-0 rounded-full h-10"
              />
            </div>
          </div>

          {/* Папки (Вкладки) */}
          <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-gray-50 min-h-[48px] pt-2">
            <button
              onClick={() => setActiveFolderId(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeFolderId === null 
                  ? "bg-orange-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Все
            </button>
            
            {folders.map(folder => (
              <div key={folder.id} className="relative group/folder">
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                    activeFolderId === folder.id 
                      ? "bg-orange-500 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {folder.name}
                </button>
                {/* Кнопка удаления папки */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFolderToDelete(folder)
                  }}
                  className="absolute -top-1.5 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity shadow-sm z-10"
                  title="Удалить папку"
                >
                  <Trash2 className="w-2 h-2" />
                </button>
              </div>
            ))}

            {/* Кнопка добавления папки */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <button
                  className="px-2 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors bg-white border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая папка</DialogTitle>
                  <DialogDescription>
                    Создайте папку для группировки диалогов (например, "День рождения", "Аниматоры")
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Название папки" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Отмена</Button>
                  <Button onClick={handleCreateFolder}>Создать</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Диалог удаления папки */}
            <Dialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
              <DialogContent className="rounded-[24px] p-6">
                <DialogHeader>
                  <DialogTitle>Удалить папку?</DialogTitle>
                  <DialogDescription>
                    Диалоги останутся, удалится только группировка.
                  </DialogDescription>
                </DialogHeader>
                {folderToDelete && (
                  <div className="py-3 text-sm text-slate-900 font-medium">
                    «{folderToDelete.name}»
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setFolderToDelete(null)} className="rounded-full">
                    Отмена
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => folderToDelete && handleDeleteFolder(folderToDelete.id)}
                    className="rounded-full"
                  >
                    Удалить
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Список */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Нет диалогов</p>
                <p className="text-gray-400 text-sm mt-1">
                  Диалоги появятся, когда вы примете отклик на объявление
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const interlocutor = getInterlocutor(conv, user?.id)
                const orderInfo = conv.order_requests
                const isProfileOwner = conv.profiles?.user_id === user?.id
                
                return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedChatId(conv.id)}
                  className={cn(
                    "w-full p-3 flex gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 cursor-pointer group relative",
                    selectedChatId === conv.id && "bg-orange-50 hover:bg-orange-50"
                  )}
                >
                  {/* Аватар */}
                  {interlocutor.avatar ? (
                    <Image
                      src={interlocutor.avatar}
                      alt=""
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Строка 1: Имя собеседника + время последнего сообщения */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-gray-900 truncate text-sm">
                          {interlocutor.name}
                        </span>
                        {/* Метка источника: Объявление или Заказ */}
                        <span className={cn(
                          "shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide",
                          conv.source_type === 'request' 
                            ? "bg-orange-100 text-orange-600" 
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {conv.source_type === 'request' ? 'Объявл.' : 'Заказ'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Кнопка папки (DropMenu) */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                "p-1 rounded-full hover:bg-gray-200 transition-all text-gray-400 hover:text-gray-600",
                                // Показываем иконку если диалог уже в папке или при ховере, или если активна папка
                                (conv.folder_ids && conv.folder_ids.length > 0) ? "text-orange-600 opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                <Folder className={cn("w-3.5 h-3.5", (conv.folder_ids && conv.folder_ids.length > 0) && "fill-current")} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Папки диалога</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {folders.length === 0 && (
                                <div className="p-2 text-xs text-gray-500 text-center">
                                    Нет папок. Создайте новую.
                                </div>
                                )}
                                {folders.map(folder => (
                                <DropdownMenuCheckboxItem
                                    key={folder.id}
                                    checked={conv.folder_ids?.includes(folder.id)}
                                    onCheckedChange={(checked) => toggleChatFolder(folder.id, conv.id, checked)}
                                >
                                    {folder.name}
                                </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {conv.last_message_at && (
                            <span className="text-[11px] text-gray-400 shrink-0">
                            {formatTime(conv.last_message_at)}
                            </span>
                        )}
                      </div>
                    </div>

                    {/* Строка 2: Кто разместил | Категория | Дата | Время */}
                    {(orderInfo || conv.order) && (
                      <div className="text-[11px] text-gray-600 mt-0.5 truncate">
                        {/* Тип клиента (только для order_requests) */}
                        {orderInfo?.client_type && (
                          <>
                            <span className="text-gray-500">
                              {clientTypeLabels[orderInfo.client_type] || orderInfo.client_type}
                            </span>
                            <span className="text-gray-300 mx-1">·</span>
                          </>
                        )}
                        {/* Категория */}
                        {(orderInfo?.category || conv.order?.order_requests?.category) && (
                          <span className="text-orange-600 font-medium">
                            {categoryLabels[orderInfo?.category || conv.order?.order_requests?.category || ''] || orderInfo?.category || conv.order?.order_requests?.category}
                          </span>
                        )}
                        {/* Дата и время события */}
                        {(orderInfo?.event_date || conv.order?.event_date) && (
                          <>
                            <span className="text-gray-300 mx-1">|</span>
                            <span>{format(new Date(orderInfo?.event_date || conv.order?.event_date!), 'dd.MM.yy', { locale: ru })}</span>
                            {(orderInfo?.event_time || conv.order?.event_time) && (
                              <span className="ml-1 text-gray-500">
                                {typeof (orderInfo?.event_time || conv.order?.event_time) === 'string' 
                                  ? (orderInfo?.event_time || conv.order?.event_time)!.slice(0, 5)
                                  : safeFormatDate(orderInfo?.event_time || conv.order?.event_time!, 'HH:mm')}
                              </span>
                            )}
                          </>
                        )}
                        {/* Город (если есть) */}
                        {(orderInfo?.city || conv.order?.order_requests?.city) && (
                          <>
                            <span className="text-gray-300 mx-1">|</span>
                            <span className="text-gray-500">{orderInfo?.city || conv.order?.order_requests?.city}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Строка 3: Последнее сообщение + бейдж */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-gray-500 truncate">
                        {conv.last_message_preview || 'Начните диалог...'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="shrink-0 w-5 h-5 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

          {/* Область чата */}
        {selectedChatId && selectedConversation ? (() => {
          const selectedInterlocutor = getInterlocutor(selectedConversation, user?.id)
          return (
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Превью панели при перетаскивании (когда закрыта) */}
            {isMobile && (selectedConversation.order_requests || selectedConversation.order) && !mobileInfoOpen && panelDragOffset > 0 && (
              <div 
                className="bg-white rounded-b-[24px] shadow-lg overflow-hidden"
                style={{ 
                  height: panelDragOffset,
                  transition: isDraggingPanel ? 'none' : 'height 0.3s ease-out'
                }}
              >
                <div className="flex justify-center pt-2">
                  <div className="w-8 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="px-4 pt-2 text-center text-sm text-gray-500">
                  {panelDragOffset > 60 ? 'Отпустите для открытия' : 'Потяните вниз'}
                </div>
              </div>
            )}

            {/* Мобильная панель информации о сделке — компактный дизайн */}
            {isMobile && selectedConversation.order_requests && (
              <div 
                ref={panelRef}
                className={cn(
                  "bg-white overflow-hidden rounded-b-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
                  !isDraggingPanel && "transition-all duration-300 ease-out",
                  mobileInfoOpen ? "opacity-100" : "max-h-0 opacity-0 shadow-none"
                )}
                style={mobileInfoOpen ? { 
                  maxHeight: `calc(${panelMaxHeight}px + ${panelDragOffset}px)`
                } : undefined}
                onTouchStart={handlePanelSwipeStart}
                onTouchMove={handlePanelSwipeMove}
                onTouchEnd={handlePanelSwipeEnd}
              >
                {/* Ручка для свайпа */}
                <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
                  <div className="w-8 h-1 bg-gray-300 rounded-full" />
                </div>
                
                {/* Компактная шапка — аватар слева, инфо справа, кнопка открытия */}
                <div className="flex items-center gap-3 px-4 pb-3">
                  {/* Аватар */}
                  {selectedInterlocutor.avatar ? (
                    <Image
                      src={selectedInterlocutor.avatar}
                      alt=""
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center ring-2 ring-gray-100">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  {/* Имя и статус */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {selectedInterlocutor.name}
                    </h3>
                    <span className={cn(
                      "inline-flex items-center text-xs font-medium",
                      selectedConversation.order_requests.status === 'in_progress' 
                        ? "text-yellow-700"
                        : selectedConversation.order_requests.status === 'closed'
                        ? "text-green-600"
                        : selectedConversation.order_requests.status === 'cancelled'
                        ? "text-red-600"
                        : "text-orange-600"
                    )}>
                      {selectedConversation.order_requests.status === 'in_progress' && '🔄 В работе'}
                      {selectedConversation.order_requests.status === 'closed' && '✅ Завершено'}
                      {selectedConversation.order_requests.status === 'active' && '🟢 Активно'}
                      {selectedConversation.order_requests.status === 'cancelled' && '❌ Отменено'}
                    </span>
                  </div>
                  
                  {/* Кнопка открытия объявления */}
                  <Link href={`/board/${selectedConversation.source_id}`}>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </button>
                  </Link>
                </div>
                
                {/* Компактная информация о сделке */}
                <div className="px-4 pb-3 space-y-2">
                  {/* Название объявления */}
                  <p className="text-sm text-gray-900 font-medium line-clamp-2">
                    {selectedConversation.order_requests.title}
                  </p>
                  
                  {/* Детали в одну строку */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    {selectedConversation.order_requests.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                        {categoryLabels[selectedConversation.order_requests.category] || selectedConversation.order_requests.category}
                      </span>
                    )}
                    {selectedConversation.order_requests.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(selectedConversation.order_requests.event_date), 'd MMM', { locale: ru })}
                      </span>
                    )}
                    {selectedConversation.order_requests.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedConversation.order_requests.city}
                      </span>
                    )}
                    {selectedConversation.order_requests.budget && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Banknote className="w-3.5 h-3.5" />
                        {selectedConversation.order_requests.budget.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Кнопки управления для владельца объявления */}
                {isOrderOwner(selectedConversation) && (
                  (selectedConversation.order_requests.status === 'active' && selectedConversation.response_id) ||
                  selectedConversation.order_requests.status === 'in_progress'
                ) && (
                  <div className="px-4 pb-3">
                    {selectedConversation.order_requests.status === 'active' && selectedConversation.response_id && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAcceptResponse}
                          disabled={isProcessingAction}
                          size="sm"
                          className="flex-1 bg-green-500 hover:bg-green-600 rounded-full text-xs h-9 font-semibold"
                        >
                          {isProcessingAction ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Принять
                        </Button>
                        <Button
                          onClick={handleRejectResponse}
                          disabled={isProcessingAction}
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-full text-xs border-red-200 text-red-600 hover:bg-red-50 h-9 font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Отклонить
                        </Button>
                      </div>
                    )}
                    
                    {selectedConversation.order_requests.status === 'in_progress' && (
                      <Button
                        onClick={handleCancelPerformer}
                        disabled={isProcessingAction}
                        variant="outline"
                        size="sm"
                        className="w-full rounded-full text-xs border-orange-200 text-orange-600 hover:bg-orange-50 h-9 font-semibold"
                      >
                        {isProcessingAction ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Ban className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Отменить исполнителя
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Мобильная панель информации о заказе */}
            {isMobile && selectedConversation.order && (
              <div 
                ref={panelRef}
                className={cn(
                  "bg-white overflow-hidden rounded-b-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
                  !isDraggingPanel && "transition-all duration-300 ease-out",
                  mobileInfoOpen ? "opacity-100" : "max-h-0 opacity-0 shadow-none"
                )}
                style={mobileInfoOpen ? { 
                  maxHeight: `calc(${panelMaxHeight}px + ${panelDragOffset}px)`
                } : undefined}
                onTouchStart={handlePanelSwipeStart}
                onTouchMove={handlePanelSwipeMove}
                onTouchEnd={handlePanelSwipeEnd}
              >
                {/* Ручка для свайпа */}
                <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
                  <div className="w-8 h-1 bg-gray-300 rounded-full" />
                </div>
                
                {/* Компактная шапка — аватар и инфо */}
                <div className="flex items-center gap-3 px-4 pb-3">
                  {/* Аватар профиля */}
                  {(selectedConversation.order.profile?.main_photo || selectedConversation.order.profile?.logo) ? (
                    <Image
                      src={selectedConversation.order.profile.main_photo || selectedConversation.order.profile.logo || ''}
                      alt=""
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center ring-2 ring-gray-100">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  {/* Название и статус */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {selectedConversation.order.profile?.display_name || 'Заказ'}
                    </h3>
                    <span className={cn(
                      "inline-flex items-center text-xs font-medium",
                      selectedConversation.order.status === 'confirmed' 
                        ? "text-green-600"
                        : selectedConversation.order.status === 'cancelled' || selectedConversation.order.status === 'rejected'
                        ? "text-red-600"
                        : selectedConversation.order.status === 'completed'
                        ? "text-gray-600"
                        : "text-orange-600"
                    )}>
                      {selectedConversation.order.status === 'pending' && '⏳ Ожидает'}
                      {selectedConversation.order.status === 'confirmed' && '✅ Подтверждён'}
                      {selectedConversation.order.status === 'in_progress' && '🔄 В работе'}
                      {selectedConversation.order.status === 'completed' && '✨ Завершён'}
                      {selectedConversation.order.status === 'cancelled' && '❌ Отменён'}
                      {selectedConversation.order.status === 'rejected' && '❌ Отклонён'}
                    </span>
                  </div>
                  
                  {/* Кнопка открытия заказа */}
                  <Link href={`/orders?id=${selectedConversation.order.id}`}>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </button>
                  </Link>
                </div>
                
                {/* Компактная информация о заказе */}
                <div className="px-4 pb-3 space-y-2">
                  {/* Сумма заказа */}
                  <div className="text-lg font-bold text-gray-900">
                    {selectedConversation.order.total_amount?.toLocaleString()} ₽
                  </div>
                  
                  {/* Детали в одну строку */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    {selectedConversation.order.order_number && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                        № {selectedConversation.order.order_number}
                      </span>
                    )}
                    {selectedConversation.order.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(selectedConversation.order.event_date), 'd MMM', { locale: ru })}
                        {selectedConversation.order.event_time && ` в ${selectedConversation.order.event_time}`}
                      </span>
                    )}
                    {selectedConversation.order.event_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedConversation.order.event_address.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Шапка чата — свайп вниз открывает панель информации */}
            <div 
              ref={headerRef}
              className="px-4 py-3 chat:p-4 border-b border-gray-100 flex items-center gap-3"
              onTouchStart={isMobile && (selectedConversation.order_requests || selectedConversation.order) ? handleHeaderSwipeStart : undefined}
              onTouchMove={isMobile && (selectedConversation.order_requests || selectedConversation.order) ? handleHeaderSwipeMove : undefined}
              onTouchEnd={isMobile && (selectedConversation.order_requests || selectedConversation.order) ? handleHeaderSwipeEnd : undefined}
            >
              {/* Кнопка назад — отдельно, не кликабельная для открытия инфо */}
              <button
                onClick={() => setSelectedChatId(null)}
                className="chat:hidden p-2 hover:bg-gray-100 rounded-full shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Кликабельная область — аватар, имя, инфо (как в Телеграме) */}
              <div 
                className={cn(
                  "flex-1 flex items-center gap-3 min-w-0",
                  (selectedConversation.order_requests || selectedConversation.order) && "cursor-pointer chat:cursor-default active:bg-gray-50 chat:active:bg-transparent rounded-[18px] -m-1 p-1 chat:m-0 chat:p-0"
                )}
                onClick={() => {
                  if (isMobile && (selectedConversation.order_requests || selectedConversation.order)) {
                    setMobileInfoOpen(!mobileInfoOpen)
                  }
                }}
              >
                {selectedInterlocutor.avatar ? (
                  <Image
                    src={selectedInterlocutor.avatar}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {selectedInterlocutor.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {selectedConversation.source_type === 'request' ? (
                      <ClipboardList className="w-3 h-3 text-orange-500" />
                    ) : (
                      <FileText className="w-3 h-3 text-gray-500" />
                    )}
                    <span className="truncate">{getSourceLabel(selectedConversation)}</span>
                  </div>
                </div>

                {/* Стрелочка-индикатор на мобильных */}
                {isMobile && (selectedConversation.order_requests || selectedConversation.order) && (
                  <ChevronDown className={cn(
                    "w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200",
                    mobileInfoOpen && "rotate-180"
                  )} />
                )}
              </div>

              {/* Десктопная кнопка — открывает панель справа */}
              {(selectedConversation.order_requests || selectedConversation.order) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden chat:flex rounded-full shrink-0"
                  onClick={() => setShowDealInfo(!showDealInfo)}
                >
                  {showDealInfo ? (
                    <PanelRightClose className="w-5 h-5 text-gray-500" />
                  ) : (
                    <PanelRightOpen className="w-5 h-5 text-gray-500" />
                  )}
                </Button>
              )}
            </div>

            {/* Сообщения — свайп вправо возвращает к списку диалогов */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-3 chat:p-4"
              onTouchStart={isMobile ? handleChatTouchStart : undefined}
              onTouchEnd={isMobile ? handleChatTouchEnd : undefined}
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">Напишите первое сообщение</p>
                </div>
              ) : (
                <div className="space-y-1 min-h-full flex flex-col justify-end">
                  {/* Рендеринг сообщений с группировкой и датами */}
                  {messages.map((msg, index) => {
                    const isMyMessage = msg.sender_id === user?.id
                    const senderName = isMyMessage ? 'Вы' : selectedInterlocutor.name
                    
                    // Проверки для группировки
                    const prevMsg = messages[index - 1]
                    const nextMsg = messages[index + 1]
                    
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id
                    const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id
                    
                    // Проверка смены даты
                    let showDateSeparator = false
                    if (index === 0) {
                      showDateSeparator = true
                    } else {
                      const prevDate = new Date(prevMsg.created_at).toDateString()
                      const currDate = new Date(msg.created_at).toDateString()
                      if (prevDate !== currDate) showDateSeparator = true
                    }

                    return (
                      <div key={`msg-${msg.id}-${index}`}>
                        {/* Разделитель дат */}
                        {showDateSeparator && (
                          <div className="flex justify-center my-4 sticky top-0 z-10">
                            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">
                              {(() => {
                                try {
                                  const date = new Date(msg.created_at)
                                  return isNaN(date.getTime()) ? 'Дата' : format(date, 'd MMMM', { locale: ru })
                                } catch {
                                  return 'Дата'
                                }
                              })()}
                            </span>
                          </div>
                        )}

                        <div
                          className={cn(
                            "flex w-full",
                            isMyMessage ? "justify-end" : "justify-start",
                            // Отступ сверху если новый блок
                            isFirstInGroup ? "mt-3" : "mt-1"
                          )}
                        >
                          <div className={cn("flex max-w-[85%] chat:max-w-[75%]", isMyMessage ? "flex-row-reverse" : "flex-row")}>
                            {/* Аватарка (только для чужих и только у последнего в группе) */}
                            {!isMyMessage && (
                              <div className="w-8 shrink-0 mr-2 flex items-end">
                                {isLastInGroup ? (
                                  selectedInterlocutor.avatar ? (
                                    <Image 
                                      src={selectedInterlocutor.avatar} 
                                      alt="" 
                                      width={32} 
                                      height={32} 
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                      {senderName[0]}
                                    </div>
                                  )
                                ) : (
                                  <div className="w-8" /> // Пустое место
                                )}
                              </div>
                            )}

                            {/* Пузырь сообщения */}
                            <div className="relative group">
                              <div
                                className={cn(
                                  "relative px-3 py-2 shadow-sm text-[15px] leading-[1.4] break-words min-w-[120px]",
                                  isMyMessage
                                    ? "bg-[#EFFDDE] text-gray-900"
                                    : "bg-white text-gray-900",
                                  // Скругления углов для группировки
                                  isMyMessage
                                    ? (isLastInGroup ? "rounded-br-md" : "rounded-br-lg") + " rounded-l-2xl rounded-tr-2xl"
                                    : (isLastInGroup ? "rounded-bl-md" : "rounded-bl-lg") + " rounded-r-2xl rounded-tl-2xl",
                                  // Оптимистичное сообщение (прозрачность)
                                  (msg as any).is_optimistic && "opacity-70"
                                )}
                              >
                                <p className="whitespace-pre-wrap inline">
                                  {msg.content}
                                  {/* Невидимый пробел для отступа времени */}
                                  <span className="inline-block w-12"></span>
                                </p>
                                
                                <div className={cn(
                                  "float-right -mt-1 ml-2 flex items-center gap-0.5 text-[11px] select-none h-4 align-bottom",
                                  isMyMessage ? "text-[#59a648]" : "text-gray-400"
                                )}>
                                  {(() => {
                                    try {
                                      const date = new Date(msg.created_at)
                                      return isNaN(date.getTime()) ? '--:--' : format(date, 'HH:mm')
                                    } catch {
                                      return '--:--'
                                    }
                                  })()}
                                  {isMyMessage && (
                                    (msg.read_at) ? (
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    ) : (
                                      <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Реакции */}
                              {reactions[msg.id]?.length > 0 && (
                                <div className={cn(
                                  "absolute -bottom-3 z-10 flex gap-0.5",
                                  isMyMessage ? "right-0" : "left-0"
                                )}>
                                  {Object.entries(
                                    reactions[msg.id].reduce((acc, r) => {
                                      acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                      return acc
                                    }, {} as Record<string, number>)
                                  ).map(([emoji, count], emojiIndex) => (
                                    <span key={`reaction-${msg.id}-${emoji}-${emojiIndex}`} className="bg-white border border-gray-100 rounded-full px-1.5 py-0.5 text-[11px] shadow-sm flex items-center gap-0.5">
                                      <span>{emoji}</span>
                                      {count > 1 && <span className="text-gray-500 font-medium">{count}</span>}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Индикатор "Печатает..." */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-center gap-2 ml-10 mt-2 text-xs text-gray-400 animate-pulse">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>печатает...</span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Ввод сообщения */}
            <div className="px-4 py-3 chat:p-4 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-3">
                <Textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onFocus={markMessagesAsRead}
                  onClick={markMessagesAsRead}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение..."
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-[22px] border-gray-200 focus:border-orange-300"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="h-11 w-11 rounded-full bg-orange-500 hover:bg-orange-600 p-0"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )})() : (
          /* Заглушка, когда чат не выбран */
          <div className="hidden chat:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">Выберите диалог</h3>
              <p className="text-gray-400 mt-1">
                Или начните новый, приняв отклик на объявление
              </p>
            </div>
          </div>
        )}

        {/* Контекст сделки (справа) — только на десктопе, показывается по кнопке */}
        {selectedChatId && selectedConversation && (selectedConversation.order_requests || selectedConversation.order) && (
          <div 
            className={cn(
              "hidden chat:flex border-l border-gray-100 flex-col bg-white shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
              showDealInfo ? "w-80 opacity-100" : "w-0 opacity-0 border-l-0"
            )}
          >
            <div className="p-5 border-b border-gray-100 min-w-[320px]">
              <h4 className="text-lg font-semibold text-gray-900">
                {selectedConversation.order ? 'О заказе' : 'О сделке'}
              </h4>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto flex-1 min-w-[320px]">
              {/* ==== ИНФОРМАЦИЯ ОБ ОБЪЯВЛЕНИИ (order_requests) ==== */}
              {selectedConversation.order_requests && (
                <>
                  {/* Название */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Объявление</p>
                    <p className="text-[15px] leading-snug text-gray-900">
                      {selectedConversation.order_requests.title}
                    </p>
                  </div>

                  {/* Категория */}
                  {selectedConversation.order_requests.category && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Категория</p>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                        {categoryLabels[selectedConversation.order_requests.category] || selectedConversation.order_requests.category}
                      </span>
                    </div>
                  )}

                  {/* Дата */}
                  {selectedConversation.order_requests.event_date && (
                    <div className="flex items-center gap-2.5 text-[15px] text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{format(new Date(selectedConversation.order_requests.event_date), 'd MMMM yyyy', { locale: ru })}</span>
                    </div>
                  )}

                  {/* Город */}
                  {selectedConversation.order_requests.city && (
                    <div className="flex items-center gap-2.5 text-[15px] text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{selectedConversation.order_requests.city}</span>
                    </div>
                  )}

                  {/* Бюджет */}
                  {selectedConversation.order_requests.budget && (
                    <div className="flex items-center gap-2.5 text-[15px] text-gray-700">
                      <Banknote className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-semibold">{selectedConversation.order_requests.budget.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}

                  {/* Статус */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Статус</p>
                    <span className={cn(
                      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium",
                      selectedConversation.order_requests.status === 'in_progress' 
                        ? "bg-yellow-50 text-yellow-700"
                        : selectedConversation.order_requests.status === 'closed'
                        ? "bg-green-50 text-green-700"
                        : selectedConversation.order_requests.status === 'cancelled'
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    )}>
                      {selectedConversation.order_requests.status === 'in_progress' && 'В работе'}
                      {selectedConversation.order_requests.status === 'closed' && 'Завершено'}
                      {selectedConversation.order_requests.status === 'active' && 'Активно'}
                      {selectedConversation.order_requests.status === 'cancelled' && 'Отменено'}
                    </span>
                  </div>

                  {/* Кнопки управления для владельца объявления */}
                  {isOrderOwner(selectedConversation) && (
                    (selectedConversation.order_requests.status === 'active' && selectedConversation.response_id) ||
                    selectedConversation.order_requests.status === 'in_progress'
                  ) && (
                    <div className="pt-4 border-t border-gray-100 space-y-2.5">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-3 font-medium">Управление</p>
                      
                      {selectedConversation.order_requests.status === 'active' && selectedConversation.response_id && (
                        <>
                          <Button
                            onClick={handleAcceptResponse}
                            disabled={isProcessingAction}
                            className="w-full bg-green-500 hover:bg-green-600 rounded-full text-sm h-10"
                          >
                            {isProcessingAction ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Принять исполнителя
                          </Button>
                          <Button
                            onClick={handleRejectResponse}
                            disabled={isProcessingAction}
                            variant="outline"
                            className="w-full rounded-full text-sm h-10 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Отклонить
                          </Button>
                        </>
                      )}
                      
                      {selectedConversation.order_requests.status === 'in_progress' && (
                        <Button
                          onClick={handleCancelPerformer}
                          disabled={isProcessingAction}
                          variant="outline"
                          className="w-full rounded-full text-sm h-10 border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          {isProcessingAction ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Ban className="w-4 h-4 mr-2" />
                          )}
                          Отменить исполнителя
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Кнопка перехода к объявлению */}
                  <Link href={`/board/${selectedConversation.source_id}`} className="block">
                    <Button variant="outline" className="w-full rounded-full h-10 border-gray-200 hover:bg-gray-50">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Открыть объявление
                    </Button>
                  </Link>
                </>
              )}

              {/* ==== ИНФОРМАЦИЯ О ЗАКАЗЕ (order) ==== */}
              {selectedConversation.order && (
                <>
                  {/* Название профиля/сервиса */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Сервис</p>
                    <p className="text-[15px] leading-snug text-gray-900">
                      {selectedConversation.order.profile?.display_name || 'Заказ'}
                    </p>
                  </div>

                  {/* Номер заказа */}
                  {selectedConversation.order.order_number && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Номер заказа</p>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        № {selectedConversation.order.order_number}
                      </span>
                    </div>
                  )}

                  {/* Сумма */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Сумма заказа</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedConversation.order.total_amount?.toLocaleString()} ₽
                    </p>
                  </div>

                  {/* Дата и время */}
                  {selectedConversation.order.event_date && (
                    <div className="flex items-center gap-2.5 text-[15px] text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>
                        {format(new Date(selectedConversation.order.event_date), 'd MMMM yyyy', { locale: ru })}
                        {selectedConversation.order.event_time && ` в ${selectedConversation.order.event_time.slice(0, 5)}`}
                      </span>
                    </div>
                  )}

                  {/* Адрес */}
                  {selectedConversation.order.event_address && (
                    <div className="flex items-start gap-2.5 text-[15px] text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="leading-snug">{selectedConversation.order.event_address}</span>
                    </div>
                  )}

                  {/* Статус */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Статус</p>
                    <span className={cn(
                      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium",
                      selectedConversation.order.status === 'confirmed' 
                        ? "bg-green-50 text-green-700"
                        : selectedConversation.order.status === 'cancelled' || selectedConversation.order.status === 'rejected'
                        ? "bg-red-50 text-red-700"
                        : selectedConversation.order.status === 'completed'
                        ? "bg-blue-50 text-blue-700"
                        : "bg-yellow-50 text-yellow-700"
                    )}>
                      {selectedConversation.order.status === 'pending' && 'Ожидает подтверждения'}
                      {selectedConversation.order.status === 'confirmed' && 'Подтверждён'}
                      {selectedConversation.order.status === 'in_progress' && 'В работе'}
                      {selectedConversation.order.status === 'completed' && 'Завершён'}
                      {selectedConversation.order.status === 'cancelled' && 'Отменён'}
                      {selectedConversation.order.status === 'rejected' && 'Отклонён'}
                    </span>
                  </div>

                  {/* Кнопка перехода к заказу */}
                  <Link href={`/orders?id=${selectedConversation.order.id}`} className="block">
                    <Button variant="outline" className="w-full rounded-full h-10 border-gray-200 hover:bg-gray-50">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Открыть заказ
                    </Button>
                  </Link>
                </>
              )}

              {/* Кнопка жалобы — общая */}
              <Button
                onClick={handleReport}
                variant="ghost"
                className="w-full rounded-full text-sm h-10 text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Пожаловаться
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


