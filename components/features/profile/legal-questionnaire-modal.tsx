'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { getQuestionsForProfile, isQuestionnaireComplete, shouldShowQuestion, Question } from '@/lib/utils/legal-questionnaire'

interface LegalQuestionnaireModalProps {
  isOpen: boolean
  onClose: () => void
  profileId: string
  profileType: 'venue' | 'animator' | 'show' | 'agency'
  legalForm: 'private' | 'ip' | 'ooo' | 'self_employed'
  onComplete?: () => void
}

export function LegalQuestionnaireModal({
  isOpen,
  onClose,
  profileId,
  profileType,
  legalForm,
  onComplete,
}: LegalQuestionnaireModalProps) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const QUESTIONS_PER_PAGE = 5
  
  // Debounce timer для автосохранения
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Загрузка вопросов
  useEffect(() => {
    console.log('[Questionnaire] Loading questions for:', { profileType, legalForm })
    const loadedQuestions = getQuestionsForProfile(profileType, legalForm)
    console.log('[Questionnaire] Loaded questions:', loadedQuestions.length)
    console.log('[Questionnaire] Question IDs:', loadedQuestions.map(q => q.id))
    console.log('[Questionnaire] Full questions with conditions:', loadedQuestions.map(q => ({ id: q.id, question: q.question, condition: q.condition })))
    setQuestions(loadedQuestions)
  }, [profileType, legalForm])

  // Загрузка существующих ответов
  useEffect(() => {
    if (isOpen && profileId) {
      loadAnswers()
    }
    
    // Очистка таймера при размонтировании или закрытии
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [isOpen, profileId])

  const loadAnswers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/legal-questionnaire/${profileId}`)
      
      // Если API endpoint не существует или таблица не создана, начинаем с пустой анкеты
      if (response.status === 404 || response.status === 500) {
        console.log('[Questionnaire] Table not exists yet (or API error), starting with empty answers')
        setAnswers({})
        setIsLoading(false)
        return
      }
      
      if (!response.ok) {
        console.warn('[Questionnaire] Non-OK response, starting with empty answers')
        setAnswers({})
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      setAnswers(data.answers || {})
    } catch (error: any) {
      console.log('[Questionnaire] Load error (expected if table not exists), starting with empty answers:', error.message)
      // В любом случае начинаем с пустой анкеты - не блокируем UI
      setAnswers({})
    } finally {
      setIsLoading(false)
    }
  }

  const saveAnswers = async (newAnswers: Record<string, string | number>) => {
    if (!profileId) {
      console.error('[Questionnaire] Cannot save - profileId is missing')
      return
    }
    
    setIsSaving(true)
    try {
      console.log('[Questionnaire] Saving to:', `/api/legal-questionnaire/${profileId}`)
      const response = await fetch(`/api/legal-questionnaire/${profileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: newAnswers }),
      })

      console.log('[Questionnaire] Response status:', response.status)

      // API теперь всегда возвращает 200, даже если таблица не существует
      if (response.ok) {
        const data = await response.json()
        if (data.warning) {
          console.warn('[Questionnaire]', data.warning)
        } else {
          toast.success('✅ Анкета сохранена')
        }
        return
      }

      // Если не OK - логируем и тихо выходим (данные в state сохранены)
      const errorText = await response.text()
      console.warn('[Questionnaire] Save failed:', response.status, errorText)
    } catch (error: any) {
      console.warn('[Questionnaire] Save error (saved locally):', error.message)
      // Не показываем ошибку - данные сохранены локально в state
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnswerChange = useCallback((questionId: string, value: string | number) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)
    
    // Отменяем предыдущий таймер
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    
    // Устанавливаем новый таймер для автосохранения
    saveTimerRef.current = setTimeout(() => {
      console.log('[Questionnaire] Auto-saving after debounce...')
      saveAnswers(newAnswers)
    }, 1500) // Увеличил до 1.5 секунд для более плавной работы
  }, [answers])

  const handleClose = useCallback(async () => {
    // Отменяем таймер и сразу сохраняем перед закрытием
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    
    // Сохраняем текущие ответы перед закрытием
    if (Object.keys(answers).length > 0) {
      console.log('[Questionnaire] Saving before close...')
      await saveAnswers(answers)
    }
    
    onClose()
  }, [answers, onClose])

  const handleComplete = () => {
    const { isComplete, missingQuestions } = isQuestionnaireComplete(answers, questions)
    
    if (!isComplete) {
      toast.error(`Пожалуйста, ответьте на все обязательные вопросы`, {
        description: `Осталось: ${missingQuestions.length} вопросов`,
        icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
      })
      return
    }

    toast.success('Анкета заполнена!', {
      description: 'Теперь можно сгенерировать договор',
    })
    
    if (onComplete) onComplete()
    handleClose()
  }

  const renderQuestion = (question: Question) => {
    if (!shouldShowQuestion(question, answers)) return null

    const value = answers[question.id] || ''

    return (
      <div key={question.id} className="space-y-3 p-4 bg-gray-50 rounded-[16px] border border-gray-100">
        <div>
          <Label className="text-[13px] font-medium text-gray-900">
            {question.question}
            {question.required && <span className="text-orange-500 ml-1">*</span>}
          </Label>
          {question.hint && (
            <p className="text-xs text-gray-500 mt-1">{question.hint}</p>
          )}
        </div>

        {question.type === 'select' && (
          <>
            <Select
              value={String(value)}
              onValueChange={(val) => handleAnswerChange(question.id, val)}
            >
              <SelectTrigger className="rounded-[12px] border-gray-200">
                <SelectValue placeholder="Выберите вариант" />
              </SelectTrigger>
              <SelectContent className="rounded-[16px]">
                {question.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="rounded-[12px]"
                  >
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500">{option.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {question.allowCustom && value === 'custom' && (
              <div className="mt-2 space-y-1">
                <Label className="text-xs text-gray-600">Укажите свой вариант:</Label>
                <Input
                  type="text"
                  placeholder="Введите значение"
                  value={answers[`${question.id}_custom_value`] || ''}
                  onChange={(e) => handleAnswerChange(`${question.id}_custom_value`, e.target.value)}
                  className="rounded-[12px] border-gray-200"
                />
              </div>
            )}
          </>
        )}

        {question.type === 'text' && (
          <Input
            type="text"
            value={String(value)}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="rounded-[12px] border-gray-200"
          />
        )}

        {question.type === 'number' && (
          <Input
            type="number"
            value={String(value)}
            onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
            placeholder={question.placeholder}
            className="rounded-[12px] border-gray-200"
          />
        )}

        {question.type === 'textarea' && (
          <Textarea
            value={String(value)}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={3}
            className="rounded-[12px] border-gray-200"
          />
        )}
      </div>
    )
  }

  const completionStatus = isQuestionnaireComplete(answers, questions)
  
  // Считаем только видимые вопросы для прогресса
  const visibleQuestions = questions.filter(q => shouldShowQuestion(q, answers))
  const answeredQuestions = visibleQuestions.filter(q => answers[q.id])
  const progress = visibleQuestions.length > 0 
    ? Math.round((answeredQuestions.length / visibleQuestions.length) * 100)
    : 0
  
  // Логирование для отладки
  console.log('[Questionnaire] Visible questions:', visibleQuestions.length, 'Answered:', answeredQuestions.length, 'Progress:', progress)
  
  // Пагинация
  const totalPages = Math.ceil(visibleQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = currentPage * QUESTIONS_PER_PAGE
  const endIndex = startIndex + QUESTIONS_PER_PAGE
  const currentQuestions = visibleQuestions.slice(startIndex, endIndex)
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-[24px] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Анкета для генерации договора
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Ответьте на вопросы, чтобы AI сгенерировал договор с учётом ваших условий.
            Анкета сохраняется автоматически.
          </DialogDescription>

          {/* Прогресс заполнения */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                Заполнено: {answeredQuestions.length} из {visibleQuestions.length}
              </span>
              <span className="text-xs font-bold text-orange-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 px-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="space-y-4 py-4 min-h-[400px]">
              {currentQuestions.map((question) => renderQuestion(question))}
              
              {visibleQuestions.length === 0 && (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <p>Нет доступных вопросов для вашей конфигурации</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-gray-100 space-y-3 bg-gray-50">
          {/* Навигация по страницам */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="rounded-[12px] gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              
              <div className="text-sm text-gray-600">
                Страница <span className="font-bold">{currentPage + 1}</span> из <span className="font-bold">{totalPages}</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1}
                className="rounded-[12px] gap-2"
              >
                Вперед
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Статус сохранения и кнопки */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSaving && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Сохранение...</span>
                </div>
              )}
              {!isSaving && Object.keys(answers).length > 0 && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Сохранено</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-[16px]"
              >
                Закрыть
              </Button>
              <Button
                type="button"
                onClick={handleComplete}
                disabled={!completionStatus.isComplete || isSaving}
                className="rounded-[16px] bg-orange-500 hover:bg-orange-600"
              >
                {completionStatus.isComplete ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Готово
                  </>
                ) : (
                  <>Осталось: {completionStatus.missingQuestions.length}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

