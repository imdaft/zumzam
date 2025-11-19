'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, X, Loader2, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    id: string
    type: string
    title: string
    similarity: number
  }>
}

interface ChatWidgetProps {
  profileId?: string
  profileName?: string
}

/**
 * RAG-чат виджет для ответов на вопросы о профилях
 */
export function ChatWidget({ profileId, profileName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Фокус на input при открытии
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Приветственное сообщение
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = profileName
        ? `Привет! 👋 Я помощник ${profileName}. Спросите меня о наших услугах, ценах, возрастных группах или чём угодно ещё!`
        : 'Привет! 👋 Я AI-помощник. Задайте мне вопрос о наших услугах!'
      
      setMessages([
        {
          role: 'assistant',
          content: greeting,
        },
      ])
    }
  }, [isOpen, profileName, messages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          profileId,
          conversationHistory: messages.slice(-4), // Последние 4 сообщения для контекста
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка чата')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте ещё раз.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  const quickQuestions = [
    'Какие услуги вы предлагаете?',
    'Сколько стоят ваши услуги?',
    'Для какого возраста подходит?',
    'Где вы находитесь?',
  ]

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">AI Помощник</h3>
                <p className="text-xs opacity-90">Спросите о чём угодно</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white dark:bg-slate-800 border'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs opacity-70">
                      <p className="font-semibold mb-1">Источники:</p>
                      {message.sources.map((source, i) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs">
                          {source.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-white dark:bg-slate-800 border rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t bg-white dark:bg-slate-800">
              <p className="text-xs text-muted-foreground mb-2">Быстрые вопросы:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs h-7"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white dark:bg-slate-800">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Задайте вопрос..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  )
}


