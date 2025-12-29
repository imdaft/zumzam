'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Wand2, Edit, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AIQuickAssistantProps {
  shortText: string
  longText: string
  profileName: string
  category: string
  profileType: string
  existingData?: {
    services?: string[]
    address?: string
    features?: string[]
  }
  onShortGenerated: (text: string) => void
  onLongGenerated: (text: string) => void
  className?: string
}

export function AIQuickAssistant({
  shortText,
  longText,
  profileName,
  category,
  profileType,
  existingData,
  onShortGenerated,
  onLongGenerated,
  className = ''
}: AIQuickAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<'short' | 'long' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [customPromptFor, setCustomPromptFor] = useState<'short' | 'long' | null>(null)

  const generateDescription = async (
    type: 'short' | 'long',
    mode: 'improve' | 'rewrite' | 'custom',
    prompt?: string
  ) => {
    if (!profileName.trim()) {
      setError('Укажите название профиля')
      return
    }

    setIsGenerating(true)
    setGeneratingType(type)
    setError(null)

    try {
      const currentText = type === 'short' ? shortText : longText
      
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          profileType,
          profileName,
          category,
          existingData: {
            ...existingData,
            shortDescription: shortText,
            longDescription: longText,
          },
          mode,
          customPrompt: prompt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          throw new Error('Лимит запросов. Попробуйте через минуту.')
        } else if (response.status === 503) {
          throw new Error('AI перегружен. Попробуйте через 10-30 сек.')
        } else if (errorData.error) {
          throw new Error(errorData.error)
        } else {
          throw new Error('Не удалось сгенерировать')
        }
      }

      const data = await response.json()

      if (data.description) {
        if (type === 'short') {
          onShortGenerated(data.description)
        } else {
          onLongGenerated(data.description)
        }
        setError(null)
        setShowCustomPrompt(false)
        setCustomPrompt('')
      } else {
        throw new Error('Пустой ответ от AI')
      }
    } catch (err) {
      console.error('Error generating description:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ошибка генерации'
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }

  const handleImprove = (type: 'short' | 'long') => {
    const text = type === 'short' ? shortText : longText
    if (!text || text.trim().length === 0) {
      setError('Нет текста для улучшения')
      return
    }
    generateDescription(type, 'improve')
  }

  const handleRewrite = (type: 'short' | 'long') => {
    generateDescription(type, 'rewrite')
  }

  const handleCustomPromptOpen = (type: 'short' | 'long') => {
    setCustomPromptFor(type)
    setShowCustomPrompt(true)
    setError(null)
  }

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) {
      setError('Введите инструкцию')
      return
    }
    if (customPromptFor) {
      generateDescription(customPromptFor, 'custom', customPrompt)
    }
  }

  const isLoading = (type: 'short' | 'long') => isGenerating && generatingType === type

  return (
    <div className={className}>
      {/* Краткое описание */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Краткое:</span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleImprove('short')}
              disabled={isGenerating || !shortText.trim()}
              className="h-7 px-2 text-xs gap-1 rounded-lg border-slate-200 hover:border-purple-300 hover:bg-purple-50"
            >
              {isLoading('short') ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              Улучшить
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRewrite('short')}
              disabled={isGenerating}
              className="h-7 px-2 text-xs gap-1 rounded-lg border-slate-200 hover:border-purple-300 hover:bg-purple-50"
            >
              {isLoading('short') ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Заново
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCustomPromptOpen('short')}
              disabled={isGenerating}
              className="h-7 px-2 text-xs gap-1 rounded-lg border-slate-200 hover:border-purple-300 hover:bg-purple-50"
            >
              <Edit className="h-3 w-3" />
              Своя
            </Button>
          </div>
        </div>
      </div>

      {/* Подробное описание */}
      <div className="space-y-2 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Подробное:</span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleImprove('long')}
              disabled={isGenerating || !longText.trim()}
              className="h-7 px-2 text-xs gap-1 rounded-lg border-slate-200 hover:border-purple-300 hover:bg-purple-50"
            >
              {isLoading('long') ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              Улучшить
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRewrite('long')}
              disabled={isGenerating}
              className="h-7 px-2 text-xs gap-1 rounded-lg border-slate-200 hover:border-purple-300 hover:bg-purple-50"
            >
              {isLoading('long') ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Заново
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCustomPromptOpen('long')}
              disabled={isGenerating}
              className="h-7 px-2 text-xs gap-1 rounded-lg border-slate-200 hover:border-purple-300 hover:bg-purple-50"
            >
              <Edit className="h-3 w-3" />
              Своя
            </Button>
          </div>
        </div>
      </div>

      {/* Кастомная инструкция (компактное окно) */}
      {showCustomPrompt && (
        <div className="mt-3 p-3 rounded-lg border border-purple-200 bg-purple-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">
              Инструкция для {customPromptFor === 'short' ? 'краткого' : 'подробного'} описания:
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCustomPrompt(false)
                setCustomPrompt('')
                setError(null)
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            placeholder="Например: 'Добавь больше эмоций', 'Убери упоминание цен'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            className="text-sm rounded-lg border-slate-200 focus:border-purple-300 focus:ring-purple-200"
          />
          <Button
            type="button"
            onClick={handleCustomPromptSubmit}
            disabled={isGenerating || !customPrompt.trim()}
            className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg gap-2 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Отправить
              </>
            )}
          </Button>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}




