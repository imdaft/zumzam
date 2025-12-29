'use client'

import { useState } from 'react'
import { Sparkles, Loader2, X, Wand2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface AIAssistantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'short' | 'long'
  currentText: string
  profileName: string
  category: string
  profileType: string
  existingData?: {
    shortDescription?: string
    longDescription?: string
    services?: string[]
    address?: string
    features?: string[]
  }
  onGenerated: (text: string) => void
}

export function AIAssistantModal({
  open,
  onOpenChange,
  type,
  currentText,
  profileName,
  category,
  profileType,
  existingData,
  onGenerated
}: AIAssistantModalProps) {
  const [mode, setMode] = useState<'improve' | 'rewrite' | 'custom'>('improve')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!profileName.trim()) {
      setError('Сначала укажите название профиля')
      return
    }

    if (mode === 'custom' && !customPrompt.trim()) {
      setError('Укажите, что нужно сделать с текстом')
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
          existingData: {
            ...existingData,
            shortDescription: type === 'short' ? currentText : existingData?.shortDescription,
            longDescription: type === 'long' ? currentText : existingData?.longDescription,
          },
          mode, // improve, rewrite, или custom
          customPrompt: mode === 'custom' ? customPrompt : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
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
        onOpenChange(false) // Закрываем модалку
        setCustomPrompt('') // Очищаем кастомный промпт
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

  const hasText = currentText && currentText.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Ассистент
          </DialogTitle>
          <DialogDescription>
            {type === 'short' 
              ? 'Генерация краткого описания (1-2 предложения, до 120 символов)' 
              : 'Генерация подробного описания (1 абзац, до 500 символов)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Режим работы */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Что сделать?</Label>
            
            <div className="grid gap-2">
              {/* Улучшить текст */}
              {hasText && (
                <button
                  onClick={() => setMode('improve')}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    mode === 'improve' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <Wand2 className={`h-5 w-5 mt-0.5 ${mode === 'improve' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Улучшить текущий текст</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      AI доработает ваш текст: уберёт штампы, добавит конкретики
                    </div>
                  </div>
                </button>
              )}

              {/* Написать заново */}
              <button
                onClick={() => setMode('rewrite')}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  mode === 'rewrite' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <RefreshCw className={`h-5 w-5 mt-0.5 ${mode === 'rewrite' ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">Написать заново</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    AI создаст новый текст с учётом данных профиля
                  </div>
                </div>
              </button>

              {/* Кастомный промпт */}
              <button
                onClick={() => setMode('custom')}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  mode === 'custom' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <Sparkles className={`h-5 w-5 mt-0.5 ${mode === 'custom' ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">Своя инструкция</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Укажите, что именно нужно сделать с текстом
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Кастомный промпт */}
          {mode === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom-prompt" className="text-sm font-medium">
                Ваша инструкция для AI
              </Label>
              <Textarea
                id="custom-prompt"
                placeholder="Например: 'Добавь больше эмоций', 'Убери упоминание адреса', 'Сделай более формальным'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Отмена
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !profileName.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Сгенерировать
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}




