'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AIDescriptionGeneratorProps {
  type: 'short' | 'long'
  profileType: string
  profileName: string
  category: string
  existingData?: {
    shortDescription?: string
    longDescription?: string
    services?: string[]
    address?: string
    features?: string[]
  }
  onGenerated: (description: string) => void
  className?: string
}

export function AIDescriptionGenerator({
  type,
  profileType,
  profileName,
  category,
  existingData,
  onGenerated,
  className = ''
}: AIDescriptionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Определяем, есть ли текущий текст для улучшения
  const hasExistingText = type === 'short' 
    ? (existingData?.shortDescription && existingData.shortDescription.trim().length > 0)
    : (existingData?.longDescription && existingData.longDescription.trim().length > 0)
  
  const buttonText = hasExistingText ? 'Улучшить текст' : 'Сгенерировать с AI'

  const handleGenerate = async () => {
    if (!profileName.trim()) {
      setError('Сначала укажите название профиля')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
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
          existingData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Более понятные сообщения об ошибках
        if (response.status === 429) {
          throw new Error('Превышен лимит запросов. Попробуйте через минуту.')
        } else if (errorData.error) {
          throw new Error(errorData.error)
        } else {
          throw new Error('Не удалось сгенерировать описание')
        }
      }

      const data = await response.json()
      
      if (data.description) {
        onGenerated(data.description)
        setError(null) // Очищаем предыдущие ошибки
      } else {
        throw new Error('Пустой ответ от AI')
      }
    } catch (err) {
      console.error('Error generating description:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ошибка генерации. Попробуйте ещё раз.'
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={className}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !profileName.trim()}
              className="gap-2 rounded-xl border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600 hover:text-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {hasExistingText ? 'Улучшаем...' : 'Генерация...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {buttonText}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {type === 'short' 
                  ? '✨ Краткое описание (1-2 предложения, до 120 символов)' 
                  : '✨ Подробное описание (1 абзац, до 500 символов)'}
              </p>
              <p className="text-xs text-muted-foreground">
                💡 Для лучшего результата заполните: название профиля, категорию и основную информацию
              </p>
              {(profileName && (type === 'short' ? existingData?.shortDescription : existingData?.longDescription)) ? (
                <p className="text-xs text-green-600 font-medium">
                  🔄 AI улучшит ваш текущий текст
                </p>
              ) : (
                <p className="text-xs text-blue-600 font-medium">
                  ✨ AI создаст описание с нуля
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

