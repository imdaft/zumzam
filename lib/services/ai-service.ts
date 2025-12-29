/**
 * Централизованный сервис для работы с AI моделями
 * Поддерживает Google Gemini, OpenAI, Anthropic и другие провайдеры
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Типы для AI настроек
export interface AISettings {
  id: string
  provider: 'google' | 'openai' | 'anthropic' | 'other'
  model_name: string
  api_key: string
  is_active: boolean
  settings: {
    temperature?: number
    max_tokens?: number
    maxOutputTokens?: number
    top_p?: number
    topP?: number
    topK?: number
  }
  description?: string
}

// Опции для генерации текста
export interface GenerateTextOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
}

export type AIServiceErrorCode =
  | 'RATE_LIMIT'
  | 'OVERLOADED'
  | 'INVALID_API_KEY'
  | 'BLOCKED'
  | 'UNKNOWN'

export class AIServiceError extends Error {
  code: AIServiceErrorCode
  status: number
  retryAfterSeconds?: number

  constructor(args: { code: AIServiceErrorCode; message: string; status: number; retryAfterSeconds?: number }) {
    super(args.message)
    this.name = 'AIServiceError'
    this.code = args.code
    this.status = args.status
    this.retryAfterSeconds = args.retryAfterSeconds
  }
}

function parseRetryAfterSecondsFromGeminiError(error: any): number | undefined {
  // 1) Structured errorDetails (google.rpc.RetryInfo)
  const details = error?.errorDetails
  if (Array.isArray(details)) {
    const retryInfo = details.find((d) => typeof d === 'object' && d && 'retryDelay' in d)
    const retryDelay = retryInfo?.retryDelay
    if (typeof retryDelay === 'string') {
      const m = retryDelay.match(/([\d.]+)s/i)
      if (m) {
        const seconds = Math.ceil(Number(m[1]))
        if (Number.isFinite(seconds) && seconds > 0) return seconds
      }
    }
  }

  // 2) Fallback: parse from message like "Please retry in 6.16s." or 'retryDelay":"6s"'
  const msg = String(error?.message || '')
  const m1 = msg.match(/retry\s+in\s+([\d.]+)s/i)
  if (m1) {
    const seconds = Math.ceil(Number(m1[1]))
    if (Number.isFinite(seconds) && seconds > 0) return seconds
  }
  const m2 = msg.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i)
  if (m2) {
    const seconds = Math.ceil(Number(m2[1]))
    if (Number.isFinite(seconds) && seconds > 0) return seconds
  }
  return undefined
}

/**
 * Класс для работы с AI моделями
 */
export class AIService {
  private static instance: AIService | null = null
  private cachedSettings: AISettings | null = null
  private cacheTime: number = 0
  private readonly CACHE_TTL = 60000 // 1 минута

  private constructor() {}

  /**
   * Singleton pattern
   */
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Получить активные настройки AI из БД (с кешированием)
   */
  async getActiveSettings(): Promise<AISettings | null> {
    const now = Date.now()
    
    // Возвращаем из кеша, если актуально
    if (this.cachedSettings && (now - this.cacheTime) < this.CACHE_TTL) {
      return this.cachedSettings
    }

    // Используем переменные окружения (Google Gemini)
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('[AIService] No GOOGLE_GEMINI_API_KEY found in environment')
      return null
    }

