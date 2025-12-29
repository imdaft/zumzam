'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { 
  Search,
  HelpCircle,
  Users,
  Building2,
  CreditCard,
  Shield,
  MessageCircle,
  Mail,
  ChevronRight,
  Sparkles,
  Calendar,
  Star,
  FileText,
  Phone,
  X,
  Loader2,
  Zap,
  Brain,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Bot
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

// Тип для результата AI-поиска
interface AISearchResult {
  id: string
  category: string
  question: string
  answer: string
  similarity: number
}

// Тип для AI-сгенерированного ответа
interface AIGeneratedAnswer {
  answer: string
  confidence: 'high' | 'medium' | 'low'
  maxSimilarity: number
  sourcesCount: number
  disclaimer: string
}

// Категории FAQ
const faqCategories = [
  {
    id: 'parents',
    title: 'Для родителей',
    icon: Users,
    color: 'bg-blue-500',
    description: 'Поиск, бронирование, оплата',
  },
  {
    id: 'business',
    title: 'Для бизнеса',
    icon: Building2,
    color: 'bg-orange-500',
    description: 'Регистрация, профиль, заявки',
  },
  {
    id: 'payments',
    title: 'Оплата и цены',
    icon: CreditCard,
    color: 'bg-green-500',
    description: 'Тарифы, подписки, продвижение',
  },
  {
    id: 'safety',
    title: 'Безопасность',
    icon: Shield,
    color: 'bg-purple-500',
    description: 'Верификация, гарантии, отзывы',
  },
]

