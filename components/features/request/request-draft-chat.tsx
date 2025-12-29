'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Mic, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type DraftResponse = {
  response: string
  suggestions?: string[]
  gallery?: unknown[]
}

export function RequestDraftChat({
  compact = false,
}: {
  /** Компактный триггер для шапки (иконка/короткий текст) */
  compact?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant' as const,
          content: '👋 Скажи, что нужно: дата, время, кто нужен, адрес/город, бюджет. Я соберу черновик без публикации.',
        },
      ])
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const resp = await fetch('/api/ai/request-draft-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: nextMessages.filter((m) => m.role === 'user').map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.error || 'Не удалось обработать запрос')
      }

      const data: DraftResponse = await resp.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: error.message || 'Ошибка, попробуйте ещё раз' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'rounded-full border-blue-200 text-blue-700 hover:bg-blue-50',
          compact ? 'h-10 px-4 text-sm font-semibold' : 'h-11 px-5 text-sm font-semibold'
        )}
        onClick={() => setIsOpen(true)}
      >
        {compact ? (
          <>
            AI-черновик
            <Mic className="w-4 h-4 ml-2" />
          </>
        ) : (
          <>
            Создать объявление с AI
            <Mic className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AI-черновик объявления</CardTitle>
                <CardDescription>Только сбор данных — без публикации</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'px-3 py-2 rounded-[18px] text-sm',
                      m.role === 'user'
                        ? 'bg-orange-500 text-white ml-auto max-w-[85%]'
                        : 'bg-blue-50 text-gray-900 mr-auto max-w-[90%] border border-blue-100'
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Пример: 25 декабря 17:00 фокусник, ресторан ..., бюджет 15000, детям 10, 7 лет"
                  className="min-h-[48px] max-h-24 rounded-[18px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading}
                  className="rounded-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}











