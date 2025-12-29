'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, Check, CheckCheck, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAuth } from '@/lib/contexts/auth-context'
import { cn } from '@/lib/utils'

interface CompactOrderChatProps {
  conversationId?: string | null
  orderId?: string
  currentUserRole: 'client' | 'provider'
  clientName?: string
  providerName?: string
}

interface Message {
  id: string
  sender_id?: string // Добавили ID
  sender_role?: 'client' | 'provider'
  content?: string
  message?: string
  read_at?: string | null
  is_read?: boolean
  created_at: string
}

export function CompactOrderChat({
  conversationId,
  orderId,
  currentUserRole,
  clientName = 'Клиент',
  providerName = 'Исполнитель',
}: CompactOrderChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId || null)
  const [reactions, setReactions] = useState<Record<string, Array<{ emoji: string; user_id: string }>>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(0)

  // Гарантируем, что есть conversation_id: если нет — создаём/получаем через /api/conversations/ensure-for-order
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (activeConversationId) return activeConversationId
    if (!orderId) return null

    try {
      const resp = await fetch(`/api/conversations/ensure-for-order?order_id=${orderId}`)
      if (!resp.ok) return null
      const data = await resp.json()
      const convId = data?.conversation_id || null
      if (convId) setActiveConversationId(convId)
      return convId
    } catch (err) {
      console.error('ensureConversation error:', err)
      return null
    }
  }, [activeConversationId, orderId])

  // Загрузка реакций для сообщений - batch запрос
  const loadReactionsForMessages = useCallback(async (msgs: Message[]) => {
    if (msgs.length === 0) {
      setReactions({})
      return
    }
    
    try {
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

  // Загрузка сообщений: convId обязателен; если нет — пытаемся создать/получить
  const loadMessages = useCallback(async (showLoader = false) => {
    if (showLoader) setIsInitialLoading(true)
    try {
      const convId = await ensureConversation()

      if (!convId) {
        setMessages([])
        return
      }

      const response = await fetch(`/api/conversations/${convId}/messages`)
      if (response.ok) {
        const result = await response.json()
        const msgs = result.messages || []
        setMessages(msgs)
        // Загружаем реакции для всех сообщений
        loadReactionsForMessages(msgs)
      } else {
        console.error('Load messages error:', await response.text())
      }
    } catch (error) {
      console.error('Load messages error:', error)
    } finally {
      if (showLoader) setIsInitialLoading(false)
    }
  }, [ensureConversation, loadReactionsForMessages])

  // Пуллинг
  useEffect(() => {
    if (activeConversationId || orderId) {
      loadMessages(true)
      const interval = setInterval(() => loadMessages(false), 5000)
      return () => clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, orderId])

  // Автоскролл к низу ("Магнит") - ТОЛЬКО внутри чата
  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      // Находим viewport внутри ScrollArea (Radix UI структура)
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      } else {
        // Fallback если структура другая или обычный div
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
  }, [messages])

  // Отправка
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const convId = activeConversationId || (await ensureConversation())
    if (!newMessage.trim() || !convId || isSending) return

    const content = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // Оптимистичное добавление
    const optimisticMessage: any = {
      id: tempId,
      conversation_id: convId,
      sender_id: user?.id,
      sender_role: currentUserRole,
      content: content,
      created_at: new Date().toISOString(),
      read_at: null,
      is_optimistic: true
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setIsSending(true)

    // Скролл вниз без дерганья страницы
    setTimeout(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
        if (viewport) viewport.scrollTop = viewport.scrollHeight
        else scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 10)

    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Ошибка отправки')
      }

      const savedMessage = await response.json()
      // Заменяем временное на настоящее
      setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m))
    } catch (error: any) {
      toast.error('Ошибка отправки сообщения')
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  const isMyMessage = (message: Message): boolean => {
    if (user?.id && message.sender_id) {
      return message.sender_id === user.id
    }
    if (message.sender_role) return message.sender_role === currentUserRole
    return false
  }

  const getSenderName = (message: Message): string => {
    // Если есть sender_role, используем его
    if (message.sender_role === 'client') return clientName
    if (message.sender_role === 'provider') return providerName
    
    // Иначе определяем по sender_id
    if (message.sender_id === user?.id) {
      // Это моё сообщение
      return currentUserRole === 'client' ? clientName : providerName
    } else {
      // Это сообщение собеседника
      return currentUserRole === 'client' ? providerName : clientName
    }
  }

  const getMessageText = (message: Message): string => {
    return message.content || message.message || ''
  }

  const isMessageRead = (message: Message): boolean => {
    if (message.read_at !== undefined) return !!message.read_at
    if (message.is_read !== undefined) return message.is_read
    return false
  }

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
  }, [reactions, user])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-gray-400">
            <p className="text-sm">Сообщений пока нет</p>
            <p className="text-xs mt-1">Начните общение</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const isMine = isMyMessage(message)
              
              // Логика группировки
              const prevMsg = messages[index - 1]
              const nextMsg = messages[index + 1]
              
              // Сравниваем sender_role для группировки
              const prevRole = prevMsg?.sender_role
              const currRole = message.sender_role
              const nextRole = nextMsg?.sender_role
              
              const isFirstInGroup = !prevMsg || prevRole !== currRole
              const isLastInGroup = !nextMsg || nextRole !== currRole
              
              // Разделитель дат
              let showDateSeparator = false
              if (index === 0) {
                showDateSeparator = true
              } else {
                const prevDate = new Date(prevMsg.created_at).toDateString()
                const currDate = new Date(message.created_at).toDateString()
                if (prevDate !== currDate) showDateSeparator = true
              }

              return (
                <div key={message.id}>
                  {/* Разделитель дат */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-4 sticky top-0 z-10">
                      <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">
                        {(() => {
                          try {
                            const date = new Date(message.created_at)
                            return isNaN(date.getTime()) ? 'Дата' : format(date, 'd MMMM', { locale: ru })
                          } catch {
                            return 'Дата'
                          }
                        })()}
                      </span>
                    </div>
                  )}

                  <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-1'} group`}>
                    <div className={`max-w-[85%] md:max-w-[75%] flex items-end ${isMine ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
                      {/* Пузырь сообщения */}
                      <div
                        className={`relative px-3 py-2 shadow-sm text-[14px] md:text-[15px] leading-[1.4] break-words min-w-[100px]
                          ${isMine ? 'bg-[#EFFDDE] text-gray-900' : 'bg-gray-100 text-gray-900'}
                          ${isMine 
                            ? (isLastInGroup ? 'rounded-br-md' : 'rounded-br-lg') + ' rounded-l-2xl rounded-tr-2xl'
                            : (isLastInGroup ? 'rounded-bl-md' : 'rounded-bl-lg') + ' rounded-r-2xl rounded-tl-2xl'
                          }
                          ${(message as any).is_optimistic ? 'opacity-70' : ''}
                        `}
                      >
                        {/* Имя отправителя только у первого сообщения в группе и только для чужих */}
                        {!isMine && isFirstInGroup && (
                          <div className="mb-1 text-xs font-medium text-orange-600">
                            {getSenderName(message)}
                          </div>
                        )}

                        <p className="whitespace-pre-wrap inline">
                          {getMessageText(message)}
                          <span className="inline-block w-10"></span>
                        </p>
                          
                        <div className={`float-right -mt-1 ml-2 flex items-center gap-0.5 text-[11px] select-none h-4 align-bottom
                          ${isMine ? 'text-[#59a648]' : 'text-gray-400'}
                        `}>
                          {(() => {
                            try {
                              const date = new Date(message.created_at)
                              return isNaN(date.getTime()) ? '--:--' : format(date, 'HH:mm')
                            } catch {
                              return '--:--'
                            }
                          })()}
                          {isMine && (
                            isMessageRead(message) ? (
                              <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                            )
                          )}
                        </div>

                        {/* Реакции */}
                        {(() => {
                          const messageReactions = reactions[message.id]
                          if (!messageReactions || messageReactions.length === 0) return null
                          
                          const reactionGroups = messageReactions.reduce((acc, r) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                          
                          return (
                            <div className={cn(
                              "absolute -bottom-3 z-10 flex gap-0.5",
                              isMine ? "right-0" : "left-0"
                            )}>
                              {Object.entries(reactionGroups).map(([emoji, count]) => (
                                <span 
                                  key={`${message.id}-${emoji}`} 
                                  className="bg-white border border-gray-100 rounded-full px-1.5 py-0.5 text-[11px] shadow-sm flex items-center gap-0.5"
                                >
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-gray-500 font-medium">{count}</span>}
                                </span>
                              ))}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Кнопка добавления реакции */}
                      <button
                        type="button"
                        onClick={() => toggleReaction(message.id, '❤️')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-100 rounded-full"
                        title="Добавить реакцию"
                      >
                        <Smile className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Написать сообщение..."
            disabled={isSending}
            className="flex-1 text-sm h-10 md:h-9 rounded-xl"
          />
          <Button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            size="icon"
            className="h-10 w-10 md:h-9 md:w-9 rounded-xl shrink-0"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
