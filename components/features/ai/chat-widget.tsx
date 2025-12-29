'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, X, Mic, MicOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { DraggableGallery } from './draggable-gallery'

interface Message {
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
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
}

/**
 * AI Помощник для десктопа (левый нижний угол)
 * Использует тот же API что и мобильная версия
 */
export function ChatWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null) // Профиль текущей страницы
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Проверяем HTTPS для микрофона
  const [isSecureContext, setIsSecureContext] = useState(false)
  
  useEffect(() => {
    setIsSecureContext(typeof window !== 'undefined' && window.isSecureContext)
  }, [])
  
  // Определяем профиль текущей страницы
  useEffect(() => {
    const checkCurrentPage = async () => {
      // Проверяем если мы на странице профиля
      const profileMatch = pathname?.match(/\/profiles\/([^\/]+)/)
      if (profileMatch) {
        const slug = profileMatch[1]
        console.log('[Chat] Loading profile for slug:', slug)
        try {
          // Загружаем данные профиля
          const response = await fetch(`/api/profiles/by-slug/${slug}`)
          console.log('[Chat] Profile API response status:', response.status)
          
          if (response.ok) {
            const data = await response.json()
            console.log('[Chat] Profile loaded:', data)
            setCurrentProfile(data.profile)
            console.log('[Chat] Current profile set:', data.profile?.display_name)
          } else {
            // Профиль не найден - это нормально для пустой БД
            setCurrentProfile(null)
          }
        } catch (error) {
          console.error('[Chat] Error loading profile:', error)
          setCurrentProfile(null)
        }
      } else {
        console.log('[Chat] Not on profile page, pathname:', pathname)
        setCurrentProfile(null)
      }
    }
    
    checkCurrentPage()
  }, [pathname])
  
  // Загружаем историю при открытии чата
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory()
    }
  }, [isOpen])
  
  const loadChatHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch('/api/ai/chat/history')
      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        } else {
          // Нет истории - показываем приветствие
          setMessages([
            { role: 'assistant', content: '👋 Привет! Я помогу вам найти идеальный праздник для вашего ребенка. Расскажите, что планируете?' }
          ])
        }
      } else {
        // Ошибка загрузки - показываем приветствие
        setMessages([
          { role: 'assistant', content: '👋 Привет! Я помогу вам найти идеальный праздник для вашего ребенка. Расскажите, что планируете?' }
        ])
      }
    } catch (error) {
      console.error('[Chat] Error loading history:', error)
      setMessages([
        { role: 'assistant', content: '👋 Привет! Я помогу вам найти идеальный праздник для вашего ребенка. Расскажите, что планируете?' }
      ])
    } finally {
      setIsLoadingHistory(false)
    }
  }
  
  const saveMessage = async (message: Message) => {
    try {
      await fetch('/api/ai/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
    } catch (error) {
      console.error('[Chat] Error saving message:', error)
    }
  }
  
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
      handleQuickQuestion(text)
    },
    onError: (error) => {
      console.error('[Voice] Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `😔 ${error}` 
      }])
    },
  })

  // Автоскролл
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAILoading) return
    
    const userMessage = inputMessage.trim()
    setInputMessage('')
    
    const userMsg: Message = { role: 'user', content: userMessage }
    setMessages(prev => [...prev, userMsg])
    setIsAILoading(true)
    
    // Сохраняем сообщение пользователя
    await saveMessage(userMsg)

    try {
      // Берем последние 20 сообщений для контекста
      const recentMessages = messages.slice(-20)
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: recentMessages,
          currentProfileId: currentProfile?.id // Передаем ID профиля
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        if (response.status === 429) {
          const retryAt = errData.retry_at_iso
            ? new Date(errData.retry_at_iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : 'позже'
          throw new Error(`Лимит сообщений. Попробуйте после ${retryAt}.`)
        }
        throw new Error('AI request failed')
      }

      const data = await response.json().catch(() => ({}))
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.response,
        suggestions: data.suggestions || [],
        gallery: data.gallery || []
      }
      
      setMessages(prev => [...prev, assistantMsg])
      
      // Сохраняем ответ AI
      await saveMessage(assistantMsg)
    } catch (error) {
      console.warn('AI Error:', error)
      const errorMsg: Message = { 
        role: 'assistant', 
        content: error instanceof Error ? error.message : '😔 Извините, произошла ошибка. Попробуйте еще раз.' 
      }
      setMessages(prev => [...prev, errorMsg])
      await saveMessage(errorMsg)
    } finally {
      setIsAILoading(false)
    }
  }

  // Быстрый вопрос
  const handleQuickQuestion = async (question: string) => {
    if (isAILoading) return
    
    const userMsg: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])
    setIsAILoading(true)
    
    // Сохраняем сообщение пользователя
    await saveMessage(userMsg)

    try {
      // Берем последние 20 сообщений для контекста
      const recentMessages = messages.slice(-20)
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          conversationHistory: recentMessages,
          currentProfileId: currentProfile?.id // Передаем ID профиля
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        if (response.status === 429) {
          const retryAt = errData.retry_at_iso
            ? new Date(errData.retry_at_iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : 'позже'
          throw new Error(`Лимит сообщений. Попробуйте после ${retryAt}.`)
        }
        throw new Error('AI request failed')
      }

      const data = await response.json().catch(() => ({}))
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.response,
        suggestions: data.suggestions || [],
        gallery: data.gallery || []
      }
      
      setMessages(prev => [...prev, assistantMsg])
      
      // Сохраняем ответ AI
      await saveMessage(assistantMsg)
    } catch (error) {
      console.warn('AI Error:', error)
      const errorMsg: Message = { 
        role: 'assistant', 
        content: error instanceof Error ? error.message : '😔 Извините, произошла ошибка. Попробуйте еще раз.' 
      }
      setMessages(prev => [...prev, errorMsg])
      await saveMessage(errorMsg)
    } finally {
      setIsAILoading(false)
    }
  }

  // Новый чат
  const handleNewChat = async () => {
    // Очищаем историю в БД
    try {
      await fetch('/api/ai/chat/history', {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('[Chat] Error clearing history:', error)
    }
    
    // Очищаем локальное состояние
    setMessages([
      { role: 'assistant', content: '👋 Привет! Я помогу вам найти идеальный праздник для вашего ребенка. Расскажите, что планируете?' }
    ])
    setInputMessage('')
  }

  return (
    <>
      {/* Кнопка открытия */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-600 hover:scale-110 transition-all z-50"
          title="AI Помощник"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Окно чата */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 w-96 h-[600px] bg-white rounded-[24px] shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">AI Помощник</h3>
                <p className="text-xs opacity-90">ZumZam</p>
              </div>
            </div>
            <div className="flex gap-2">
              {messages.length > 1 && (
                <button
                  onClick={handleNewChat}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-colors"
                >
                  Новый чат
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <>
            {messages.map((msg, index) => {
              return (
                <div key={index} className="space-y-2">
                  <div className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div 
                      className={`max-w-[80%] px-4 py-3 rounded-[16px] text-sm ${
                        msg.role === 'user'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-slate-700 shadow-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p>{msg.content}</p>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({node, ...props}) => (
                              <Link 
                                href={props.href || '#'}
                                className="font-semibold text-orange-600 hover:text-orange-700 underline"
                                onClick={() => setIsOpen(false)}
                              >
                                {props.children}
                              </Link>
                            ),
                            strong: ({node, ...props}) => (
                              <strong className="font-bold text-slate-900">{props.children}</strong>
                            ),
                            p: ({node, ...props}) => (
                              <p className="leading-relaxed mb-2 last:mb-0">{props.children}</p>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                  
                  {/* Галерея с drag-to-scroll */}
                  {msg.gallery && msg.gallery.length > 0 && (
                    <DraggableGallery 
                      items={msg.gallery}
                      onItemClick={() => setIsOpen(false)}
                    />
                  )}
                  
                  {/* Варианты вопросов */}
                  {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-slate-500 font-medium px-1">Возможно, вас интересует:</p>
                      {msg.suggestions.map((suggestion, sIndex) => (
                        <button
                          key={sIndex}
                          onClick={() => handleQuickQuestion(suggestion)}
                          disabled={isAILoading}
                          className="text-left px-3 py-2 bg-white border border-slate-200 rounded-[12px] text-xs text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-all disabled:opacity-50"
                        >
                          💬 {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            
            {isAILoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-[16px] shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-white">
            {/* Индикатор записи */}
            {(isRecording || isTranscribing) && (
              <div className="mb-3 p-3 bg-orange-50 rounded-[16px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isRecording && (
                    <>
                      <Mic className="w-5 h-5 text-orange-600 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium">Запись...</p>
                        <p className="text-xs text-slate-600">{recordingDuration} сек</p>
                      </div>
                    </>
                  )}
                  {isTranscribing && (
                    <>
                      <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                      <p className="text-sm font-medium">Распознаю речь...</p>
                    </>
                  )}
                </div>
                {isRecording && (
                  <div className="flex gap-2">
                    <button
                      onClick={stopRecording}
                      className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
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
                  className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
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
                  className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
