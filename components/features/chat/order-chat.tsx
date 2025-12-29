/**
 * Компонент чата для заявок (orders)
 * Мессенджер-стиль с пузырьками сообщений
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  order_id: string
  sender_id: string
  sender_role: 'client' | 'provider'
  message: string
  is_read: boolean
  created_at: string
  updated_at: string
}

interface OrderChatProps {
  orderId: string
  currentUserRole: 'client' | 'provider'
  className?: string
}

export function OrderChat({ orderId, currentUserRole, className }: OrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Загрузка сообщений
  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error: any) {
      console.error('Load messages error:', error)
      toast.error('Не удалось загрузить сообщения')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    // Автообновление каждые 10 секунд
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [orderId])

  // Автоскролл при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages([...messages, data.message])
      setNewMessage('')
      
      // Фокус на textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } catch (error: any) {
      console.error('Send message error:', error)
      toast.error('Не удалось отправить сообщение')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Заголовок чата */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
          Чат с {currentUserRole === 'client' ? 'исполнителем' : 'клиентом'}
        </h4>
        {messages.length > 0 && (
          <span className="text-xs text-gray-500">
            ({messages.length} {messages.length === 1 ? 'сообщение' : 'сообщений'})
          </span>
        )}
      </div>

      {/* Область сообщений */}
      <div 
        ref={scrollRef}
        className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-3 space-y-3 overflow-y-auto"
        style={{ maxHeight: '400px', minHeight: '200px' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Начните диалог, отправив сообщение
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_role === currentUserRole
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  isOwnMessage ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  )}
                >
                  {/* Роль отправителя (для clarity) */}
                  <div className={cn(
                    'text-xs font-semibold mb-1',
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    {msg.sender_role === 'client' ? '👤 Клиент' : '🏢 Исполнитель'}
                  </div>
                  
                  {/* Текст сообщения */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                  
                  {/* Время */}
                  <div className={cn(
                    'text-xs mt-1',
                    isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                  )}>
                    {format(new Date(msg.created_at), 'HH:mm', { locale: ru })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Поле ввода */}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Напишите сообщение..."
          rows={2}
          disabled={isSending}
          className="resize-none flex-1 text-sm"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          className="h-auto px-4"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        💡 Нажмите Enter для отправки, Shift+Enter для новой строки
      </p>
    </div>
  )
}