// Вопросы и ответы
const faqItems: Record<string, Array<{ question: string; answer: string }>> = {
  parents: [
    {
      question: 'Как найти аниматора или площадку для праздника?',
      answer: 'Используйте поиск на главной странице или AI-ассистента. Введите что хотите (например, "аниматор Человек-паук на дом") или выберите категорию. Вы увидите список исполнителей с рейтингами, отзывами и ценами. Можно фильтровать по городу, цене и дате.',
    },
    {
      question: 'Как забронировать услугу?',
      answer: 'Выберите понравившегося исполнителя, добавьте услуги в корзину и оформите заявку. Укажите дату, время, адрес и контактные данные. После отправки заявки исполнитель получит уведомление и свяжется с вами для подтверждения деталей.',
    },
    {
      question: 'Можно ли отменить бронирование?',
      answer: 'Да, вы можете отменить бронирование в личном кабинете. Условия отмены и возврата предоплаты зависят от политики конкретного исполнителя — она указана на странице профиля. Обычно бесплатная отмена возможна за 24-48 часов до мероприятия.',
    },
    {
      question: 'Как оставить отзыв?',
      answer: 'После проведения мероприятия вам придёт уведомление с просьбой оставить отзыв. Вы также можете зайти в раздел "Мои заказы" и нажать "Оставить отзыв" напротив завершённого заказа. Честные отзывы помогают другим родителям и мотивируют исполнителей работать лучше.',
    },
    {
      question: 'Что если исполнитель не придёт или услуга окажется некачественной?',
      answer: 'Свяжитесь с нами через чат поддержки или по email. Мы разберём ситуацию и поможем решить проблему. Если исполнитель нарушил договорённости, мы поможем с возвратом средств и примем меры в отношении недобросовестного исполнителя.',
    },
  ],
  business: [
    {
      question: 'Как зарегистрироваться как исполнитель?',
      answer: 'Нажмите "Регистрация" и выберите "Я предлагаю услуги". Заполните профиль: название, описание, услуги с ценами, фото и видео работ. После модерации ваш профиль появится в поиске. Чем подробнее заполнен профиль, тем больше заявок вы получите.',
    },
    {
      question: 'Сколько стоит размещение на платформе?',
      answer: 'Размещение полностью бесплатно — без комиссий и скрытых платежей! Вы можете создать профиль, добавить услуги и получать заявки бесплатно. Для тех, кто хочет больше заявок, есть платные опции: продвижение в поиске, выделение профиля, расширенная аналитика.',
    },
    {
      question: 'Как получать больше заявок?',
      answer: 'Заполните профиль на 100%: добавьте качественные фото, видео, подробное описание услуг. Отвечайте на заявки быстро — это повышает рейтинг. Просите клиентов оставлять отзывы. Используйте платное продвижение для показа в топе поиска.',
    },
    {
      question: 'Как работает система заявок?',
      answer: 'Когда клиент оформляет заказ, вы получаете уведомление (push, email, в приложении). В личном кабинете видите все детали: дата, время, адрес, пожелания. Подтвердите заявку или предложите альтернативу. Общайтесь с клиентом через встроенный чат.',
    },
    {
      question: 'Можно ли импортировать отзывы с Яндекс.Карт?',
      answer: 'Да! Добавьте ссылку на вашу организацию в Яндекс.Картах в настройках профиля. Система автоматически подтянет рейтинг и отзывы. Это повышает доверие клиентов, так как отзывы верифицированы.',
    },
  ],
  payments: [
    {
      question: 'Какие способы оплаты доступны?',
      answer: 'Для клиентов: банковские карты (Visa, Mastercard, МИР), СБП, электронные кошельки. Для бизнеса: оплата тарифов картой или по счёту для юрлиц. Все платежи защищены и проходят через сертифицированную платёжную систему.',
    },
    {
      question: 'Как работает продвижение профиля?',
      answer: 'Платное продвижение помогает получать больше заявок. Вы можете поднять профиль в топ поиска, выделить карточку цветом, разместить баннер в категории. Оплата за показы или клики — вы контролируете бюджет. Никаких комиссий со сделок!',
    },
    {
      question: 'Как происходит возврат средств?',
      answer: 'При отмене заказа средства возвращаются на карту клиента в течение 3-5 рабочих дней. Сумма возврата зависит от условий отмены конкретного исполнителя. При спорных ситуациях обращайтесь в поддержку.',
    },
    {
      question: 'Это бесплатно? Есть скрытые платежи?',
      answer: 'Да, размещение полностью бесплатно! Никаких комиссий со сделок, никаких скрытых платежей. Вы общаетесь с клиентами напрямую и получаете 100% оплаты. Платные опции (продвижение, PRO-подписка) — по желанию, для тех, кто хочет больше заявок.',
    },
  ],
  safety: [
    {
      question: 'Как проверяются исполнители?',
      answer: 'Все исполнители проходят модерацию перед публикацией. Мы проверяем: достоверность информации, качество фото и описаний, наличие контактов. Верифицированные исполнители (синяя галочка) прошли дополнительную проверку документов.',
    },
    {
      question: 'Можно ли доверять отзывам?',
      answer: 'Да. Отзывы могут оставить только клиенты, которые реально оформили заказ через платформу. Мы также импортируем верифицированные отзывы с Яндекс.Карт. Накрутка отзывов запрещена и ведёт к блокировке.',
    },
    {
      question: 'Что делать при проблемах с исполнителем?',
      answer: 'Свяжитесь с поддержкой через чат или email. Опишите ситуацию и приложите доказательства (переписку, фото). Мы свяжемся с исполнителем и поможем решить проблему. При серьёзных нарушениях исполнитель блокируется.',
    },
    {
      question: 'Как защищены мои данные?',
      answer: 'Мы используем шифрование данных, безопасную авторизацию и не передаём персональные данные третьим лицам. Платёжные данные обрабатываются сертифицированным платёжным провайдером. Подробности в Политике конфиденциальности.',
    },
  ],
}

// Популярные вопросы для быстрого доступа
const popularQuestions = [
  { question: 'Как найти аниматора?', category: 'parents', icon: Search },
  { question: 'Как зарегистрироваться?', category: 'business', icon: Building2 },
  { question: 'Это бесплатно?', category: 'payments', icon: CreditCard },
  { question: 'Как отменить заказ?', category: 'parents', icon: Calendar },
]

