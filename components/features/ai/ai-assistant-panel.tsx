'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Wand2, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AIAssistantPanelProps {
  type: 'short' | 'long'
  currentText: string
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

export function AIAssistantPanel({
  type,
  currentText,
  profileType,
  profileName,
  category,
  existingData,
  onGenerated,
  className = ''
}: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'improve' | 'rewrite' | 'custom'>('rewrite')
  const [customPrompt, setCustomPrompt] = useState('')

  const hasText = currentText && currentText.trim().length > 0

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
          existingData: {
            ...existingData,
            shortDescription: type === 'short' ? currentText : undefined,
            longDescription: type === 'long' ? currentText : undefined,
          },
          mode,
          customPrompt: mode === 'custom' ? customPrompt : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          throw new Error('Превышен лимит запросов. Попробуйте через минуту.')
        } else if (response.status === 503) {
          throw new Error('Сервис AI временно перегружен. Попробуйте через 10-30 секунд.')
        } else if (errorData.error) {
          throw new Error(errorData.error)
        } else {
          throw new Error('Не удалось сгенерировать описание')
        }
      }

      const data = await response.json()

      if (data.description) {
        onGenerated(data.description)
        setError(null)
        setIsOpen(false) // Закрываем панель после успешной генерации
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

  // Определяем текст и иконку для кнопки режима
  const getModeButton = (modeType: 'improve' | 'rewrite' | 'custom') => {
    const isActive = mode === modeType
    
    const modeConfig = {
      improve: {
        icon: Wand2,
        label: 'Улучшить',
        disabled: !hasText,
      },
      rewrite: {
        icon: Sparkles,
        label: 'Написать заново',
        disabled: false,
      },
      custom: {
        icon: Edit,
        label: 'Своя инструкция',
        disabled: false,
      },
    }

    const config = modeConfig[modeType]
    const Icon = config.icon

    return (
      <Button
        type="button"
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={() => setMode(modeType)}
        disabled={config.disabled}
        className={`flex-1 gap-2 rounded-xl ${
          isActive 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50'
        }`}
      >
        <Icon className="h-4 w-4" />
        {config.label}
      </Button>
    )
  }

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600 hover:text-purple-700 w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            AI Ассистент
            {isOpen ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 space-y-4">
            {/* Выбор режима */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Что сделать?
              </Label>
              <div className="flex gap-2">
                {getModeButton('improve')}
                {getModeButton('rewrite')}
                {getModeButton('custom')}
              </div>
            </div>

            {/* Кастомная инструкция */}
            {mode === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-prompt" className="text-sm font-medium text-slate-700">
                  Ваша инструкция для AI:
                </Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="Например: 'Добавь больше эмоций', 'Убери упоминание адреса', 'Сделай короче'"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="rounded-xl border-slate-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
            )}

            {/* Подсказка по режиму */}
            <Alert className="border-purple-200 bg-white">
              <AlertDescription className="text-xs text-slate-600">
                {mode === 'improve' && '🪄 AI улучшит ваш текущий текст: уберёт штампы, добавит конкретики'}
                {mode === 'rewrite' && '✨ AI создаст новый текст с учётом данных профиля'}
                {mode === 'custom' && '✍️ AI выполнит вашу инструкцию'}
              </AlertDescription>
            </Alert>

            {/* Ошибка */}
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Кнопка генерации */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-xl"
              >
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || (mode === 'custom' && !customPrompt.trim())}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Сгенерировать
                  </>
                )}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}




