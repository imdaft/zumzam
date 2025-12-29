'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, FileText, CheckCircle, AlertCircle, Eye, Edit, FileCheck, ClipboardList } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { toast } from 'sonner'
import { LegalQuestionnaireModal } from './legal-questionnaire-modal'
import { isQuestionnaireComplete, getQuestionsForProfile } from '@/lib/utils/legal-questionnaire'

interface LegalDocumentsManagerProps {
  profileId: string
  profileSlug: string
  profileType: 'venue' | 'animator' | 'show' | 'agency'
  legalForm: 'private' | 'ip' | 'ooo' | 'self_employed'
  initialData?: any
}

export function LegalDocumentsManager({ profileId, profileSlug, profileType, legalForm, initialData }: LegalDocumentsManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Модальное окно анкеты
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false)
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string | number>>({})
  const [isQuestionnaireFilled, setIsQuestionnaireFilled] = useState(false)

  // Договор оферты
  const [agreementType, setAgreementType] = useState<'custom_link' | 'custom_text' | 'generated'>(
    initialData?.legal_agreement_type || 'generated'
  )
  const [agreementUrl, setAgreementUrl] = useState(initialData?.legal_agreement_url || '')
  const [agreementText, setAgreementText] = useState(initialData?.legal_agreement_text || '')
  const [agreementGenData, setAgreementGenData] = useState({
    companyName: initialData?.legal_agreement_generated_data?.companyName || initialData?.display_name || '',
    legalForm: initialData?.legal_agreement_generated_data?.legalForm || 'private',
    inn: initialData?.legal_agreement_generated_data?.inn || '',
    ogrn: initialData?.legal_agreement_generated_data?.ogrn || '',
    address: initialData?.legal_agreement_generated_data?.address || '',
    directorName: initialData?.legal_agreement_generated_data?.directorName || '',
    phone: initialData?.legal_agreement_generated_data?.phone || initialData?.phone || '',
    email: initialData?.legal_agreement_generated_data?.email || initialData?.email || '',
    website: initialData?.legal_agreement_generated_data?.website || initialData?.website || '',
    cancellationPolicy: initialData?.legal_agreement_generated_data?.cancellationPolicy || '',
    prepaymentAmount: initialData?.legal_agreement_generated_data?.prepaymentAmount || '',
    additionalTerms: initialData?.legal_agreement_generated_data?.additionalTerms || '',
  })
  const [generatedAgreement, setGeneratedAgreement] = useState(
    initialData?.legal_agreement_generated_text || ''
  )

  // Правила бронирования
  const [rulesType, setRulesType] = useState<'custom' | 'generated'>(
    initialData?.booking_rules_type || 'generated'
  )
  const [rulesText, setRulesText] = useState(initialData?.booking_rules_text || '')
  const [rulesGenData, setRulesGenData] = useState({
    minBookingTime: initialData?.booking_rules_generated_data?.minBookingTime || 'за 3 дня',
    cancellationDeadline: initialData?.booking_rules_generated_data?.cancellationDeadline || 'за 24 часа',
    prepaymentRequired: initialData?.booking_rules_generated_data?.prepaymentRequired || false,
    prepaymentAmount: initialData?.booking_rules_generated_data?.prepaymentAmount || '',
    refundPolicy: initialData?.booking_rules_generated_data?.refundPolicy || '',
    additionalRules: initialData?.booking_rules_generated_data?.additionalRules || '',
  })
  const [generatedRules, setGeneratedRules] = useState(
    initialData?.booking_rules_generated_text || ''
  )

  // Результаты проверки AI
  const [lastCheckResults, setLastCheckResults] = useState<string | null>(null)
  const [isCheckResultsModalOpen, setIsCheckResultsModalOpen] = useState(false)
  
  // Состояния для AI редактора
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  
  // Состояния для результатов проверки
  const [checkResultModal, setCheckResultModal] = useState<{
    isOpen: boolean
    result: string
    hasErrors: boolean
  }>({
    isOpen: false,
    result: '',
    hasErrors: false
  })
  
  // Контекстное меню для выделенного текста
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    selectedText: string
  } | null>(null)
  const [selectedRange, setSelectedRange] = useState<Range | null>(null)
  
  // История изменений для Undo/Redo
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Сохранение в историю
  const saveToHistory = useCallback((text: string) => {
    setHistory(prev => {
      // Удаляем все элементы после текущей позиции
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(text)
      
      // Ограничиваем историю 50 элементами
      if (newHistory.length > 50) {
        newHistory.shift()
        return newHistory
      }
      
      setHistoryIndex(historyIndex + 1)
      return newHistory
    })
  }, [historyIndex])

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevText = history[historyIndex - 1]
      setGeneratedAgreement(prevText)
      setHistoryIndex(historyIndex - 1)
      toast.success('↩️ Отменено')
    }
  }, [historyIndex, history])

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextText = history[historyIndex + 1]
      setGeneratedAgreement(nextText)
      setHistoryIndex(historyIndex + 1)
      toast.success('↪️ Повторено')
    }
  }, [historyIndex, history])

  // Загрузка состояния анкеты
  useEffect(() => {
    const loadQuestionnaireStatus = async () => {
      try {
        const response = await fetch(`/api/legal-questionnaire/${profileId}`)
        if (!response.ok) return
        
        const data = await response.json()
        setQuestionnaireAnswers(data.answers || {})
        
        // Проверяем заполненность
        const questions = getQuestionsForProfile(profileType, legalForm)
        const { isComplete } = isQuestionnaireComplete(data.answers || {}, questions)
        setIsQuestionnaireFilled(isComplete)
      } catch (error) {
        console.error('[Questionnaire] Load status error:', error)
      }
    }
    
    if (profileId) {
      loadQuestionnaireStatus()
    }
  }, [profileId, profileType, legalForm])

  // Обработка клавиатурных команд
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Функция для проверки незаполненных полей в договоре
  const checkMissingFields = (text: string): string[] => {
    const missingFields: string[] = []
    const patterns = [
      { pattern: /\[НАЗВАНИЕ КОМПАНИИ\]/gi, field: 'Название компании' },
      { pattern: /\[ИНН\]/gi, field: 'ИНН' },
      { pattern: /\[ОГРН(ИП)?\]/gi, field: 'ОГРН/ОГРНИП' },
      { pattern: /\[АДРЕС\]/gi, field: 'Юридический адрес' },
      { pattern: /\[ФИО ДИРЕКТОРА\]/gi, field: 'ФИО директора/ИП' },
      { pattern: /\[ПОЛИТИКА ОТМЕНЫ\]/gi, field: 'Политика отмены' },
      { pattern: /\[ПРЕДОПЛАТА\]/gi, field: 'Размер предоплаты' },
      { pattern: /\[ТЕЛЕФОН\]/gi, field: 'Телефон' },
      { pattern: /\[EMAIL\]/gi, field: 'Email' },
      { pattern: /\[САЙТ\]/gi, field: 'Сайт' },
    ]

    patterns.forEach(({ pattern, field }) => {
      if (pattern.test(text)) {
        missingFields.push(field)
      }
    })

    return missingFields
  }

  // Функция для подсветки незаполненных полей
  const highlightMissingFields = (text: string): string => {
    let highlighted = text
    const replacements = [
      { pattern: /\[НАЗВАНИЕ КОМПАНИИ\]/gi, replacement: '⚠️ [НАЗВАНИЕ КОМПАНИИ] ⚠️' },
      { pattern: /\[ИНН\]/gi, replacement: '⚠️ [ИНН] ⚠️' },
      { pattern: /\[ОГРН(ИП)?\]/gi, replacement: '⚠️ [ОГРН/ОГРНИП] ⚠️' },
      { pattern: /\[АДРЕС\]/gi, replacement: '⚠️ [АДРЕС] ⚠️' },
      { pattern: /\[ФИО ДИРЕКТОРА\]/gi, replacement: '⚠️ [ФИО ДИРЕКТОРА] ⚠️' },
      { pattern: /\[ПОЛИТИКА ОТМЕНЫ\]/gi, replacement: '⚠️ [ПОЛИТИКА ОТМЕНЫ] ⚠️' },
      { pattern: /\[ПРЕДОПЛАТА\]/gi, replacement: '⚠️ [ПРЕДОПЛАТА] ⚠️' },
      { pattern: /\[ТЕЛЕФОН\]/gi, replacement: '⚠️ [ТЕЛЕФОН] ⚠️' },
      { pattern: /\[EMAIL\]/gi, replacement: '⚠️ [EMAIL] ⚠️' },
      { pattern: /\[САЙТ\]/gi, replacement: '⚠️ [САЙТ] ⚠️' },
    ]

    replacements.forEach(({ pattern, replacement }) => {
      highlighted = highlighted.replace(pattern, replacement)
    })

    return highlighted
  }

  // Функция для рендеринга текста с подсветкой HTML (для contentEditable)
  const renderHighlightedText = (text: string) => {
    if (!text) return ''

    // Разбиваем текст на части и подсвечиваем плейсхолдеры
    const parts = text.split(/(\[[^\]]+\])/)
    
    return parts.map((part) => {
      // Проверяем, является ли часть плейсхолдером
      if (part.match(/^\[[^\]]+\]$/)) {
        return `<span class="bg-yellow-100 text-orange-800 px-1 rounded font-semibold hover:bg-orange-200 transition-colors cursor-text border-b-2 border-orange-300" contenteditable="true">${part}</span>`
      }
      // Обычный текст с экранированием HTML
      return part.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }).join('')
  }

  // Обработчик изменения contentEditable
  const handleContentEditableChange = (e: React.FormEvent<HTMLDivElement>, setter: (value: string) => void) => {
    const target = e.currentTarget
    const text = target.innerText || ''
    setter(text)
    
    // Сохраняем в историю с задержкой (debounce)
    if (text !== generatedAgreement) {
      setTimeout(() => saveToHistory(text), 500)
    }
  }

  // Обработчик контекстного меню (правый клик)
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim() || ''
    
    if (selectedText) {
      // Сохраняем Range для последующей замены
      const range = selection?.getRangeAt(0)
      setSelectedRange(range || null)
      
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        selectedText
      })
    } else {
      // Если текст не выделен - просто открываем меню для вставки
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        selectedText: ''
      })
    }
  }

  // Закрытие контекстного меню
  const closeContextMenu = () => {
    setContextMenu(null)
    setSelectedRange(null)
  }

  // AI операции с текстом
  const handleAiTextOperation = async (operation: 'rewrite' | 'simplify' | 'expand' | 'check' | 'custom', customInstruction?: string) => {
    if (!contextMenu) return
    
    const textToProcess = contextMenu.selectedText || generatedAgreement
    
    setIsAiProcessing(true)
    closeContextMenu()

    try {
      // Вызываем реальный AI API
      const response = await fetch('/api/ai/edit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          text: textToProcess,
          customInstruction
        }),
      })

      const data = await response.json()

      if (!data.success || !data.result) {
        throw new Error(data.error || 'AI не вернул результат')
      }

      const aiResult = data.result
      
      if (operation === 'check') {
        // Для проверки открываем модальное окно
        const hasErrors = !aiResult.includes('✅') || aiResult.toLowerCase().includes('ошибк') || aiResult.toLowerCase().includes('замечан')
        
        setCheckResultModal({
          isOpen: true,
          result: aiResult,
          hasErrors
        })
        
        toast.success('🔍 Проверка завершена', {
          description: hasErrors ? 'Найдены замечания. Смотрите подробности в окне.' : 'Проверка пройдена успешно!'
        })
      } else {
        // Для остальных операций - заменяем текст
        if (selectedRange && contextMenu.selectedText) {
          // Заменяем выделенный фрагмент
          selectedRange.deleteContents()
          selectedRange.insertNode(document.createTextNode(aiResult))
          
          // Обновляем состояние из contentEditable
          const editorElement = document.querySelector('[contenteditable="true"]') as HTMLElement
          if (editorElement) {
            setGeneratedAgreement(editorElement.innerText)
          }
          
          toast.success('✨ Текст обработан AI', {
            description: `Операция "${operation === 'rewrite' ? 'Перефразирование' : operation === 'simplify' ? 'Упрощение' : operation === 'expand' ? 'Дополнение' : 'Редактирование'}" выполнена успешно`,
          })
        } else {
          // Если текст не был выделен - заменяем весь договор (для вставки)
          setGeneratedAgreement(aiResult)
          
          toast.success('✨ Текст добавлен', {
            description: 'AI создал текст и добавил в договор',
          })
        }
      }
    } catch (error: any) {
      console.error('[AI Text Operation] Error:', error)
      toast.error('❌ Ошибка AI обработки', {
        description: error.message || 'Не удалось обработать текст. Попробуйте снова.',
      })
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleGenerate = async (type: 'agreement' | 'rules' | 'both') => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/generate-legal-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          type,
          // Данные больше не передаем - API берет их из анкеты
        }),
      })

      const data = await response.json()

      if (!data.success) {
        // Обрабатываем ошибку о незаполненной анкете
        if (data.missingCount) {
          const missingList = data.missingQuestions?.slice(0, 3).join(', ') || 'неизвестные вопросы'
          const moreCount = data.missingCount > 3 ? ` и еще ${data.missingCount - 3}` : ''
          
          toast.error('❌ Анкета заполнена не полностью', {
            description: `Не заполнены: ${missingList}${moreCount}`,
            duration: 8000,
            action: {
              label: 'Открыть анкету',
              onClick: () => setIsQuestionnaireOpen(true),
            },
          })
          
          console.warn('[Generate] Missing questions:', data.missingQuestions)
          return
        }
        throw new Error(data.error || 'Не удалось сгенерировать документы')
      }

      if (type === 'agreement' || type === 'both') {
        setGeneratedAgreement(data.results.agreement)
        
        // Автоматическая проверка после генерации
        setTimeout(async () => {
          try {
            const checkResponse = await fetch('/api/ai/edit-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                operation: 'check',
                text: data.results.agreement
              }),
            })
            
            const checkData = await checkResponse.json()
            
            if (checkData.success && checkData.result) {
              const hasErrors = !checkData.result.includes('✅') || 
                              checkData.result.toLowerCase().includes('ошибк') || 
                              checkData.result.toLowerCase().includes('замечан')
              
              // Сохраняем результаты проверки
              setLastCheckResults(checkData.result)
              
              if (hasErrors) {
                // Показываем тост с предложением посмотреть результаты
                toast.warning('⚠️ Автопроверка: найдены замечания', {
                  description: 'Нажмите для просмотра деталей',
                  duration: 8000,
                  action: {
                    label: 'Посмотреть',
                    onClick: () => {
                      setCheckResultModal({
                        isOpen: true,
                        result: checkData.result,
                        hasErrors: true
                      })
                    }
                  }
                })
              } else {
                toast.success('✅ Автопроверка: договор корректен')
              }
            }
          } catch (error) {
            console.error('[Auto Check] Error:', error)
          }
        }, 1000)
      }
      if (type === 'rules' || type === 'both') {
        setGeneratedRules(data.results.rules)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Проверка незаполненных полей в сгенерированном договоре
      if (agreementType === 'generated' && generatedAgreement) {
        const missingFields = checkMissingFields(generatedAgreement)
        if (missingFields.length > 0) {
          setError(
            `❌ Договор содержит незаполненные поля:\n\n${missingFields.map(f => `• ${f}`).join('\n')}\n\nЗаполните все поля, отмеченные ⚠️ в тексте договора, прежде чем сохранять.`
          )
          setIsLoading(false)
          return
        }
      }

      // Проверка незаполненных полей в правилах бронирования
      if (rulesType === 'generated' && generatedRules) {
        const missingFields = checkMissingFields(generatedRules)
        if (missingFields.length > 0) {
          setError(
            `❌ Правила бронирования содержат незаполненные поля:\n\n${missingFields.map(f => `• ${f}`).join('\n')}\n\nЗаполните все поля, отмеченные ⚠️ в тексте, прежде чем сохранять.`
          )
          setIsLoading(false)
          return
        }
      }

      const updateData: any = {
        legal_agreement_type: agreementType,
        legal_agreement_url: agreementType === 'custom_link' ? agreementUrl : null,
        legal_agreement_text: agreementType === 'custom_text' ? agreementText : null,
        legal_agreement_generated_data: agreementType === 'generated' ? agreementGenData : null,
        legal_agreement_generated_text: agreementType === 'generated' ? generatedAgreement : null,
        booking_rules_type: rulesType,
        booking_rules_text: rulesType === 'custom' ? rulesText : null,
        booking_rules_generated_data: rulesType === 'generated' ? rulesGenData : null,
        booking_rules_generated_text: rulesType === 'generated' ? generatedRules : null,
        legal_docs_generated_at: new Date().toISOString(),
      }

      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Не удалось сохранить документы')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Юридические документы</h1>
          <p className="text-[13px] text-gray-500 mt-1">Настройте договор оферты и правила бронирования для вашего профиля</p>
        </div>
      </div>

      {/* Дисклеймер - показываем только для AI генерации */}
      {agreementType === 'generated' && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-[16px]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-yellow-900 mb-1">⚠️ Важное юридическое уведомление</h4>
              <p className="text-xs text-yellow-800 leading-relaxed">
                Сгенерированный AI договор является <strong>ознакомительным материалом</strong> и <strong>не является юридическим документом</strong>. 
                Это рекомендации общего характера, созданные на основе типовых договоров.
              </p>
              <p className="text-xs text-yellow-800 leading-relaxed mt-2">
                ❗ <strong>Обязательно проконсультируйтесь с квалифицированным юристом</strong> перед использованием договора в коммерческой деятельности. 
                Мы не несем ответственности за юридические последствия использования сгенерированных документов.
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                💡 Рекомендуем: адаптировать договор под вашу специфику и проверить соответствие актуальному законодательству РФ.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Документы успешно сохранены!</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] rounded-[24px]">
        <CardContent className="space-y-6 p-5 md:p-6">
          {/* Договор оферты */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Договор оферты</h3>
            
            <div className="space-y-2">
              <Label className="text-[15px] font-bold text-gray-900">Тип договора</Label>
              <Select value={agreementType} onValueChange={(v: any) => setAgreementType(v)}>
                <SelectTrigger className="rounded-[12px] border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[16px]">
                  <SelectItem value="generated" className="rounded-[12px]">Сгенерировать с помощью AI (рекомендуется)</SelectItem>
                  <SelectItem value="custom_text" className="rounded-[12px]">Свой текст</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                AI создаст полноценный договор с учётом ваших ответов в анкете
              </p>
            </div>

            {agreementType === 'custom_text' && (
              <div className="space-y-2">
                <Label>Текст договора</Label>
                <Textarea
                  value={agreementText}
                  onChange={(e) => setAgreementText(e.target.value)}
                  rows={15}
                  placeholder="Введите текст договора оферты..."
                />
              </div>
            )}

            {agreementType === 'generated' && (
              <div className="space-y-4">
                {/* Блок анкеты */}
                {/* Блок анкеты */}
                <div className="space-y-3 p-5 bg-blue-50 border-2 border-blue-200 rounded-[16px]">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-[15px] font-bold text-blue-900 mb-2">Подробная анкета для генерации договора</h4>
                        
                        <p className="text-sm text-blue-800 leading-relaxed mb-3">
                          Заполните подробную анкету перед генерацией.<br/>
                          Чем больше ответов, тем точнее и детальнее будет договор.
                        </p>
                        
                        {!isQuestionnaireFilled ? (
                          <Button
                            type="button"
                            onClick={() => setIsQuestionnaireOpen(true)}
                            size="lg"
                            className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-[12px] w-full"
                          >
                            <ClipboardList className="h-5 w-5" />
                            Заполнить подробную анкету
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-[12px] border border-green-200">
                              <CheckCircle className="h-5 w-5 shrink-0" />
                              <span><strong>✅ Анкета заполнена!</strong></span>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setIsQuestionnaireOpen(true)}
                              variant="outline"
                              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-[12px] w-full"
                            >
                              <Edit className="h-4 w-4" />
                              Изменить анкету
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                  onClick={() => {
                    if (!isQuestionnaireFilled) {
                      toast.error('Сначала заполните анкету', {
                        description: 'Анкета необходима для корректной генерации договора с учётом всех ваших условий',
                        action: {
                          label: 'Открыть анкету',
                          onClick: () => setIsQuestionnaireOpen(true),
                        },
                      })
                      return
                    }
                    handleGenerate('agreement')
                  }}
                  disabled={isGenerating || !isQuestionnaireFilled}
                  size="lg"
                  className={`gap-2 w-full rounded-[12px] ${
                    !isQuestionnaireFilled 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' 
                      : ''
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Генерирую договор...
                    </>
                  ) : !isQuestionnaireFilled ? (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      Заполните анкету для генерации
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Сгенерировать договор с учетом всех условий
                    </>
                  )}
                </Button>

                  {generatedAgreement && (
                  <div className="space-y-3 pt-4">
                    {(() => {
                      const missingFields = checkMissingFields(generatedAgreement)
                      const hasWarnings = missingFields.length > 0
                      
                      return (
                        <>
                          {hasWarnings && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-[16px] p-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-bold text-orange-900 mb-2">⚠️ Требуется заполнить вручную</h4>
                                  <p className="text-sm text-orange-700 mb-2">
                                    В договоре есть поля <span className="bg-yellow-100 text-orange-800 px-1 rounded font-semibold">[выделенные желтым]</span>. Кликните на них и заполните перед сохранением:
                                  </p>
                                  <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                                    {missingFields.map((field, idx) => (
                                      <li key={idx}>{field}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-[15px] font-bold">Сгенерированный договор</Label>
                              <div className="flex items-center gap-2">
                                {hasWarnings && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                                    {missingFields.length} {missingFields.length === 1 ? 'поле' : 'полей'} требует заполнения
                                  </span>
                                )}
                                {!hasWarnings && (
                                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Готов к сохранению
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* AI Ассистент и управление */}
                            <div className="relative">
                              <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                                {/* Undo/Redo */}
                                <button
                                  type="button"
                                  onClick={handleUndo}
                                  disabled={historyIndex <= 0}
                                  className="p-2 rounded-[12px] bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Отменить (Ctrl+Z)"
                                >
                                  <span className="text-base">↩️</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRedo}
                                  disabled={historyIndex >= history.length - 1}
                                  className="p-2 rounded-[12px] bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Повторить (Ctrl+Y)"
                                >
                                  <span className="text-base">↪️</span>
                                </button>
                                {/* Результаты проверки */}
                                {lastCheckResults && (
                                  <button
                                    type="button"
                                    onClick={() => setCheckResultModal({
                                      isOpen: true,
                                      result: lastCheckResults,
                                      hasErrors: lastCheckResults.includes('❌') || lastCheckResults.includes('⚠️')
                                    })}
                                    className="p-2 rounded-[12px] bg-white border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all shadow-sm"
                                    title="Результаты проверки"
                                  >
                                    <FileCheck className="w-4 h-4 text-green-600" />
                                  </button>
                                )}
                                {/* AI Ассистент */}
                                <button
                                  type="button"
                                  onClick={() => setIsAiModalOpen(!isAiModalOpen)}
                                  className="p-2 rounded-[12px] bg-white border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
                                  title="AI Ассистент"
                                >
                                  <Sparkles className="w-4 h-4 text-purple-600" />
                                </button>
                              </div>

                              {/* Выпадающее меню AI */}
                              {isAiModalOpen && (
                                <div className="absolute right-0 top-12 z-20 w-80 bg-white rounded-[16px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] border border-gray-200 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-purple-600" />
                                      AI Ассистент
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => setIsAiModalOpen(false)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-xs text-gray-600">Инструкция для AI</Label>
                                    <Textarea
                                      value={aiInstruction}
                                      onChange={(e) => setAiInstruction(e.target.value)}
                                      placeholder="Например: Добавь раздел об ответственности за детей"
                                      rows={3}
                                      className="text-sm rounded-[12px]"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setAiInstruction('Упрости юридические формулировки, сделай текст более понятным')
                                      }}
                                      className="text-xs rounded-[12px]"
                                    >
                                      📝 Упростить
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setAiInstruction('Проверь текст на юридические ошибки и несоответствия')
                                      }}
                                      className="text-xs rounded-[12px]"
                                    >
                                      🔍 Проверить
                                    </Button>
                                  </div>

                                  <Button
                                    type="button"
                                    onClick={() => {
                                      if (!aiInstruction.trim()) {
                                        toast.error('Введите инструкцию для AI')
                                        return
                                      }
                                      setIsAiProcessing(true)
                                      // TODO: Реализовать AI обработку
                                      setTimeout(() => {
                                        setIsAiProcessing(false)
                                        toast.success('AI редактирование в разработке')
                                        setIsAiModalOpen(false)
                                      }, 1000)
                                    }}
                                    disabled={isAiProcessing}
                                    className="w-full gap-2 rounded-[12px]"
                                  >
                                    {isAiProcessing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Обработка...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-4 h-4" />
                                        Применить
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}

                              {/* Редактируемый блок с подсветкой */}
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => handleContentEditableChange(e, setGeneratedAgreement)}
                                onContextMenu={handleContextMenu}
                                onClick={closeContextMenu}
                                dangerouslySetInnerHTML={{ __html: renderHighlightedText(generatedAgreement) }}
                                className={`min-h-[600px] p-4 ${hasWarnings ? 'border-2 border-orange-300 bg-white' : 'border-2 border-green-300 bg-green-50/30'} rounded-[16px] overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed focus:outline-none focus:ring-2 ${hasWarnings ? 'focus:ring-orange-400' : 'focus:ring-green-500'}`}
                                style={{ wordBreak: 'break-word' }}
                              />

                              {/* Контекстное меню для работы с текстом */}
                              {contextMenu && (
                                <div
                                  className="fixed z-50 bg-white rounded-[16px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] border border-gray-200 py-2 min-w-[220px]"
                                  style={{
                                    left: `${contextMenu.x}px`,
                                    top: `${contextMenu.y}px`,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-2 border-b border-gray-100">
                                    <p className="text-xs font-bold text-purple-600 flex items-center gap-2">
                                      <Sparkles className="w-3 h-3" />
                                      AI Ассистент
                                    </p>
                                    {contextMenu.selectedText && (
                                      <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                                        "{contextMenu.selectedText.substring(0, 50)}..."
                                      </p>
                                    )}
                                  </div>

                                  {contextMenu.selectedText ? (
                                    // Меню для выделенного текста
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => handleAiTextOperation('rewrite')}
                                        disabled={isAiProcessing}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <span className="text-base">🔄</span>
                                        <span>Перефразировать</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAiTextOperation('simplify')}
                                        disabled={isAiProcessing}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <span className="text-base">📝</span>
                                        <span>Упростить</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAiTextOperation('expand')}
                                        disabled={isAiProcessing}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <span className="text-base">➕</span>
                                        <span>Дополнить</span>
                                      </button>
                                      <div className="border-t border-gray-100 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => handleAiTextOperation('check')}
                                        disabled={isAiProcessing}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <span className="text-base">✅</span>
                                        <span>Проверить</span>
                                      </button>
                                      <div className="border-t border-gray-100 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const instruction = prompt('Введите инструкцию для AI:')
                                          if (instruction) {
                                            handleAiTextOperation('custom', instruction)
                                          }
                                        }}
                                        disabled={isAiProcessing}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <span className="text-base">✏️</span>
                                        <span>Своя инструкция...</span>
                                      </button>
                                    </div>
                                  ) : (
                                    // Меню для вставки текста
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const instruction = prompt('Что добавить в этом месте?')
                                          if (instruction) {
                                            handleAiTextOperation('custom', `Создай текст для договора: ${instruction}`)
                                          }
                                        }}
                                        disabled={isAiProcessing}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <span className="text-base">➕</span>
                                        <span>Добавить пункт...</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAiTextOperation('check')}
                                        disabled={isAiProcessing}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <span className="text-base">✅</span>
                                        <span>Проверить весь договор</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Оверлей для закрытия меню при клике вне */}
                              {contextMenu && (
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={closeContextMenu}
                                />
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <p className="text-xs text-gray-500 flex items-start gap-2">
                                  <span className="shrink-0">💡</span>
                                  <span>
                                    Незаполненные поля <span className="bg-yellow-100 text-orange-800 px-1 rounded font-semibold">[выделены желтым]</span>. Выделите текст и нажмите ПКМ для AI редактирования.
                                  </span>
                                </p>
                                {/* Кнопка "Проверить еще раз" */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setIsAiProcessing(true)
                                    try {
                                      const checkResponse = await fetch('/api/ai/edit-text', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          operation: 'check',
                                          text: generatedAgreement
                                        }),
                                      })
                                      
                                      const checkData = await checkResponse.json()
                                      
                                      if (checkData.success && checkData.result) {
                                        const hasErrors = checkData.result.includes('❌') || checkData.result.includes('⚠️')
                                        setLastCheckResults(checkData.result)
                                        setCheckResultModal({
                                          isOpen: true,
                                          result: checkData.result,
                                          hasErrors
                                        })
                                        toast.success('🔍 Проверка завершена')
                                      }
                                    } catch (error: any) {
                                      toast.error('❌ Ошибка проверки', { description: error.message })
                                    } finally {
                                      setIsAiProcessing(false)
                                    }
                                  }}
                                  disabled={isAiProcessing || !generatedAgreement}
                                  className="rounded-[12px] gap-2 text-xs"
                                >
                                  <FileCheck className="h-3 w-3" />
                                  Проверить еще раз
                                </Button>
                              </div>
                              {isAiProcessing && (
                                <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
                                  <Loader2 className="w-3 w-3 animate-spin" />
                                  AI обрабатывает...
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  )}
                </div>
              )}
          </div>

          {/* Правила бронирования */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold">Правила бронирования</h3>
            
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={rulesType} onValueChange={(v: any) => setRulesType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generated">Сгенерировать с помощью AI</SelectItem>
                  <SelectItem value="custom">Свои правила</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rulesType === 'custom' && (
              <div className="space-y-2">
                <Label>Текст правил</Label>
                <Textarea
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  rows={10}
                  placeholder="Введите правила бронирования..."
                />
              </div>
            )}

            {rulesType === 'generated' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Минимальный срок бронирования</Label>
                    <Input
                      value={rulesGenData.minBookingTime}
                      onChange={(e) => setRulesGenData({ ...rulesGenData, minBookingTime: e.target.value })}
                      placeholder="за 3 дня"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Отмена без штрафа</Label>
                    <Input
                      value={rulesGenData.cancellationDeadline}
                      onChange={(e) => setRulesGenData({ ...rulesGenData, cancellationDeadline: e.target.value })}
                      placeholder="за 24 часа"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={rulesGenData.prepaymentRequired}
                    onCheckedChange={(checked) => setRulesGenData({ ...rulesGenData, prepaymentRequired: checked })}
                  />
                  <Label>Предоплата обязательна</Label>
                </div>

                {rulesGenData.prepaymentRequired && (
                  <div className="space-y-2">
                    <Label>Размер предоплаты</Label>
                    <Input
                      value={rulesGenData.prepaymentAmount}
                      onChange={(e) => setRulesGenData({ ...rulesGenData, prepaymentAmount: e.target.value })}
                      placeholder="50%"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Политика возврата</Label>
                  <Textarea
                    value={rulesGenData.refundPolicy}
                    onChange={(e) => setRulesGenData({ ...rulesGenData, refundPolicy: e.target.value })}
                    rows={3}
                    placeholder="Опишите условия возврата..."
                  />
                </div>

                <Button
                  onClick={() => handleGenerate('rules')}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Сгенерировать правила
                </Button>

                {generatedRules && (
                  <div className="space-y-2">
                    <Label>Сгенерированные правила</Label>
                    <Textarea
                      value={generatedRules}
                      onChange={(e) => setGeneratedRules(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Действия */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Link href={`/profiles/${profileSlug}/legal`} target="_blank">
              <Button variant="outline" className="gap-2 rounded-[16px]">
                <Eye className="h-4 w-4" />
                Просмотр документов
              </Button>
            </Link>
            {(() => {
              const agreementMissing = agreementType === 'generated' && generatedAgreement ? checkMissingFields(generatedAgreement) : []
              const rulesMissing = rulesType === 'generated' && generatedRules ? checkMissingFields(generatedRules) : []
              const totalMissing = agreementMissing.length + rulesMissing.length
              const canSave = totalMissing === 0

              return (
                <div className="flex flex-col items-end gap-2">
                  {totalMissing > 0 && (
                    <span className="text-xs text-red-600 font-medium">
                      ⚠️ Заполните {totalMissing} {totalMissing === 1 ? 'поле' : totalMissing < 5 ? 'поля' : 'полей'} перед сохранением
                    </span>
                  )}
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading || !canSave} 
                    className={`gap-2 rounded-[16px] ${!canSave ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!canSave ? 'Заполните все обязательные поля перед сохранением' : 'Сохранить документы'}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    {!canSave ? `Заполните ${totalMissing} ${totalMissing === 1 ? 'поле' : totalMissing < 5 ? 'поля' : 'полей'}` : 'Сохранить документы'}
                  </Button>
                </div>
              )
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Модальное окно с результатами проверки */}
      {checkResultModal.isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setCheckResultModal({ ...checkResultModal, isOpen: false })}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <Card className="shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] rounded-[24px]">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {checkResultModal.hasErrors ? (
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">
                        {checkResultModal.hasErrors ? '⚠️ Результаты проверки' : '✅ Проверка пройдена'}
                      </CardTitle>
                      <CardDescription>
                        {checkResultModal.hasErrors 
                          ? 'AI нашел замечания, которые нужно исправить' 
                          : 'Договор юридически корректен'}
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckResultModal({ ...checkResultModal, isOpen: false })}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="text-2xl text-gray-500">×</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
                <div className={`prose prose-sm max-w-none ${checkResultModal.hasErrors ? 'text-gray-800' : 'text-green-800'}`}>
                  {checkResultModal.result.split('\n').map((line, idx) => {
                    // Подсветка важных элементов
                    const isError = line.includes('❌') || line.includes('⚠️') || line.toLowerCase().includes('ошибк')
                    const isSuccess = line.includes('✅')
                    const isRecommendation = line.includes('💡') || line.toLowerCase().includes('рекоменд')
                    
                    return (
                      <p 
                        key={idx} 
                        className={`
                          ${isError ? 'text-red-700 font-medium bg-red-50 p-2 rounded-lg border-l-4 border-red-400' : ''}
                          ${isSuccess ? 'text-green-700 font-medium' : ''}
                          ${isRecommendation ? 'text-blue-700 bg-blue-50 p-2 rounded-lg border-l-4 border-blue-400' : ''}
                          ${!isError && !isSuccess && !isRecommendation ? 'text-gray-700' : ''}
                          mb-2
                        `}
                      >
                        {line || '\u00A0'}
                      </p>
                    )
                  })}
                </div>
              </CardContent>
              <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-[24px] flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  💡 Выделите проблемный текст в договоре и используйте ПКМ для исправления
                </p>
                <Button
                  onClick={() => setCheckResultModal({ ...checkResultModal, isOpen: false })}
                  className="rounded-[16px]"
                >
                  Закрыть
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
      
      {/* Модальное окно анкеты */}
      <LegalQuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        profileId={profileId}
        profileType={profileType}
        legalForm={legalForm as 'private' | 'ip' | 'ooo' | 'self_employed'}
        onComplete={() => {
          setIsQuestionnaireFilled(true)
          toast.success('✅ Анкета заполнена! Теперь можно сгенерировать договор')
        }}
      />
    </div>
  )
}