    const settings: AISettings = {
      id: 'env-fallback',
      provider: 'google',
      model_name: 'gemini-2.0-flash-exp',
      api_key: apiKey,
      is_active: true,
      settings: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 0.95,
        topK: 40,
      },
    }

    this.cachedSettings = settings
    this.cacheTime = now

    console.log('[AIService] Using settings from environment:', {
      provider: settings.provider,
      model: settings.model_name,
      hasApiKey: !!settings.api_key,
    })

    return settings
  }

  /**
   * Сбросить кеш настроек
   */
  clearCache(): void {
    this.cachedSettings = null
    this.cacheTime = 0
  }

  /**
   * Универсальный метод генерации текста
   */
  async generateText(
    prompt: string,
    options?: { temperature?: number; max_tokens?: number; top_p?: number }
  ): Promise<string | null> {
    try {
      const settings = await this.getActiveSettings()
      if (!settings) {
        console.error('[AIService] No active AI settings found')
        return null
      }

      switch (settings.provider) {
        case 'google':
          return this.generateWithGoogle(prompt, settings, {
            temperature: options?.temperature,
            maxTokens: options?.max_tokens,
            topP: options?.top_p,
          })
        
        case 'openai':
          return this.generateWithOpenAI(prompt, settings, {
            temperature: options?.temperature,
            maxTokens: options?.max_tokens,
            topP: options?.top_p,
          })
        
        case 'anthropic':
          return this.generateWithAnthropic(prompt, settings, {
            temperature: options?.temperature,
            maxTokens: options?.max_tokens,
            topP: options?.top_p,
          })
        
        default:
          throw new Error(`Unsupported AI provider: ${settings.provider}`)
      }
    } catch (error: any) {
      console.error('[AIService] Error generating text:', error)
      return null
    }
  }

  /**
   * Генерация текста, которая пробрасывает нормализованные ошибки.
   * Используется в API-роутах, чтобы вернуть клиенту корректный status (429/503) и короткое сообщение.
   */
  async generateTextOrThrow(
    prompt: string,
    options?: { temperature?: number; max_tokens?: number; top_p?: number }
  ): Promise<string> {
    const settings = await this.getActiveSettings()
    if (!settings) {
      throw new AIServiceError({
        code: 'UNKNOWN',
        status: 500,
        message: 'AI не настроен. Добавьте активные настройки или ключ.',
      })
    }

    switch (settings.provider) {
      case 'google':
        return this.generateWithGoogle(prompt, settings, {
          temperature: options?.temperature,
          maxTokens: options?.max_tokens,
          topP: options?.top_p,
        })
      case 'openai':
        throw new AIServiceError({
          code: 'UNKNOWN',
          status: 501,
          message: 'Провайдер OpenAI пока не подключён в этом проекте.',
        })
      case 'anthropic':
        throw new AIServiceError({
          code: 'UNKNOWN',
          status: 501,
          message: 'Провайдер Anthropic пока не подключён в этом проекте.',
        })
      default:
        throw new AIServiceError({
          code: 'UNKNOWN',
          status: 500,
          message: `Неподдерживаемый провайдер AI: ${settings.provider}`,
        })
    }
  }

  /**
   * Генерация с Google Gemini
   */
  private async generateWithGoogle(
    prompt: string,
    settings: AISettings,
    options?: GenerateTextOptions
  ): Promise<string> {
    try {
      console.log('[AIService] Starting Google generation...', {
        model: settings.model_name,
        hasApiKey: !!settings.api_key,
        apiKeyStart: settings.api_key?.slice(0, 10),
        promptLength: prompt.length,
      })

      const genAI = new GoogleGenerativeAI(settings.api_key)
      const model = genAI.getGenerativeModel({ 
        model: settings.model_name,
        generationConfig: {
          temperature: options?.temperature ?? settings.settings.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? settings.settings.maxOutputTokens ?? 8192,
          topP: options?.topP ?? settings.settings.topP ?? 0.95,
          topK: options?.topK ?? settings.settings.topK ?? 40,
        },
      })

      console.log('[AIService] Calling Google API...')
      const result = await model.generateContent(prompt)
      
      console.log('[AIService] Response received:', {
        hasResponse: !!result?.response,
        candidatesCount: result?.response?.candidates?.length,
        promptFeedback: result?.response?.promptFeedback,
      })
      
      // Проверяем promptFeedback на блокировки
      if (result?.response?.promptFeedback?.blockReason) {
        const blockReason = result.response.promptFeedback.blockReason
        throw new AIServiceError({
          code: 'BLOCKED',
          status: 400,
          message: `Запрос заблокирован фильтрами безопасности: ${blockReason}`,
        })
      }
      
      const response = result.response
      const candidates = response.candidates || []
      
      if (candidates.length === 0) {
        console.error('[AIService] ❌ No candidates returned')
        throw new Error('Google API не вернул ни одного варианта ответа')
      }
      
      const firstCandidate = candidates[0]
      console.log('[AIService] First candidate:', {
        finishReason: firstCandidate.finishReason,
        safetyRatings: firstCandidate.safetyRatings,
        hasContent: !!firstCandidate.content,
      })
      
      if (firstCandidate.finishReason && firstCandidate.finishReason !== 'STOP') {
        console.error('[AIService] ❌ Unexpected finish reason:', firstCandidate.finishReason)
        throw new Error(`Генерация прервана: ${firstCandidate.finishReason}`)
      }
      
      const text = response.text()
      
      console.log('[AIService] Text extracted:', {
        length: text?.length,
        preview: text?.slice(0, 100),
      })
      
      if (!text || text.trim().length === 0) {
        console.error('[AIService] ❌ Empty text returned')
        throw new Error('Google API вернул пустой текст')
      }
      
      return text
    } catch (error: any) {
      const msg = String(error?.message || '')
      const status = Number(error?.status || 0) || undefined
      const retryAfterSeconds = parseRetryAfterSecondsFromGeminiError(error)

      // В dev не хотим гигантских простыней в консоли
      console.warn('[AIService] Google generation failed:', {
        status,
        code: error?.code,
        retryAfterSeconds,
        messagePreview: msg.slice(0, 200),
      })

      // Rate limit / quota
      if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota')) {
        throw new AIServiceError({
          code: 'RATE_LIMIT',
          status: 429,
          retryAfterSeconds,
          message: retryAfterSeconds
            ? `Превышен лимит запросов к AI. Повторите через ${retryAfterSeconds} сек.`
            : 'Превышен лимит запросов к AI. Попробуйте позже.',
        })
      }

      // Overloaded
      if (status === 503 || msg.toLowerCase().includes('overloaded')) {
        throw new AIServiceError({
          code: 'OVERLOADED',
          status: 503,
          retryAfterSeconds,
          message: retryAfterSeconds
            ? `AI перегружен. Повторите через ${retryAfterSeconds} сек.`
            : 'AI перегружен. Попробуйте через 10–30 секунд.',
        })
      }

      // Invalid/forbidden key
      if (status === 401 || status === 403 || msg.toLowerCase().includes('api key') || msg.includes('401')) {
        throw new AIServiceError({
          code: 'INVALID_API_KEY',
          status: 500,
          message: 'AI ключ недействителен или нет доступа. Проверьте ключ и биллинг.',
        })
      }

      // Fallback
      throw new AIServiceError({
        code: 'UNKNOWN',
        status: 500,
        message: 'Ошибка генерации текста. Попробуйте позже.',
      })
    }
  }

  /**
   * Генерация с OpenAI (заглушка для будущей реализации)
   */
  private async generateWithOpenAI(
    prompt: string,
    settings: AISettings,
    options?: GenerateTextOptions
  ): Promise<string> {
    // TODO: Реализовать интеграцию с OpenAI API
    throw new Error('OpenAI provider not yet implemented')
  }

  /**
   * Генерация с Anthropic (заглушка для будущей реализации)
   */
  private async generateWithAnthropic(
    prompt: string,
    settings: AISettings,
    options?: GenerateTextOptions
  ): Promise<string> {
    // TODO: Реализовать интеграцию с Anthropic API
    throw new Error('Anthropic provider not yet implemented')
  }

  /**
   * Улучшение текста описания (для AIFieldAssistant)
   */
  async improveDescription(text: string, context?: string): Promise<string> {
    const prompt = `
Ты — помощник для владельцев детских студий и аниматоров.
Улучши следующий текст описания профиля, сделай его более привлекательным и информативным для клиентов.

${context ? `Контекст: ${context}\n\n` : ''}Исходный текст:
${text}

Требования:
- Сохрани основную информацию
- Сделай текст живым и интересным
- Используй дружелюбный тон
- Подчеркни преимущества
- Длина: 150-300 слов

Улучшенный текст:
`.trim()

    return this.generateText(prompt, { temperature: 0.8 })
  }

  /**
   * Генерация договора оферты
   */
  async generateOfferAgreement(data: {
    companyName: string
    legalForm: 'ip' | 'ooo' | 'private' | 'self_employed'
    inn?: string
    ogrn?: string
    address?: string
    directorName?: string
    phone?: string
    email?: string
    website?: string
    profileType: 'venue' | 'animator' | 'show' | 'other'
    cancellationPolicy?: string
    prepaymentAmount?: string
    additionalTerms?: string
  }): Promise<string> {
    const legalFormText = {
      ip: 'Индивидуальный предприниматель',
      ooo: 'Общество с ограниченной ответственностью',
      private: 'Физическое лицо',
      self_employed: 'Самозанятый'
    }

    // Используем плейсхолдеры для незаполненных полей или стандартные значения
    const companyName = data.companyName || '[НАЗВАНИЕ КОМПАНИИ]'
    const phone = data.phone || '[ТЕЛЕФОН]'
    const email = data.email || '[EMAIL]'
    const website = data.website || '[САЙТ]'
    
    // Для политики и предоплаты - используем стандартные значения вместо плейсхолдеров
    const cancellationPolicy = data.cancellationPolicy || 'Отмена бронирования за 48 часов до мероприятия - полный возврат средств. Отмена менее чем за 48 часов - возврат 50% суммы предоплаты. Отмена в день мероприятия - средства не возвращаются.'
    const prepaymentAmount = data.prepaymentAmount || '30% от общей стоимости услуг'

    // Формируем данные в зависимости от правовой формы
    let organizationData = `
- Название: ${companyName}
- Правовая форма: ${legalFormText[data.legalForm]}
- Телефон: ${phone}
- Email: ${email}
- Сайт: ${website}`

    // Для юр. лиц и ИП добавляем реквизиты
    if (data.legalForm !== 'private') {
      const inn = data.inn || '[ИНН]'
      const address = data.address || '[ЮРИДИЧЕСКИЙ АДРЕС]'
      const directorName = data.directorName || '[ФИО ДИРЕКТОРА/ИП]'
      
      organizationData += `
- ИНН: ${inn}`
      
      if (data.legalForm !== 'self_employed') {
        const ogrn = data.ogrn || '[ОГРН/ОГРНИП]'
        organizationData += `
- ОГРН/ОГРНИП: ${ogrn}`
      }
      
      organizationData += `
- Юридический адрес: ${address}
- Директор/ИП: ${directorName}`
    } else {
      // Для физ. лица - только ФИО
      const fullName = data.directorName || data.companyName || '[ФИО]'
      organizationData += `
- ФИО: ${fullName}`
    }

    // Специфичные условия в зависимости от типа услуги
    const serviceSpecificTerms = {
      venue: `
ОБЯЗАТЕЛЬНЫЕ ПУНКТЫ ДЛЯ ПЛОЩАДКИ:
1. Время аренды:
   - Точное время начала и окончания
   - Время на подготовку до мероприятия и уборку после
   - Стоимость сверхурочного времени (за каждые 30 мин)
   - Минимальное/максимальное время аренды

2. Правила использования площадки:
   - Максимальное количество гостей (детей/взрослых)
   - Разрешенные виды активностей
   - ЗАПРЕЩЕНО: свечи/огонь, конфетти/серпантин, торты с блестками, алкоголь
   - Правила использования кухни/оборудования
   - Уровень шума и время тишины

3. Ответственность за повреждения:
   - Залог за сохранность имущества (размер, возврат)
   - Список оборудования и его стоимость
   - Порядок компенсации повреждений
   - Страхование гражданской ответственности

4. Условия уборки:
   - Что должен сделать заказчик (вынос мусора, мытье посуды)
   - Что входит в услуги площадки (генеральная уборка)
   - Стоимость дополнительной уборки при сильном загрязнении

5. Безопасность:
   - Требования пожарной безопасности
   - Контакты ответственного лица на площадке
   - Порядок эвакуации и расположение выходов
   - Наличие аптечки первой помощи

6. Дополнительные услуги:
   - Что предоставляется (мебель, посуда, декор, техника)
   - Условия использования проектора/звука/света
   - Парковка для гостей
   - Возможность прихода сторонних аниматоров/кейтеринга`,
      
      animator: `
ОБЯЗАТЕЛЬНЫЕ ПУНКТЫ ДЛЯ АНИМАТОРА:
1. Программа и продолжительность:
   - Точное время начала и продолжительность (мин/часы)
   - Возрастная категория детей и их количество
   - Описание программы (игры, конкурсы, мастер-классы)
   - Что входит в программу, что за доп.плату
   - Возможность корректировки программы по ходу

2. Требования к месту проведения:
   - Минимальная площадь помещения (кв.м)
   - Требования к освещению и вентиляции
   - Необходимость доступа к воде/электричеству
   - Требования к полу (ковер/паркет для активных игр)
   - Место для переодевания аниматора

3. Правила работы с детьми:
   - Соблюдение техники безопасности
   - Запрет на агрессивные игры
   - Учет индивидуальных особенностей детей
   - Присутствие родителей (обязательно/желательно)
   - Действия при травмах/недомогании ребенка

4. Реквизит и оборудование:
   - Что предоставляет аниматор (костюм, реквизит, музыка)
   - Что должен подготовить заказчик
   - Ответственность за утерю/повреждение реквизита
   - Условия использования аудиотехники заказчика

5. Форс-мажор и замены:
   - Действия при болезни аниматора
   - Условия замены на другого специалиста
   - Порядок переноса мероприятия
   - Компенсация при невозможности выполнения

6. Фото/видеосъемка:
   - Согласие на съемку детей (получает заказчик от родителей)
   - Права аниматора на использование фото в портфолио
   - Запрет на съемку без разрешения родителей`,

      show: `
ОБЯЗАТЕЛЬНЫЕ ПУНКТЫ ДЛЯ ШОУ-ПРОГРАММЫ:
1. Состав и программа:
   - Точный состав группы/артистов (ФИО, роли)
   - Длительность выступления (мин)
   - Описание номеров программы
   - Возможность изменения программы
   - Условия замены артистов (по болезни и т.д.)

2. Технический райдер:
   - Требования к сцене (размер, высота, покрытие)
   - Световое оборудование (что нужно, кто предоставляет)
   - Звуковое оборудование (мощность, количество микрофонов)
   - Электропитание (количество розеток, мощность)
   - Гримерка для артистов (размер, оборудование)

3. Время и график:
   - Время прибытия на площадку для подготовки
   - Время саундчека/технической репетиции
   - Точное время начала выступления
   - Время на демонтаж оборудования
   - Штрафы за задержку начала по вине сторон

4. Логистика:
   - Условия проезда артистов (кто оплачивает)
   - Парковка для транспорта группы
   - Проживание артистов (если выступление в другом городе)
   - Питание артистов (райдер, время, кто организует)

5. Права на контент:
   - Авторские права на программу/номера
   - Права на видео/фото/трансляцию выступления
   - Условия использования записей (коммерческое/личное)
   - Согласование размещения в соцсетях

6. Безопасность:
   - Требования к пожарной безопасности сцены
   - Охрана оборудования и артистов
   - Страхование оборудования и артистов
   - Медицинская помощь (наличие медпункта)

7. Гарантии исполнения:
   - Компенсация при срыве выступления
   - Порядок замены артистов
   - Условия технических проблем
   - Форс-мажорные обстоятельства`,

      agency: `
ОБЯЗАТЕЛЬНЫЕ ПУНКТЫ ДЛЯ АГЕНТСТВА:
1. Перечень услуг агентства:
   - Организация "под ключ" или отдельные услуги
   - Что входит (подбор площадки, аниматоров, декор, кейтеринг и т.д.)
   - Что НЕ входит (дополнительные опции)
   - Количество вариантов на выбор по каждой позиции
   - Сроки предоставления вариантов

2. Обязанности агентства:
   - Подбор исполнителей согласно требованиям
   - Проверка квалификации и репутации исполнителей
   - Координация всех участников
   - Контроль качества услуг
   - Решение организационных вопросов

3. Обязанности заказчика:
   - Своевременное предоставление информации
   - Согласование предложенных вариантов в срок
   - Оплата услуг агентства и исполнителей
   - Обеспечение доступа на площадку
   - Присутствие ответственного лица на мероприятии

4. Порядок работы:
   - Брифинг и сбор требований (когда, как)
   - Предоставление вариантов (сколько, в какой срок)
   - Согласование и внесение изменений
   - Подготовка к мероприятию (репетиции, встречи)
   - Координация в день мероприятия

5. Изменения и корректировки:
   - До какого срока можно вносить изменения бесплатно
   - Стоимость изменений после дедлайна
   - Порядок замены исполнителей
   - Изменение даты/времени мероприятия
   - Отмена отдельных услуг

6. Гарантии качества:
   - Замена исполнителя при неявке/болезни
   - Компенсация при некачественном оказании услуг
   - Порядок рассмотрения претензий
   - Возврат части средств при нарушениях
   - Страхование ответственности агентства

7. Финансовые условия:
   - Комиссия агентства (фикс или процент)
   - Порядок оплаты агентству и исполнителям
   - Кто заключает договоры с исполнителями
   - Распределение ответственности за оплату
   - Порядок возврата при отмене`
    }

    const serviceContext = serviceSpecificTerms[data.profileType as keyof typeof serviceSpecificTerms] || serviceSpecificTerms.animator

    const prompt = `
Ты - юрист, специализирующийся на договорах для детских праздников и мероприятий.

ВАЖНО: Создай ПРОСТОЙ, ПОНЯТНЫЙ, ДРУЖЕЛЮБНЫЙ договор в стиле современного бизнеса.
НЕ делай его слишком юридически тяжелым или бюрократическим.
Используй простой язык, понятный обычным людям.

КОНТЕКСТ:
Тип услуги: ${data.profileType === 'venue' ? 'Аренда площадки для детских праздников' : data.profileType === 'animator' ? 'Услуги аниматора' : data.profileType === 'show' ? 'Организация шоу-программ' : 'Услуги агентства по организации праздников'}
Правовая форма: ${legalFormText[data.legalForm]}
${serviceContext}

ДАННЫЕ ${data.legalForm === 'private' ? 'ИСПОЛНИТЕЛЯ' : 'ОРГАНИЗАЦИИ'}:${organizationData}

УСЛОВИЯ:
Отмена и возврат: ${cancellationPolicy}
Предоплата: ${prepaymentAmount}
${data.additionalTerms ? `\nДополнительно:\n${data.additionalTerms}` : ''}

ЗАДАЧА:
Создай договор оферты, который:
1. Соответствует ГК РФ и Закону о защите прав потребителей
2. Написан ПРОСТЫМ языком без канцелярита
3. Понятен обычным людям (не юристам)
4. Защищает обе стороны
5. Дружелюбный по тону

СТИЛЬ:
- Вместо "осуществляет акцепт" → "соглашается"
- Вместо "в соответствии с положениями" → "согласно"
- Вместо "стороны пришли к соглашению" → "мы договорились"
- Обращение к клиенту на "Вы"
- Короткие понятные предложения
- Минимум юридических терминов

СТРУКТУРА (упрощённая):

1. ОБЩИЕ ПОЛОЖЕНИЯ
   - Что это за документ (публичная оферта)
   - Кто Исполнитель, кто Заказчик
   - Как заключается договор (при оплате = акцепт)

2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ
   - Только самые важные термины простым языком
   - Оферта, Акцепт, Заказчик, Исполнитель, Мероприятие

3. ПРЕДМЕТ ОФЕРТЫ
   - Какие услуги предоставляются
   - Перечень услуг (ссылка на сайт/прайс)
   - Стоимость

4. ЗАДАТОК И УСЛОВИЯ ЕГО ВОЗВРАТА
   ЖЕЛЕЗОБЕТОННЫЙ БЛОК:
   - Задаток = ${prepaymentAmount} по ст. 380-381 ГК РФ
   - Подтверждает заключение договора и резервирование даты
   - Стороны подтверждают: это ЗАДАТОК, а не аванс/предоплата
   - При отказе Заказчика менее 7 дней: НЕ возвращается (ст. 381)
   - При отказе Исполнителя: возврат в ДВОЙНОМ размере (ст. 381)
   - Невозврат компенсирует убытки (резервирование, отказ другим)
   - Более 7 дней: возврат за вычетом расходов (не более 10%)

5. КАК ЗАКАЗАТЬ И ОПЛАТИТЬ
   - Как оформить заявку (через что)
   - Способы оплаты задатка
   - Когда полная оплата

6. ПРАВА И ОБЯЗАННОСТИ СТОРОН
   Заказчик имеет право:
   - Переносить мероприятие (более чем за 7 дней)
   - Отказаться (с условиями)
   
   Заказчик обязан:
   - Оплатить вовремя
   - Предоставить достоверную информацию
   - Прибыть вовремя (иначе время сокращается)
   ${data.profileType === 'venue' ? '- Соблюдать правила площадки\n   - Не портить имущество\n   - Убрать за собой' : ''}
   
   Исполнитель обязан:
   - Оказать услуги качественно
   - В назначенное время
   ${data.profileType === 'venue' ? '- Обеспечить безопасность площадки' : ''}
   ${data.profileType === 'animator' ? '- Профессионально работать с детьми' : ''}

7. ПРАВИЛА ПРОВЕДЕНИЯ МЕРОПРИЯТИЙ
   ${data.profileType === 'venue' ? '- ЗАПРЕЩЕНО: торты с блестками, конфетти, свечи\n   - Максимальное количество гостей\n   - Правила уборки' : '- Требования к месту проведения\n   - Правила безопасности'}

8. ОТВЕТСТВЕННОСТЬ СТОРОН
   - Исполнитель: за качество услуг
   - Заказчик: за детей, за повреждения
   ${data.profileType === 'venue' ? '- Залог за имущество' : ''}
   - Форс-мажор (освобождает от ответственности)

9. ПЕРСОНАЛЬНЫЕ ДАННЫЕ И КОНФИДЕНЦИАЛЬНОСТЬ
   - Обрабатываем только для этого заказа
   - Согласие на обработку при акцепте
   - Не передаём третьим лицам

10. АВТОРСКИЕ ПРАВА НА ФОТО/ВИДЕО
    - Фото принадлежат Исполнителю
    - Заказчик может использовать для личных целей
    - Публикация в портфолио с согласия Заказчика

11. РАЗРЕШЕНИЕ СПОРОВ
    - Сначала переговоры
    - Досудебный порядок обязателен (10 дней)
    - Суд по месту Исполнителя

12. СРОК ДЕЙСТВИЯ ДОГОВОРА
    - С момента внесения задатка до оказания услуг
    - Контакты: ${phone}, ${email}, ${website}
    ${data.legalForm !== 'private' ? `\n    - Реквизиты: ${organizationData}` : ''}

КРИТИЧЕСКИ ВАЖНО - ИЗБЕГАЙ ЭТИХ ОШИБОК:

1. ПРОТИВОРЕЧИЕ С ДИСКЛЕЙМЕРОМ:
   ❌ НЕ пиши "это ознакомительный материал" В САМОМ договоре
   ✅ Дисклеймер уже добавлен ПЕРЕД договором - просто создай полноценный договор

2. ПРАВИЛЬНОЕ ОФОРМЛЕНИЕ ЗАДАТКА (ст. 380-381 ГК РФ):
   ✅ Используй термин "ЗАДАТОК" (не аванс, не предоплата, не обеспечительный платеж)
   ✅ Прямо укажи: "в соответствии со ст. 380-381 ГК РФ"
   ✅ ОБЯЗАТЕЛЬНО пропиши ДВОЙНОЙ возврат при отказе Исполнителя
   ✅ Укажи, что задаток НЕ возвращается при отказе Заказчика
   ✅ Добавь фразу: "Стороны подтверждают, что это ЗАДАТОК, а не аванс/предоплата"
   ✅ Укажи, что невозврат задатка компенсирует убытки (резервирование даты, отказ другим клиентам)

3. ПРОТИВОРЕЧИЯ В ТЕКСТЕ:
   ❌ П. 5.2.6 "убрать за собой" vs П. 6.3 "генеральная уборка входит в услуги"
   ✅ Чётко раздели: Заказчик (мусор, посуда) vs Исполнитель (генеральная уборка)

4. КОНКРЕТИКА ВЕЗДЕ:
   - ${data.legalForm === 'private' ? 'НЕ требуй ИНН/ОГРН от физ.лица!' : 'Укажи ВСЕ реквизиты (включая банковские)'}
   - Способ уведомления об отмене (телефон, email, письменно)
   - Порядок возврата залога (наличными/переводом, через сколько дней)
   - Ссылка на "Политику конфиденциальности" (не просто "обрабатываем данные")
   - Указать дату составления оферты (или "действительна с DD.MM.YYYY")

5. СПОРНЫЕ ФОРМУЛИРОВКИ:
   ❌ "Болезнь не форс-мажор" → может быть оспорено
   ✅ "Болезнь не является основанием для полного возврата, возможен перенос"

6. ЗАКОН О ЗАЩИТЕ ПРАВ ПОТРЕБИТЕЛЕЙ:
   - Проверь, что условия возврата НЕ ХУЖЕ, чем по закону
   - Право на отказ от услуг должно быть прописано чётко

ФОРМАТИРОВАНИЕ:
- БЕЗ Markdown (*, **, #)
- Заголовки: ЗАГЛАВНЫМИ или "Заголовок:"
- Нумерация: 1., 1.1, 1.2
- Пустая строка между разделами
- Короткие абзацы (3-5 строк максимум)

КОНКРЕТНЫЕ ТРЕБОВАНИЯ К СОДЕРЖАНИЮ:
1. ЗАДАТОК (по ст. 380-381 ГК РФ):
   - Размер: ${prepaymentAmount}
   - ОБЯЗАТЕЛЬНЫЕ формулировки:
     * "Задаток в соответствии со ст. 380-381 ГК РФ"
     * "Подтверждает заключение договора и резервирование даты"
     * "При отказе Заказчика менее чем за 7 дней - НЕ возвращается"
     * "При отказе Исполнителя - возвращается в ДВОЙНОМ размере"
     * "Стороны подтверждают, что это ЗАДАТОК, а не аванс/предоплата"
     * "Невозврат задатка компенсирует убытки (резервирование даты, отказ другим клиентам)"

2. СРОКИ ВЕЗДЕ:
   - Возврат денег: в течение 5-10 рабочих дней
   - Ответ на претензию: 10 календарных дней
   - Уведомление об отмене: за 7 дней (или другой срок)

3. КОНКРЕТНЫЕ ЗНАЧЕНИЯ:
   ${data.profileType === 'venue' ? `
   - Максимум гостей: укажи разумное число (20-50 чел в зависимости от площадки)
   - Время подготовки: 15-30 минут
   - Время уборки: 15-30 минут
   - Стоимость сверхурочных: укажи стоимость или "согласно прайсу"
   - Залог: разумная сумма (3000-10000 руб)
   - Минимальное время аренды: 2-3 часа
   - Максимальное время аренды: 6-8 часов` : ''}
   ${data.profileType === 'animator' ? `
   - Продолжительность программы: 1-3 часа
   - Количество детей: 10-20 чел
   - Минимальная площадь: 20-30 кв.м` : ''}

4. ЮРИДИЧЕСКАЯ ТОЧНОСТЬ:
   - "Исполнитель" и "Заказчик" (можно "Вы" для удобочитаемости, но в важных пунктах - термины)
   - Ссылки на ГК РФ, Закон о защите прав потребителей (но БЕЗ ст. 380!)
   - Конкретный суд: "в [Название] районном суде г. [Город]"
   - Банковские реквизиты: р/с, БИК, банк
   - Дата составления или "Оферта действует с DD.MM.YYYY"
   - Ссылка на "Политику конфиденциальности" (например: "kidspointspb.ru/privacy")

5. ИЗБЕГАЙ ПРОТИВОРЕЧИЙ:
   ❌ "Заказчик убирает" и "генеральная уборка входит в услуги"
   ✅ Чётко: "Заказчик: мусор + посуда. Исполнитель: генеральная уборка"
   
   ❌ "Это ознакомительный материал" в тексте договора
   ✅ Дисклеймер УЖЕ есть ПЕРЕД договором
   
   ❌ Пропуски [УКАЗАТЬ...]
   ✅ Конкретные значения

6. ДОПОЛНИТЕЛЬНО УКАЖИ:
   - Способ уведомления (телефон, email, письменно с уведомлением)
   - Порядок возврата залога (как, когда, куда)
   - Акт приема-передачи имущества (если залог)
   - Прайс на имущество (ссылка или приложение)

НАЧНИ ДОГОВОР С ДИСКЛЕЙМЕРА:

⚠️ ВАЖНОЕ ЮРИДИЧЕСКОЕ УВЕДОМЛЕНИЕ

Данный договор сгенерирован автоматически и является ОЗНАКОМИТЕЛЬНЫМ МАТЕРИАЛОМ.
Он НЕ ЯВЛЯЕТСЯ юридическим документом и носит рекомендательный характер.

Перед использованием в коммерческой деятельности ОБЯЗАТЕЛЬНО проконсультируйтесь 
с квалифицированным юристом для проверки соответствия законодательству РФ 
и адаптации под вашу специфику.

Платформа ZumZam не несёт ответственности за юридические последствия 
использования данного договора.

========================================


ДОГОВОР ОФЕРТЫ
(условия оказания услуг)

Затем создай простой, понятный и дружелюбный договор.

ПЕРЕД ВЫДАЧЕЙ ПРОВЕРЬ:
✓ НЕ написал "это ознакомительный материал" В САМОМ договоре
✓ Использовал "ЗАДАТОК по ст. 380-381 ГК РФ" (не аванс, не предоплата!)
✓ Прописал ДВОЙНОЙ возврат при отказе Исполнителя
✓ Прописал невозврат при отказе Заказчика менее 7 дней
✓ Добавил фразу "Стороны подтверждают, что это ЗАДАТОК, а не аванс"
✓ Указал, что невозврат компенсирует убытки
✓ НЕТ противоречий (уборка, возврат, сроки)
✓ Все сроки конкретные (10 дней, 7 дней, и т.д.)
✓ Нет пропусков [УКАЗАТЬ...]
✓ Банковские реквизиты (р/с, БИК, банк)
✓ Ссылка на Политику конфиденциальности
✓ Дата оферты
✓ Способы уведомления
✓ Порядок возврата залога
✓ Конкретный суд

Если находишь ошибку - ИСПРАВЬ ДО ВЫДАЧИ!
`.trim()

    const result = await this.generateText(prompt, { temperature: 0.2, max_tokens: 8192 })
    
    if (!result) return 'Ошибка генерации договора'
    
    // Очищаем Markdown форматирование
    let cleanText = result
      .replace(/^###\s+(.+)$/gm, '$1')  // Убираем ### заголовки
      .replace(/^##\s+(.+)$/gm, '$1')   // Убираем ## заголовки
      .replace(/^#\s+(.+)$/gm, '$1')    // Убираем # заголовки
      .replace(/\*\*(.+?)\*\*/g, '$1')  // Убираем **жирный**
      .replace(/\*(.+?)\*/g, '$1')      // Убираем *курсив*
      .replace(/^[\s]*[-*]\s+/gm, '')   // Убираем маркеры списков
    
    console.log('[AIService] Generated agreement length:', cleanText.length)
    
    return cleanText
  }

  /**
   * Генерация правил бронирования
   */
  async generateBookingRules(data: {
    companyName: string
    phone?: string
    email?: string
    website?: string
    profileType: 'venue' | 'animator' | 'show' | 'other'
    minBookingTime?: string
    cancellationDeadline?: string
    prepaymentRequired?: boolean
    prepaymentAmount?: string
    refundPolicy?: string
    additionalRules?: string
  }): Promise<string> {
    const companyName = data.companyName || '[НАЗВАНИЕ КОМПАНИИ]'
    const phone = data.phone || '[ТЕЛЕФОН]'
    const email = data.email || '[EMAIL]'
    const website = data.website || '[САЙТ]'

    const prompt = `
Создай правила бронирования для клиентов.

ВАЖНО: Используй точные данные, которые я указал. Не меняй их формат.

Информация:
- Компания: ${companyName}
- Тип услуг: ${data.profileType === 'venue' ? 'аренда площадки' : data.profileType === 'animator' ? 'услуги аниматора' : 'организация праздников'}
- Контакты: телефон ${phone}, email ${email}, сайт ${website}
${data.minBookingTime ? `- Минимальный срок бронирования: ${data.minBookingTime}` : ''}
${data.cancellationDeadline ? `- Срок отмены без штрафа: ${data.cancellationDeadline}` : ''}
${data.prepaymentRequired ? `- Предоплата обязательна: ${data.prepaymentAmount || 'да'}` : '- Предоплата: по согласованию'}
${data.refundPolicy ? `- Политика возврата: ${data.refundPolicy}` : ''}
${data.additionalRules ? `- Дополнительные правила: ${data.additionalRules}` : ''}

Требования:
1. Четкая структура с пунктами
2. Понятный язык для клиентов
3. Все условия бронирования
4. Условия отмены и возврата
5. В конце укажи контактную информацию: телефон ${phone}, email ${email}, сайт ${website}

Создай правила бронирования в формате для публикации на сайте.
`.trim()

    const result = await this.generateText(prompt, { temperature: 0.4, max_tokens: 2048 })
    return result || 'Ошибка генерации правил'
  }

  /**
   * Перефразирование текста с сохранением юридического смысла
   */
  async rewriteText(text: string): Promise<string> {
    const prompt = `
Перефразируй следующий текст договора, сохранив юридический смысл и структуру.
Используй синонимы и другие формулировки, но не меняй суть.

Исходный текст:
${text}

Требования:
- Сохрани юридическую силу формулировок
- Используй синонимы и перефразирование
- НЕ используй Markdown (*, **, #)
- Верни только перефразированный текст без пояснений

Перефразированный текст:
`.trim()

    const result = await this.generateText(prompt, { temperature: 0.5, max_tokens: 2048 })
    return result || text
  }

  /**
   * Упрощение юридического текста
   */
  async simplifyText(text: string): Promise<string> {
    const prompt = `
Упрости следующий юридический текст, сделай его понятнее для обычного человека.
Убери сложные юридические термины, замени на простые слова.

Исходный текст:
${text}

Требования:
- Используй простые, понятные слова
- Сохрани основной смысл
- Убери канцелярит и сложные обороты
- НЕ используй Markdown (*, **, #)
- Верни только упрощенный текст без пояснений

Упрощенный текст:
`.trim()

    const result = await this.generateText(prompt, { temperature: 0.6, max_tokens: 2048 })
    return result || text
  }

  /**
   * Дополнение и расширение текста
   */
  async expandText(text: string): Promise<string> {
    const prompt = `
Дополни и расширь следующий пункт договора.
Добавь важные детали, уточнения и подпункты, которые сделают текст более полным.

Исходный текст:
${text}

Требования:
- Добавь важные детали и уточнения
- Расширь формулировки, сделай их более конкретными
- Сохрани юридическую корректность
- Добавь подпункты, если нужно
- НЕ используй Markdown (*, **, #)
- Верни только расширенный текст без пояснений

Расширенный текст:
`.trim()

    const result = await this.generateText(prompt, { temperature: 0.4, max_tokens: 3000 })
    return result || text
  }

  /**
   * Проверка текста на юридические ошибки
   */
  async checkLegalText(text: string): Promise<string> {
    const prompt = `
Проверь следующий текст договора на юридические ошибки и несоответствия.

Текст для проверки:
${text}

Что нужно проверить:
1. Юридическая корректность формулировок
2. Логические несоответствия и противоречия
3. Пропущенные важные пункты
4. Неоднозначные формулировки
5. Соответствие законодательству РФ

Формат ответа:
- Если ошибок нет: "✅ Текст юридически корректен."
- Если есть замечания: список по пунктам с рекомендациями

Проверка:
`.trim()

    const result = await this.generateText(prompt, { temperature: 0.3, max_tokens: 2048 })
    return result || '✅ Проверка не выполнена. Попробуйте снова.'
  }

  /**
   * Кастомное редактирование текста по инструкции
   */
  async customTextEdit(text: string, instruction: string): Promise<string> {
    const prompt = `
Отредактируй следующий текст договора согласно инструкции пользователя.

Исходный текст:
${text}

Инструкция пользователя:
${instruction}

Требования:
- Выполни точно то, что просит пользователь
- Сохрани юридическую корректность
- НЕ используй Markdown (*, **, #)
- Верни только отредактированный текст без пояснений

Результат:
`.trim()

    const result = await this.generateText(prompt, { temperature: 0.5, max_tokens: 3000 })
    return result || text
  }
  
  /**
   * Генерация договора оферты на основе данных анкеты
   */
  async generateOfferAgreement(data: any): Promise<string> {
    console.log('[AIService] Generating offer agreement with data:', data)
    
    // Продолжение следует - большой промпт будет добавлен
    const prompt = this.buildOfferAgreementPrompt(data)
    const result = await this.generateText(prompt, { 
      temperature: 0.2, 
      maxTokens: 8192 
    })
    
    if (!result) {
      throw new Error('AI не смог сгенерировать договор')
    }
    
    return this.cleanMarkdown(result)
  }
  
  /**
   * Генерация правил бронирования
   */
  async generateBookingRules(data: any): Promise<string> {
    console.log('[AIService] Generating booking rules with data:', data)
    
    const prompt = this.buildBookingRulesPrompt(data)
    const result = await this.generateText(prompt, { 
      temperature: 0.3, 
      maxTokens: 4096 
    })
    
    if (!result) {
      throw new Error('AI не смог сгенерировать правила')
    }
    
    return this.cleanMarkdown(result)
  }
  
  /**
   * Построение промпта для договора оферты
   */
  private buildOfferAgreementPrompt(data: any): string {
    const {
      // Юридические данные
      company_name,
      legal_form,
      inn,
      ogrn,
      legal_address,
      director_name,
      phone,
      email,
      website,
      bank_account,
      bank_name,
      bank_bik,
      bank_corr_account,
      city,
      
      // Условия
      cancellation_policy_days,
      cancellation_policy_days_custom,
      partial_refund_days,
      deposit_amount,
      full_payment_deadline,
      late_arrival_policy,
      illness_policy,
      
      // Для площадок
      max_guests,
      preparation_time,
      cleanup_time,
      overtime_cost,
      min_rental_hours,
      max_rental_hours,
      security_deposit,
      cleanup_fee,
      cleanup_responsibilities,
      prohibited_items,
      
      // Тип профиля
      profileType,
    } = data
    
    // Определяем полный срок отмены
    const fullRefundDays = cancellation_policy_days === 'custom' 
      ? cancellation_policy_days_custom 
      : cancellation_policy_days
    
    // Форматируем правовую форму
    const legalFormText = {
      'private': 'Физическое лицо',
      'self_employed': 'Самозанятый',
      'ip': 'Индивидуальный предприниматель',
      'ooo': 'Общество с ограниченной ответственностью'
    }[legal_form] || 'Физическое лицо'
    
    // Формируем данные организации
    let organizationData = `${company_name}, ${legalFormText}`
    if (inn) organizationData += `, ИНН ${inn}`
    if (ogrn && legal_form !== 'self_employed') organizationData += `, ОГРН ${ogrn}`
    if (legal_address) organizationData += `, адрес: ${legal_address}`
    if (director_name && (legal_form === 'ip' || legal_form === 'ooo')) {
      organizationData += legal_form === 'ooo' 
        ? `, в лице директора ${director_name}` 
        : ` (${director_name})`
    }
    
    // Особенности задатка в зависимости от юр.формы
    let depositInstructions = ''
    if (legal_form === 'ip' || legal_form === 'ooo') {
      depositInstructions = `
✅ КРИТИЧЕСКИ ВАЖНО для ИП/ООО:
- Задаток вносится ТОЛЬКО путем безналичного перевода на расчетный счет Исполнителя
- В договоре ОБЯЗАТЕЛЬНО указать банковские реквизиты:
  Расчетный счет: ${bank_account || '[УКАЗАТЬ СЧЕТ]'}
  Банк: ${bank_name || '[УКАЗАТЬ БАНК]'}
  БИК: ${bank_bik || '[УКАЗАТЬ БИК]'}
  Корр. счет: ${bank_corr_account || '[УКАЗАТЬ КОРР.СЧЕТ]'}
- Запрещены наличные платежи и переводы на карту физлица
- Задаток считается внесенным с момента зачисления на расчетный счет
`
    } else {
      depositInstructions = `
Для ${legalFormText}:
- Задаток может быть внесен наличными или переводом на карту
- Укажи в договоре телефон для связи: ${phone}
- Задаток считается внесенным с момента получения денежных средств
`
    }

    const prompt = `Ты — профессиональный юрист, специализирующийся на договорах в сфере детских развлечений и мероприятий.

Твоя задача: сгенерировать ЮРИДИЧЕСКИ КОРРЕКТНЫЙ, но при этом ПОНЯТНЫЙ и ДРУЖЕЛЮБНЫЙ договор публичной оферты.

📋 ИСХОДНЫЕ ДАННЫЕ:

Исполнитель: ${organizationData}
Тип услуг: ${profileType === 'venue' ? 'Аренда площадки для детских мероприятий' : profileType === 'animator' ? 'Услуги аниматора' : profileType === 'show' ? 'Шоу-программа' : 'Организация мероприятий'}
Контакты: ${phone}${email ? `, ${email}` : ''}${website ? `, ${website}` : ''}
Город (юрисдикция): ${city || 'Москва'}

${depositInstructions}

💰 УСЛОВИЯ ЗАДАТКА (по ст. 380-381 ГК РФ):
- Размер задатка: ${deposit_amount} руб.
- Это именно ЗАДАТОК (не аванс, не предоплата!)
- Функции задатка:
  1) Обеспечительная (блокирует дату)
  2) Доказательственная (подтверждает заключение договора)
  3) Штрафная (санкции за отказ)

⚖️ ЮРИДИЧЕСКИ КОРРЕКТНЫЕ ФОРМУЛИРОВКИ ЗАДАТКА:

1. "Уплаченная Заказчиком сумма является ЗАДАТКОМ в смысле статей 380-381 ГК РФ"
2. "При отказе Заказчика от исполнения договора менее чем за ${fullRefundDays} дней, задаток остается у Исполнителя в качестве компенсации за:
   - Блокировку даты и отказ другим клиентам
   - Подготовительные работы
   - Упущенную выгоду"
3. "При отказе Исполнителя от исполнения договора, он обязан вернуть задаток в ДВОЙНОМ размере (${deposit_amount * 2} руб.)"
4. "При отмене за ${fullRefundDays}+ дней, задаток возвращается полностью (или минус фактические расходы до 10%)"

${partial_refund_days !== 'none' ? `5. "При отмене за ${partial_refund_days}, возвращается 50% задатка"` : ''}

⏰ СРОКИ ОПЛАТЫ:
- Задаток: при бронировании
- Полная оплата: ${full_payment_deadline === 'day_of' ? 'в день мероприятия' : full_payment_deadline === '1_day' ? 'за 1 день' : full_payment_deadline === '3_days' ? 'за 3 дня' : 'за 7 дней'} до начала

${profileType === 'venue' ? `
🏠 УСЛОВИЯ АРЕНДЫ ПЛОЩАДКИ:
- Максимум гостей: ${max_guests} человек (дети + взрослые)
- Минимальное время аренды: ${min_rental_hours} ч
- Максимальное время аренды: ${max_rental_hours} ч
- Время на подготовку: ${preparation_time} мин (включено в аренду)
- Время на уборку: ${cleanup_time} мин (включено в аренду)
- Стоимость сверхурочного времени: ${overtime_cost} руб за каждые 30 минут
- Залог за сохранность имущества: ${security_deposit} руб (возвращается после проверки)
- Стоимость дополнительной уборки: ${cleanup_fee} руб (при сильном загрязнении)

🧹 ОБЯЗАННОСТИ ЗАКАЗЧИКА ПО УБОРКЕ:
${cleanup_responsibilities === 'trash_dishes' ? '- Вынести мусор в мусорные баки\n- Помыть использованную посуду\n- Оставить помещение в чистом виде' : cleanup_responsibilities === 'trash_only' ? '- Вынести мусор в мусорные баки\n- Генеральная уборка на стороне Исполнителя' : '- Генеральная уборка полностью на стороне Исполнителя\n- Заказчик освобождается от уборки'}

🚫 ЗАПРЕЩЕНО НА ПЛОЩАДКЕ:
${prohibited_items || 'Свечи и открытый огонь, конфетти и серпантин, торты с блестками и декоративными посыпками, алкогольные напитки'}

❗ ОТВЕТСТВЕННОСТЬ ЗА ПОВРЕЖДЕНИЯ:
- За повреждение имущества Заказчик возмещает ущерб в размере рыночной стоимости (не по прайсу!)
- Рыночная стоимость определяется на основе средних цен на аналогичные товары
- Из залога вычитается сумма ущерба, остаток возвращается
` : ''}

⏱️ ОПОЗДАНИЕ ЗАКАЗЧИКА:
${late_arrival_policy === 'time_reduced' ? 'Время мероприятия сокращается на время опоздания, стоимость не меняется' : late_arrival_policy === 'extra_charge' ? 'Возможно продление за дополнительную плату (по наличию)' : 'Опоздание не компенсируется, возврат денег невозможен'}

🤒 ПОЛИТИКА ПРИ БОЛЕЗНИ:
${illness_policy === 'no_refund_can_reschedule' ? 'Болезнь НЕ является форс-мажором. Возврат денег невозможен, но можно перенести дату по согласованию' : illness_policy === 'medical_cert' ? 'Перенос возможен при предоставлении медицинской справки в течение 3 дней' : illness_policy === 'partial_refund' ? 'Возврат 50% при предоставлении медицинской справки' : 'Возврат и перенос невозможны'}

⚖️ РАЗРЕШЕНИЕ СПОРОВ:
Все споры подлежат рассмотрению в суде по месту нахождения Исполнителя (${city || 'указать город'}).

📝 ТРЕБОВАНИЯ К СТИЛЮ ДОГОВОРА:

1. ✅ ЮРИДИЧЕСКАЯ КОРРЕКТНОСТЬ:
   - Все формулировки должны соответствовать ГК РФ
   - Особенно важно: правильное оформление задатка (ст. 380-381)
   - Указание ответственности сторон
   - Порядок разрешения споров

2. ✅ ДРУЖЕЛЮБНОСТЬ И ПОНЯТНОСТЬ:
   - Избегай канцелярита ("в связи с вышеизложенным", "надлежащим образом")
   - Пиши короткими предложениями (не более 2 строк)
   - Используй понятные слова вместо юридических терминов где возможно
   - Структурируй текст списками и пунктами
   - Добавляй подзаголовки для разделов

3. ❌ ЧЕГО ИЗБЕГАТЬ:
   - НЕ пиши "возврат в течение 5 дней" (пользователь сам указал сроки!)
   - НЕ используй слова "аванс", "предоплата" вместо "задаток"
   - НЕ добавляй markdown форматирование (##, **, * и т.д.)
   - НЕ добавляй дисклеймер о консультации с юристом (он уже есть в интерфейсе)

📋 СТРУКТУРА ДОГОВОРА:

1. ЗАГОЛОВОК
   "ДОГОВОР ПУБЛИЧНОЙ ОФЕРТЫ
   на оказание услуг [тип услуг]"

2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ
   Кратко объясни основные понятия понятным языком

3. ПРЕДМЕТ ДОГОВОРА
   Что именно предоставляет Исполнитель

4. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ
   Включи:
   - Порядок внесения задатка (с реквизитами для ИП/ООО)
   - Формулировки из раздела "ЗАДАТОК" выше
   - Сроки полной оплаты

5. ПРАВА И ОБЯЗАННОСТИ СТОРОН
   Понятно и структурированно

6. ПОРЯДОК ОТМЕНЫ И ВОЗВРАТА СРЕДСТВ
   По условиям выше, с акцентом на задаток

7. ОТВЕТСТВЕННОСТЬ СТОРОН
   ${profileType === 'venue' ? 'Включая ответственность за повреждения по рыночной стоимости' : 'Санкции за нарушение обязательств'}

8. ФОРС-МАЖОР
   С указанием что болезнь не является форс-мажором

9. РАЗРЕШЕНИЕ СПОРОВ
   Подсудность: ${city || 'указать город'}

10. КОНТАКТЫ ИСПОЛНИТЕЛЯ
    ${phone}${email ? `, ${email}` : ''}${website ? `, ${website}` : ''}

11. ДАТА ОФЕРТЫ И АКЦЕПТ
    Объясни что бронирование = акцепт оферты

Сгенерируй договор ПРЯМО СЕЙЧАС. Текст договора должен быть:
- Юридически корректным
- Понятным для родителей
- Без markdown форматирования
- С правильными формулировками задатка
- С учетом всех указанных условий

ДОГОВОР:`

    return prompt.trim()
  }
  
  /**
   * Построение промпта для правил бронирования
   */
  private buildBookingRulesPrompt(data: any): string {
    const {
      company_name,
      phone,
      email,
      website,
      cancellation_policy_days,
      cancellation_policy_days_custom,
      partial_refund_days,
      deposit_amount,
      full_payment_deadline,
      late_arrival_policy,
      illness_policy,
      max_guests,
      preparation_time,
      cleanup_time,
      min_rental_hours,
      max_rental_hours,
      prohibited_items,
      cleanup_responsibilities,
      profileType,
    } = data
    
    const fullRefundDays = cancellation_policy_days === 'custom' 
      ? cancellation_policy_days_custom 
      : cancellation_policy_days

    const prompt = `Сгенерируй КРАТКИЕ и ПОНЯТНЫЕ правила бронирования для ${company_name}.

Тип услуг: ${profileType === 'venue' ? 'Аренда площадки' : profileType === 'animator' ? 'Аниматор' : 'Шоу-программа'}

Включи следующие разделы:

1. КАК ЗАБРОНИРОВАТЬ
   - Выбрать дату и время
   - Внести задаток ${deposit_amount} руб
   - Получить подтверждение

2. УСЛОВИЯ ОТМЕНЫ
   - За ${fullRefundDays}+ дней: возврат 100%
   ${partial_refund_days !== 'none' ? `- За ${partial_refund_days}: возврат 50%` : ''}
   - Менее ${fullRefundDays} дней: задаток не возвращается

3. ОПЛАТА
   - Задаток: при бронировании
   - Остаток: ${full_payment_deadline === 'day_of' ? 'в день мероприятия' : `за ${full_payment_deadline.replace('_day', ' день').replace('_days', ' дня')}`}

${profileType === 'venue' ? `
4. ПРАВИЛА НА ПЛОЩАДКЕ
   - Максимум гостей: ${max_guests}
   - Время аренды: ${min_rental_hours}-${max_rental_hours} ч
   - Подготовка/уборка: ${preparation_time}/${cleanup_time} мин
   - Запрещено: ${prohibited_items || 'Свечи, конфетти, блестки, алкоголь'}
   - После мероприятия: ${cleanup_responsibilities === 'trash_dishes' ? 'Вынести мусор, помыть посуду' : cleanup_responsibilities === 'trash_only' ? 'Вынести мусор' : 'Уборка на нас'}
` : ''}

5. ВАЖНО ЗНАТЬ
   - Опоздание: ${late_arrival_policy === 'time_reduced' ? 'Время сокращается' : 'Доплата за продление'}
   - Болезнь: ${illness_policy === 'no_refund_can_reschedule' ? 'Можно перенести дату' : 'Возврат невозможен'}

6. КОНТАКТЫ
   ${phone}${email ? `, ${email}` : ''}${website ? `, ${website}` : ''}

Стиль: дружелюбный, без канцелярита, короткие предложения.
БЕЗ markdown форматирования!

ПРАВИЛА:`

    return prompt.trim()
  }

  /**
   * Очистка Markdown форматирования из текста
   */
  private cleanMarkdown(text: string): string {
    if (!text) return ''
    
    // Удаляем заголовки Markdown (#, ##, ###)
    let cleanedText = text.replace(/^#+\s*(.*)$/gm, '$1')
    // Удаляем жирный текст Markdown (**)
    cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '$1')
    // Удаляем курсив Markdown (*)
    cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1')
    // Удаляем списки Markdown (- )
    cleanedText = cleanedText.replace(/^[-*]\s+/gm, '')
    // Удаляем лишние пустые строки
    cleanedText = cleanedText.replace(/\n\s*\n\s*\n/g, '\n\n')
    return cleanedText.trim()
  }

  /**
   * Генерация договора оферты
   */
  async generateOfferAgreement(data: any): Promise<string> {
    const legalFormText = data.legal_form === 'private' ? 'Физическое лицо' 
      : data.legal_form === 'ip' ? 'ИП' 
      : data.legal_form === 'ooo' ? 'ООО' 
      : 'Самозанятый'
    
    const serviceTypeText = data.profileType === 'venue' ? 'Аренда площадки для детских мероприятий'
      : data.profileType === 'animator' ? 'Анимационные услуги на детских праздниках'
      : data.profileType === 'show' ? 'Шоу-программа для детей'
      : 'Организация детских мероприятий'
    
    // Данные о компании/исполнителе
    const organizationInfo = `
ИСПОЛНИТЕЛЬ:
- Наименование: ${data.company_name || '[УКАЖИТЕ НАЗВАНИЕ]'}
- Правовая форма: ${legalFormText}
${data.inn ? `- ИНН: ${data.inn}` : ''}
${data.ogrn ? `- ОГРН: ${data.ogrn}` : ''}
${data.legal_address ? `- Адрес: ${data.legal_address}` : ''}
${data.director_name ? `- Руководитель/ИП: ${data.director_name}` : ''}
- Телефон: ${data.phone || '[УКАЖИТЕ ТЕЛЕФОН]'}
- Email: ${data.email || '[УКАЖИТЕ EMAIL]'}
${data.website ? `- Сайт: ${data.website}` : ''}
${data.bank_account ? `- Расчётный счёт: ${data.bank_account}` : ''}
${data.bank_name ? `- Банк: ${data.bank_name}` : ''}
${data.bank_bik ? `- БИК: ${data.bank_bik}` : ''}
${data.bank_corr_account ? `- Корр. счёт: ${data.bank_corr_account}` : ''}`

    // Условия оплаты и отмены
    const fullRefundDays = data.cancellation_policy_days === 'custom' 
      ? data.cancellation_policy_days_custom 
      : data.cancellation_policy_days
    
    const partialRefundText = data.partial_refund_days === 'none' ? 'Частичный возврат не предусмотрен'
      : data.partial_refund_days === 'custom' ? `Частичный возврат (50%): ${data.partial_refund_days_custom_value || '[УКАЖИТЕ]'}`
      : data.partial_refund_days !== 'none' ? `Частичный возврат (50%): за ${data.partial_refund_days} до мероприятия`
      : 'Частичный возврат не предусмотрен'
    
    const paymentDeadlineText = data.full_payment_deadline === 'custom' 
      ? (data.full_payment_deadline_custom_value || '[УКАЖИТЕ]')
      : data.full_payment_deadline === 'day_of' ? 'в день мероприятия'
      : data.full_payment_deadline === '1_day' ? 'за 1 день'
      : data.full_payment_deadline === '3_days' ? 'за 3 дня'
      : data.full_payment_deadline === '7_days' ? 'за 7 дней'
      : '[УКАЖИТЕ]'

    // Venue-специфичные данные
    const venueDetails = data.profileType === 'venue' ? `
УСЛОВИЯ АРЕНДЫ ПЛОЩАДКИ:
- Максимум гостей: ${data.max_guests || '[УКАЖИТЕ]'} человек
- Время подготовки: ${data.preparation_time === 'custom' ? (data.preparation_time_custom_value || data.preparation_time) : data.preparation_time || '[УКАЖИТЕ]'} минут
- Время уборки: ${data.cleanup_time === 'custom' ? (data.cleanup_time_custom_value || data.cleanup_time) : data.cleanup_time || '[УКАЖИТЕ]'} минут
- Минимальное время аренды: ${data.min_rental_hours || '[УКАЖИТЕ]'} часов
- Максимальное время аренды: ${data.max_rental_hours || '[УКАЖИТЕ]'} часов
${data.overtime_cost ? `- Стоимость сверхурочного времени: ${data.overtime_cost} руб за 30 мин` : ''}
${data.security_deposit ? `- Залог за сохранность: ${data.security_deposit} руб` : ''}
${data.cleanup_fee ? `- Доп. уборка при загрязнении: ${data.cleanup_fee} руб` : ''}
- Обязанности клиента: ${data.cleanup_responsibilities === 'trash_dishes' ? 'вынести мусор, помыть посуду' 
    : data.cleanup_responsibilities === 'trash_only' ? 'вынести мусор' 
    : 'генеральная уборка на нас'}
- Запрещено: ${data.prohibited_items || 'свечи, конфетти, блестки'}
${data.decoration_policy ? `- Украшение площадки: ${data.decoration_policy === 'custom' ? data.decoration_policy_custom_value : data.decoration_policy}` : ''}
${data.catering_policy ? `- Еда и напитки: ${data.catering_policy === 'custom' ? data.catering_policy_custom_value : data.catering_policy}` : ''}
${data.music_policy ? `- Музыкальное оборудование: ${data.music_policy === 'custom' ? data.music_policy_custom_value : data.music_policy}` : ''}
${data.damage_policy ? `- Возмещение ущерба: ${data.damage_policy}` : ''}
${data.parent_supervision ? `- Присутствие родителей: ${data.parent_supervision === 'custom' ? data.parent_supervision_custom_value : data.parent_supervision}` : ''}
${data.age_restrictions ? `- Возрастные ограничения: ${data.age_restrictions}` : ''}
${data.special_needs_policy ? `- Для детей с особыми потребностями: ${data.special_needs_policy}` : ''}
${data.emergency_contact ? `- Экстренный контакт: ${data.emergency_contact}` : ''}
${data.insurance_policy === 'yes' ? '- Имеется страхование ответственности' : ''}` : ''

    const prompt = `Сгенерируй ПОДРОБНЫЙ договор оферты на оказание услуг.

Тип услуг: ${serviceTypeText}

${organizationInfo}

УСЛОВИЯ ОПЛАТЫ:
- Задаток: ${data.deposit_amount || '[УКАЖИТЕ]'} руб (вносится при бронировании)
- Полная оплата: ${paymentDeadlineText} до мероприятия
- Город (подсудность): ${data.city || '[УКАЖИТЕ ГОРОД]'}

УСЛОВИЯ ОТМЕНЫ:
- Полный возврат задатка: за ${fullRefundDays || '7'} дней до мероприятия
- ${partialRefundText}
- Менее ${fullRefundDays || '7'} дней: задаток не возвращается

ПОЛИТИКА ПРИ ОПОЗДАНИИ КЛИЕНТА:
${data.late_arrival_policy === 'not_applicable' ? 'Не применимо'
  : data.late_arrival_policy === 'time_reduced' ? 'Время мероприятия сокращается на время опоздания, стоимость не меняется'
  : data.late_arrival_policy === 'extra_charge' ? 'Можно продлить время за дополнительную плату'
  : 'Опоздание не компенсируется, возврат невозможен'}

ПОЛИТИКА ПРИ БОЛЕЗНИ:
${data.illness_policy === 'not_applicable' ? 'Не применимо'
  : data.illness_policy === 'no_refund_can_reschedule' ? 'Возврат невозможен, но можно перенести дату по согласованию'
  : data.illness_policy === 'medical_cert' ? 'Перенос возможен при наличии медицинской справки'
  : data.illness_policy === 'partial_refund' ? 'Частичный возврат 50%'
  : 'Возврат и перенос невозможны'}

${venueDetails}

${data.profileType === 'animator' ? `
УСЛОВИЯ ДЛЯ АНИМАТОРА:
- Длительность программы: от ${data.program_duration_min || '[УКАЖИТЕ]'} до ${data.program_duration_max || '[УКАЖИТЕ]'} часов
- Количество детей: от ${data.kids_count_min || '[УКАЖИТЕ]'} до ${data.kids_count_max || '[УКАЖИТЕ]'} человек
${data.min_space_area ? `- Минимальная площадь помещения: ${data.min_space_area} кв.м` : ''}
${data.replacement_policy ? `- При болезни аниматора: ${data.replacement_policy}` : ''}
${data.parents_presence ? `- Присутствие родителей: ${data.parents_presence}` : ''}
${data.program_type ? `- Тип программы: ${data.program_type === 'custom' ? data.program_type_custom_value : data.program_type}` : ''}
${data.costume_included ? `- Костюм: ${data.costume_included}` : ''}
${data.props_included ? `- Реквизит: ${data.props_included}` : ''}
${data.additional_animator_cost ? `- Дополнительный аниматор: ${data.additional_animator_cost} руб/час` : ''}
${data.travel_distance_included ? `- Бесплатный радиус выезда: ${data.travel_distance_included} км` : ''}
${data.travel_cost_per_km ? `- Выезд за пределы радиуса: ${data.travel_cost_per_km} руб/км` : ''}
${data.program_customization ? `- Индивидуальная программа: ${data.program_customization}` : ''}
${data.photo_video_policy ? `- Фото/видеосъемка: ${data.photo_video_policy}` : ''}
` : ''}

${data.profileType === 'show' ? `
УСЛОВИЯ ДЛЯ ШОУ-ПРОГРАММЫ:
- Длительность выступления: ${data.performance_duration || '[УКАЖИТЕ]'} минут
${data.soundcheck_time ? `- Время на саундчек: ${data.soundcheck_time} минут` : ''}
- Технические требования: ${data.technical_requirements || '[УКАЖИТЕ]'}
${data.artist_replacement ? `- Замена артистов: ${data.artist_replacement}` : ''}
${data.show_type ? `- Тип шоу: ${data.show_type === 'custom' ? data.show_type_custom_value : data.show_type}` : ''}
${data.audience_size_min ? `- Мин. зрителей: ${data.audience_size_min}` : ''}
${data.audience_size_max ? `- Макс. зрителей: ${data.audience_size_max}` : ''}
${data.outdoor_performance ? `- Выступление на улице: ${data.outdoor_performance}` : ''}
${data.equipment_transport ? `- Транспортировка оборудования: ${data.equipment_transport}` : ''}
${data.setup_assistance_required ? `- Помощь в установке: ${data.setup_assistance_required}` : ''}
${data.recording_policy ? `- Видеозапись: ${data.recording_policy}` : ''}
` : ''}

${data.profileType === 'agency' ? `
УСЛОВИЯ ДЛЯ АГЕНТСТВА:
- Предоставляемые услуги: ${data.services_included || '[УКАЖИТЕ]'}
${data.variants_count ? `- Количество вариантов на выбор: ${data.variants_count}` : ''}
${data.changes_deadline ? `- Бесплатные изменения: за ${data.changes_deadline} дней` : ''}
- Комиссия агентства: ${data.agency_commission === 'custom' ? data.agency_commission_custom_value : data.agency_commission || '[УКАЖИТЕ]'}
${data.consultation_included ? `- Предварительная консультация: ${data.consultation_included}` : ''}
${data.contract_with ? `- Договоры: ${data.contract_with}` : ''}
${data.payment_schedule ? `- График оплаты: ${data.payment_schedule}` : ''}
${data.coordinator_presence ? `- Координатор на мероприятии: ${data.coordinator_presence}` : ''}
${data.emergency_backup ? `- Резервные исполнители: ${data.emergency_backup}` : ''}
${data.package_deals ? `- Пакетные предложения: ${data.package_deals}` : ''}
` : ''}

ТРЕБОВАНИЯ К ДОГОВОРУ:
1. Используй ВСЕ указанные выше данные
2. НЕ оставляй плейсхолдеры типа "[УКАЖИТЕ]" - замени их на реальные значения из данных
3. Структура: Предмет договора, Стоимость и оплата, Права и обязанности сторон, Условия отмены, Ответственность, Реквизиты
4. Стиль: простой, понятный, без сложного канцелярита
5. БЕЗ markdown форматирования (без *, #, -, etc)

ВАЖНО: Если какие-то данные отмечены как "[УКАЖИТЕ]" - это значит они НЕ заполнены в анкете. В таком случае используй типовую формулировку без конкретной цифры.`

    const result = await this.generateText(prompt, { temperature: 0.3, maxTokens: 4096 })
    return this.cleanMarkdown(result || '')
  }

  /**
   * Генерация правил бронирования
   */
  async generateBookingRules(data: any): Promise<string> {
    const prompt = `Сгенерируй краткие правила бронирования для ${data.company_name || 'компании'}.

Тип услуг: ${data.profileType === 'venue' ? 'Аренда площадки' : data.profileType === 'animator' ? 'Аниматор' : 'Шоу-программа'}

Включи:
1. Как забронировать (внести задаток ${data.deposit_amount || '5000'} руб)
2. Условия отмены (за ${data.cancellation_policy_days || '7'} дней - возврат 100%)
3. Оплата
4. Важные правила
5. Контакты: ${data.phone || ''}, ${data.email || ''}

Стиль: дружелюбный, короткие предложения.
БЕЗ markdown форматирования!`

    const result = await this.generateText(prompt, { temperature: 0.5, maxTokens: 2048 })
    return this.cleanMarkdown(result || '')
  }
}

// Экспортируем singleton instance
export const aiService = AIService.getInstance()