export function FAQContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [useAISearch, setUseAISearch] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [aiResults, setAiResults] = useState<AISearchResult[]>([])
  const [aiSearchError, setAiSearchError] = useState<string | null>(null)
  
  // AI-генерированный ответ
  const [aiAnswer, setAiAnswer] = useState<AIGeneratedAnswer | null>(null)
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [answerFeedback, setAnswerFeedback] = useState<'positive' | 'negative' | null>(null)

  // AI семантический поиск
  const performAISearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAiResults([])
      return
    }

    setIsSearching(true)
    setAiSearchError(null)

    try {
      const response = await fetch('/api/faq/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, threshold: 0.3, limit: 10 })
      })

      if (!response.ok) {
        throw new Error('Ошибка поиска')
      }

      const data = await response.json()
      setAiResults(data.results || [])
    } catch (error) {
      console.warn('[FAQ] AI Search error:', error instanceof Error ? error.message : 'Unknown error')
      setAiSearchError('Не удалось выполнить AI-поиск. Используйте обычный поиск.')
      setAiResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced AI поиск
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setAiAnswer(null) // Сбрасываем AI-ответ при новом поиске
    setAnswerFeedback(null)
    
    if (useAISearch && value.length >= 3) {
      // Debounce AI поиска
      const timeoutId = setTimeout(() => {
        performAISearch(value)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [useAISearch, performAISearch])

  // Генерация AI-ответа
  const generateAIAnswer = useCallback(async () => {
    if (!searchQuery.trim()) return

    setIsGeneratingAnswer(true)
    setAnswerFeedback(null)

    try {
      const response = await fetch('/api/faq/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: searchQuery })
      })

      if (!response.ok) {
        throw new Error('Failed to generate answer')
      }

      const data = await response.json()
      setAiAnswer(data)
    } catch (error) {
      console.warn('[FAQ] AI Answer error:', error instanceof Error ? error.message : 'Unknown error')
      setAiAnswer({
        answer: 'К сожалению, не удалось сгенерировать ответ. Пожалуйста, обратитесь в поддержку.',
        confidence: 'low',
        maxSimilarity: 0,
        sourcesCount: 0,
        disclaimer: 'Произошла ошибка при генерации ответа.'
      })
    } finally {
      setIsGeneratingAnswer(false)
    }
  }, [searchQuery])

  // Фильтрация вопросов по поисковому запросу (обычный поиск)
  const filteredFaqItems = useMemo(() => {
    if (!searchQuery.trim() || useAISearch) {
      return faqItems
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered: Record<string, Array<{ question: string; answer: string }>> = {}

    Object.entries(faqItems).forEach(([categoryId, items]) => {
      const matchingItems = items.filter(
        item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      )
      if (matchingItems.length > 0) {
        filtered[categoryId] = matchingItems
      }
    })

    return filtered
  }, [searchQuery, useAISearch])

  // Подсчёт найденных результатов
  const totalResults = useMemo(() => {
    if (useAISearch) {
      return aiResults.length
    }
    return Object.values(filteredFaqItems).reduce((acc, items) => acc + items.length, 0)
  }, [filteredFaqItems, useAISearch, aiResults])

  // Категории с результатами
  const categoriesWithResults = faqCategories.filter(cat => filteredFaqItems[cat.id]?.length > 0)

  // Подсветка текста в результатах
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-orange-200 text-orange-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Получение названия категории
  const getCategoryTitle = (categoryId: string) => {
    return faqCategories.find(c => c.id === categoryId)?.title || categoryId
  }

  // Получение цвета категории
  const getCategoryColor = (categoryId: string) => {
    return faqCategories.find(c => c.id === categoryId)?.color || 'bg-gray-500'
  }

  return (
    <div className="min-h-screen bg-[#F3F3F5]">
      {/* Hero секция */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Чем можем помочь?
            </h1>
            <p className="text-lg text-white/70 mb-8">
              Ответы на частые вопросы о сервисе ZumZam
            </p>
            
            {/* Поиск */}
            <div className="relative max-w-xl mx-auto">
              {useAISearch ? (
                <Brain className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={useAISearch ? "Задайте вопрос своими словами..." : "Поиск по вопросам..."}
                className={`w-full h-14 pl-12 pr-12 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  useAISearch ? 'focus:ring-purple-500 border-2 border-purple-400/50' : 'focus:ring-orange-500'
                }`}
              />
              {isSearching && (
                <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setAiResults([])
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              )}
            </div>

            {/* AI Search Toggle */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className={`text-sm ${!useAISearch ? 'text-white' : 'text-white/50'}`}>
                Обычный
              </span>
              <Switch
                checked={useAISearch}
                onCheckedChange={(checked) => {
                  setUseAISearch(checked)
                  if (checked && searchQuery.length >= 3) {
                    performAISearch(searchQuery)
                  } else {
                    setAiResults([])
                  }
                }}
                className="data-[state=checked]:bg-purple-500"
              />
              <span className={`text-sm flex items-center gap-1.5 ${useAISearch ? 'text-white' : 'text-white/50'}`}>
                <Zap className="w-4 h-4" />
                AI-поиск
              </span>
            </div>

            {/* Результаты поиска */}
            {searchQuery && (
              <div className="mt-4 text-white/70 text-sm">
                {isSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ищем с помощью AI...
                  </span>
                ) : aiSearchError ? (
                  <span className="text-red-300">{aiSearchError}</span>
                ) : totalResults > 0 ? (
                  <span>
                    {useAISearch && <Brain className="w-4 h-4 inline mr-1" />}
                    Найдено: <strong className="text-white">{totalResults}</strong> {totalResults === 1 ? 'вопрос' : totalResults < 5 ? 'вопроса' : 'вопросов'}
                    {useAISearch && aiResults.length > 0 && (
                      <span className="ml-2 text-purple-300">
                        (релевантность: {Math.round((aiResults[0]?.similarity || 0) * 100)}%)
                      </span>
                    )}
                  </span>
                ) : searchQuery.length >= 3 ? (
                  <span>Ничего не найдено. Попробуйте изменить запрос.</span>
                ) : useAISearch ? (
                  <span>Введите минимум 3 символа для AI-поиска</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Популярные вопросы — скрываем при поиске */}
      {!searchQuery && (
        <section className="py-8 -mt-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-wrap gap-2">
                <span className="text-sm text-slate-500 py-2 px-3">Популярное:</span>
                {popularQuestions.map((item, idx) => (
                  <a
                    key={idx}
                    href={`#${item.category}`}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-700 transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    {item.question}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Категории — скрываем при поиске */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {!searchQuery && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {faqCategories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#${cat.id}`}
                    className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{cat.title}</h3>
                    <p className="text-sm text-slate-500">{cat.description}</p>
                  </a>
                ))}
              </div>
            )}

            {/* AI Generated Answer */}
            {useAISearch && searchQuery && searchQuery.length >= 3 && (
              <div className="mb-8">
                {/* Кнопка генерации ответа */}
                {!aiAnswer && !isGeneratingAnswer && (
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          Не нашли точный ответ?
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                          AI-ассистент может сгенерировать ответ на ваш вопрос на основе базы знаний.
                        </p>
                        <Button 
                          onClick={generateAIAnswer}
                          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Спросить AI
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Загрузка ответа */}
                {isGeneratingAnswer && (
                  <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                          <span className="font-medium text-slate-900">AI генерирует ответ...</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          Анализирую базу знаний и формулирую ответ
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI-сгенерированный ответ */}
                {aiAnswer && !isGeneratingAnswer && (
                  <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
                    {/* Заголовок */}
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6 text-white" />
                        <span className="font-semibold text-white">Ответ AI-ассистента</span>
                        {aiAnswer.confidence === 'high' && (
                          <span className="text-xs bg-green-400/20 text-green-100 px-2 py-0.5 rounded-full">
                            Высокая уверенность
                          </span>
                        )}
                        {aiAnswer.confidence === 'medium' && (
                          <span className="text-xs bg-yellow-400/20 text-yellow-100 px-2 py-0.5 rounded-full">
                            Средняя уверенность
                          </span>
                        )}
                        {aiAnswer.confidence === 'low' && (
                          <span className="text-xs bg-red-400/20 text-red-100 px-2 py-0.5 rounded-full">
                            Требуется уточнение
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ответ */}
                    <div className="p-6">
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {aiAnswer.answer}
                        </p>
                      </div>

                      {/* Дисклеймер */}
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-800 font-medium mb-1">
                              Обратите внимание
                            </p>
                            <p className="text-sm text-amber-700">
                              {aiAnswer.disclaimer}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Фидбек и действия */}
                      <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Помог ли ответ?</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`rounded-lg ${answerFeedback === 'positive' ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
                            onClick={() => setAnswerFeedback('positive')}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Да
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`rounded-lg ${answerFeedback === 'negative' ? 'bg-red-50 border-red-300 text-red-700' : ''}`}
                            onClick={() => setAnswerFeedback('negative')}
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Нет
                          </Button>
                        </div>

                        <Link href="/contacts" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          Написать в поддержку
                        </Link>
                      </div>

                      {/* Сообщение после негативного фидбека */}
                      {answerFeedback === 'negative' && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                          <p className="text-sm text-slate-600">
                            Извините, что ответ не помог. Рекомендуем{' '}
                            <Link href="/contacts" className="text-purple-600 hover:underline font-medium">
                              обратиться в поддержку
                            </Link>
                            {' '}— наши специалисты помогут разобраться с вашим вопросом.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Search Results */}
            {useAISearch && searchQuery && aiResults.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Похожие вопросы</h2>
                  <span className="text-sm text-slate-500 ml-2">
                    ({aiResults.length})
                  </span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <Accordion type="single" collapsible className="divide-y divide-slate-100" defaultValue="ai-0">
                    {aiResults.map((result, idx) => (
                      <AccordionItem key={result.id} value={`ai-${idx}`} className="border-0">
                        <AccordionTrigger className="px-6 py-5 text-left hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                          <div className="flex items-start gap-3 pr-4 w-full">
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium text-slate-900">
                                {result.question}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(result.category)} text-white`}>
                                  {getCategoryTitle(result.category)}
                                </span>
                                <span className="text-xs text-purple-600 font-medium">
                                  {Math.round(result.similarity * 100)}% совпадение
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-5 text-slate-600 leading-relaxed">
                          {result.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            )}

            {/* AI Search - No results message */}
            {useAISearch && searchQuery && searchQuery.length >= 3 && !isSearching && aiResults.length === 0 && !aiSearchError && (
              <div className="text-center py-16 mb-12">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  AI не нашёл похожих вопросов
                </h3>
                <p className="text-slate-600 mb-6">
                  Попробуйте переформулировать запрос или используйте обычный поиск.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setUseAISearch(false)}
                  className="rounded-xl"
                >
                  Переключиться на обычный поиск
                </Button>
              </div>
            )}

            {/* FAQ по категориям (скрываем при AI поиске с результатами) */}
            {(!useAISearch || !searchQuery || aiResults.length === 0) && categoriesWithResults.map((cat) => (
              <div key={cat.id} id={cat.id} className="mb-12 scroll-mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{cat.title}</h2>
                  {searchQuery && (
                    <span className="text-sm text-slate-500 ml-2">
                      ({filteredFaqItems[cat.id]?.length || 0})
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <Accordion type="single" collapsible className="divide-y divide-slate-100" defaultValue={searchQuery ? `${cat.id}-0` : undefined}>
                    {filteredFaqItems[cat.id]?.map((item, idx) => (
                      <AccordionItem key={idx} value={`${cat.id}-${idx}`} className="border-0">
                        <AccordionTrigger className="px-6 py-5 text-left hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                          <span className="font-medium text-slate-900 pr-4">
                            {searchQuery ? highlightText(item.question, searchQuery) : item.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-5 text-slate-600 leading-relaxed">
                          {searchQuery ? highlightText(item.answer, searchQuery) : item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            ))}

            {/* Если поиск не дал результатов */}
            {searchQuery && totalResults === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Ничего не найдено
                </h3>
                <p className="text-slate-600 mb-6">
                  По запросу &quot;{searchQuery}&quot; нет результатов.<br />
                  Попробуйте изменить запрос или напишите нам.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="rounded-xl"
                >
                  Очистить поиск
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Не нашли ответ? */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                    Не нашли ответ?
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Напишите нам, и мы поможем разобраться с любым вопросом. 
                    Обычно отвечаем в течение нескольких часов.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button className="bg-slate-900 hover:bg-black text-white h-12 px-6 rounded-xl">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Написать в чат
                    </Button>
                    <Button variant="outline" className="h-12 px-6 rounded-xl">
                      <Mail className="w-5 h-5 mr-2" />
                      support@zumzam.ru
                    </Button>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Полезные ссылки */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Полезные ссылки</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Тарифы и цены', href: '/pricing', icon: CreditCard },
                { title: 'Стать партнёром', href: '/register', icon: Building2 },
                { title: 'Политика конфиденциальности', href: '/legal/privacy', icon: FileText },
                { title: 'Пользовательское соглашение', href: '/legal/terms', icon: FileText },
                { title: 'Отзывы о сервисе', href: '/#reviews', icon: Star },
                { title: 'Контакты', href: '/contacts', icon: Phone },
              ].map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <link.icon className="w-5 h-5 text-slate-600 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-slate-900">
                    {link.title}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

