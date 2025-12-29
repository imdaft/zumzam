'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Wand2, RefreshCw, Edit3, X, Type, Scissors, ArrowRightLeft, ChevronDown, Check, History, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AIFieldAssistantProps {
  type: 'short' | 'long'
  currentText: string
  profileName: string
  category: string
  subtype?: string // Тип площадки, тип шоу и т.д.
  existingData?: {
    shortDescription?: string
    longDescription?: string
  }
  onGenerated: (text: string) => void
}

// Экспортируем компонент-обертку для использования в форме
export function AIFieldAssistantWrapper(props: AIFieldAssistantProps & { children: React.ReactNode }) {
  const assistant = AIFieldAssistant(props)
  
  return (
    <>
      {/* Label */}
      <div className="mb-2">
        {props.children}
      </div>
      
      {/* Кнопки AI, строка ввода инструкции и ошибки - все возвращаем для вставки после поля */}
      {assistant.buttonsBlock}
    </>
  )
}

function AIFieldAssistant({
  type,
  currentText,
  profileName,
  category,
  subtype,
  existingData,
  onGenerated,
}: AIFieldAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  
  // Состояние для превью сгенерированного текста
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)
  const [lastMode, setLastMode] = useState<string>('')
  
  // История сгенерированных вариантов
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const generateDescription = async (
    mode: 'generate' | 'rephrase' | 'simplify' | 'shorten' | 'expand' | 'continue' | 'improve' | 'custom',
    prompt?: string
  ) => {
    if (!profileName.trim()) {
      setError('Укажите название профиля')
      setTimeout(() => setError(null), 3000)
      return
    }

    // Для некоторых режимов требуется текст
    const requiresText = ['rephrase', 'simplify', 'shorten', 'expand', 'continue', 'improve']
    if (requiresText.includes(mode) && !currentText.trim()) {
      setError('Нет текста для редактирования')
      setTimeout(() => setError(null), 3000)
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
          profileName,
          category,
          subtype,
          existingData,
          currentText,
          mode,
          customPrompt: prompt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          const retryAfter = Number((errorData as any)?.retryAfterSeconds || 0)
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            throw new Error(`Лимит запросов. Повторите через ${retryAfter} сек.`)
          }
          throw new Error((errorData as any)?.error || 'Лимит запросов. Попробуйте позже.')
        } else if (response.status === 503) {
          const retryAfter = Number((errorData as any)?.retryAfterSeconds || 0)
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            throw new Error(`AI перегружен. Повторите через ${retryAfter} сек.`)
          }
          throw new Error((errorData as any)?.error || 'AI перегружен. Подождите 10-30 сек.')
        } else if (errorData.error) {
          throw new Error(errorData.error)
        } else {
          throw new Error('Не удалось сгенерировать')
        }
      }

      const data = await response.json()

      if (data.description) {
        // Показываем превью вместо прямого применения
        setGeneratedPreview(data.description)
        setLastMode(mode)
        
        // Добавляем в историю
        setHistory(prev => [data.description, ...prev].slice(0, 10)) // Храним последние 10 вариантов
        
        setError(null)
        setShowCustomPrompt(false)
        setCustomPrompt('')
      } else {
        throw new Error('Пустой ответ от AI')
      }
    } catch (err) {
      // В dev-режиме Next показывает красный overlay на console.error — для AI это ожидаемо (лимиты/квоты).
      console.warn('[AIFieldAssistant] Generate error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Ошибка генерации'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) {
      setError('Введите инструкцию')
      setTimeout(() => setError(null), 3000)
      return
    }
    generateDescription('custom', customPrompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGenerating && customPrompt.trim()) {
      handleCustomPromptSubmit()
    }
    if (e.key === 'Escape') {
      setShowCustomPrompt(false)
      setCustomPrompt('')
      setError(null)
    }
  }

  // Применить сгенерированный текст
  const handleApply = () => {
    if (generatedPreview) {
      onGenerated(generatedPreview)
      setGeneratedPreview(null)
      setShowHistory(false)
    }
  }

  // Отменить сгенерированный текст
  const handleCancel = () => {
    setGeneratedPreview(null)
    setShowHistory(false)
    setError(null)
  }

  // Перегенерировать с тем же режимом
  const handleRegenerate = () => {
    if (lastMode) {
      generateDescription(lastMode as any)
    }
  }

  // Выбрать вариант из истории
  const handleSelectFromHistory = (text: string) => {
    setGeneratedPreview(text)
    setShowHistory(false)
  }

  const buttons = (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-2 px-2 sm:px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-[12px] border border-purple-100/50">
        {/* Иконка AI */}
        <div className="flex items-center gap-1 sm:gap-1.5 pr-1.5 sm:pr-2 border-r border-purple-200 shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          <span className="text-[9px] sm:text-[10px] font-semibold text-purple-600 uppercase tracking-wider">AI</span>
        </div>
        
        {/* Кнопка "Сгенерировать текст" */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => generateDescription('generate')}
              disabled={isGenerating}
              className="text-[10px] sm:text-[11px] font-medium text-gray-700 hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-0.5 sm:px-1 whitespace-nowrap"
            >
              {isGenerating ? 'Генерация...' : 'Сгенерировать текст'}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Создать новый текст с нуля</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Разделитель */}
        <div className="w-px h-3 bg-purple-200" />
        
        {/* Выпадающее меню с дополнительными функциями */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isGenerating}
              className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-medium text-gray-700 hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-0.5 sm:px-1 whitespace-nowrap"
            >
              Ещё
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-[16px] border-gray-200 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] p-1">
            <DropdownMenuItem
              onClick={() => generateDescription('rephrase')}
              disabled={!currentText.trim()}
              className="rounded-[12px] text-[13px] text-gray-700 cursor-pointer focus:bg-purple-50 focus:text-purple-700 py-2.5"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Перефразировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => generateDescription('simplify')}
              disabled={!currentText.trim()}
              className="rounded-[12px] text-[13px] text-gray-700 cursor-pointer focus:bg-purple-50 focus:text-purple-700 py-2.5"
            >
              <Type className="h-4 w-4 mr-2" />
              Упростить
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => generateDescription('shorten')}
              disabled={!currentText.trim()}
              className="rounded-[12px] text-[13px] text-gray-700 cursor-pointer focus:bg-purple-50 focus:text-purple-700 py-2.5"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Сократить
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => generateDescription('expand')}
              disabled={!currentText.trim()}
              className="rounded-[12px] text-[13px] text-gray-700 cursor-pointer focus:bg-purple-50 focus:text-purple-700 py-2.5"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Расширить
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => generateDescription('continue')}
              disabled={!currentText.trim()}
              className="rounded-[12px] text-[13px] text-gray-700 cursor-pointer focus:bg-purple-50 focus:text-purple-700 py-2.5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Продолжить
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => generateDescription('improve')}
              disabled={!currentText.trim()}
              className="rounded-[12px] text-[13px] text-gray-700 cursor-pointer focus:bg-purple-50 focus:text-purple-700 py-2.5"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Улучшить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Разделитель */}
        <div className="w-px h-3 bg-purple-200" />
        
        {/* Кнопка "С инструкцией" */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                setShowCustomPrompt(!showCustomPrompt)
                setError(null)
              }}
              disabled={isGenerating}
              className="text-[11px] font-medium text-gray-700 hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-1"
            >
              {showCustomPrompt ? 'Свернуть' : 'С инструкцией'}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Указать свою инструкцию для AI</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )

  const customPromptField = showCustomPrompt ? (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 animate-in slide-in-from-top-2 duration-200">
      <Input
        placeholder="Например: добавь больше эмоций, убери упоминание цен..."
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isGenerating}
        className="h-11 rounded-[12px] text-[13px] flex-1 border-purple-200 focus:border-purple-400"
        autoFocus
      />
      <Button
        type="button"
        onClick={handleCustomPromptSubmit}
        disabled={isGenerating || !customPrompt.trim()}
        size="sm"
        className="h-11 px-4 rounded-[12px] bg-purple-600 hover:bg-purple-700 text-white gap-2 shrink-0"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">Генерация...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span className="text-[13px]">Отправить</span>
          </>
        )}
      </Button>
    </div>
  ) : null

  const errorField = error ? (
    <div className="text-[11px] text-red-600 px-3 py-2 mt-2 bg-red-50 rounded-[12px] border border-red-200 animate-in slide-in-from-top-2 duration-200">
      {error}
    </div>
  ) : null

  // Превью сгенерированного текста с кнопками управления
  const previewBlock = generatedPreview ? (
    <TooltipProvider delayDuration={300}>
      <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
        {/* Превью текста */}
        <div className="relative">
          <Textarea
            value={generatedPreview}
            onChange={(e) => setGeneratedPreview(e.target.value)}
            className="min-h-[120px] rounded-[16px] text-[13px] border-2 border-purple-300 focus:border-purple-400 bg-purple-50/50 pr-12 resize-none"
            placeholder="Сгенерированный текст..."
          />
          {/* Счётчик символов в углу */}
          <div className="absolute bottom-3 right-3 text-[11px] text-gray-500">
            {generatedPreview.length} симв.
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center gap-2">
          {/* Regenerate */}
          <Tooltip>
            <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={handleRegenerate}
              disabled={isGenerating}
              size="sm"
              variant="outline"
              className="h-9 px-3 rounded-[12px] border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-[12px]">Regenerate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Перегенерировать текст</p>
          </TooltipContent>
        </Tooltip>

        {/* History */}
        {history.length > 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                size="sm"
                variant="outline"
                className="h-9 px-3 rounded-[12px] border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 gap-2"
              >
                <History className="h-3.5 w-3.5" />
                <span className="text-[12px]">History ({history.length})</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Показать историю вариантов</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Разделитель */}
        <div className="flex-1" />

        {/* Cancel */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={handleCancel}
              size="sm"
              variant="outline"
              className="h-9 px-3 rounded-[12px] border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 gap-2"
            >
              <X className="h-3.5 w-3.5" />
              <span className="text-[12px]">Cancel</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Отменить и вернуться</p>
          </TooltipContent>
        </Tooltip>

        {/* Apply */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={handleApply}
              size="sm"
              className="h-9 px-4 rounded-[12px] bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              <Check className="h-3.5 w-3.5" />
              <span className="text-[12px] font-medium">Apply</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Применить этот текст</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* История вариантов */}
      {showHistory && history.length > 1 && (
        <div className="p-3 bg-gray-50 rounded-[12px] border border-gray-200 space-y-2 max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-medium text-gray-700 mb-2">История вариантов:</div>
          {history.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectFromHistory(item)}
              className={`w-full text-left p-2.5 rounded-[8px] text-[12px] transition-colors ${
                item === generatedPreview
                  ? 'bg-purple-100 border-2 border-purple-300 text-purple-900'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="line-clamp-2">{item}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {item.length} симв. • Вариант {history.length - index}
              </div>
            </button>
          ))}
        </div>
      )}
      </div>
    </TooltipProvider>
  ) : null

  // Объединяем все элементы в один блок
  const buttonsBlock = (
    <div className="mt-2 space-y-2">
      {!generatedPreview && buttons}
      {!generatedPreview && customPromptField}
      {!generatedPreview && errorField}
      {previewBlock}
    </div>
  )

  return {
    buttonsBlock,
  }
}

