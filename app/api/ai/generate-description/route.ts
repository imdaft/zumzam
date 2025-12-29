import { NextResponse } from 'next/server'
import { aiService, AIServiceError } from '@/lib/services/ai-service'

export const dynamic = 'force-dynamic'

interface GenerateDescriptionRequest {
  type: 'short' | 'long'
  profileName: string
  category: string // Площадка, Аниматор, Шоу и т.д.
  subtype?: string // Тип площадки (Лофт, Детский центр), тип шоу и т.д.
  currentText?: string // Текущий текст
  mode?: 'generate' | 'rephrase' | 'simplify' | 'shorten' | 'expand' | 'continue' | 'improve' | 'custom' // Режим работы
  customPrompt?: string // Кастомная инструкция от пользователя
  existingData?: {
    shortDescription?: string
    longDescription?: string
  }
}

export async function POST(request: Request) {
  try {
    const body: GenerateDescriptionRequest = await request.json()
    const { type, profileName, category, subtype, currentText, mode = 'generate', customPrompt, existingData } = body

    if (!profileName || !category) {
      return NextResponse.json(
        { error: 'Не указано название профиля или категория' },
        { status: 400 }
      )
    }

    // Формируем контекст для AI (ТОЛЬКО тип и подтип)
    let context = `Название: ${profileName}\nКатегория: ${category}\n`
    
    // Добавляем подтип (тип площадки, тип шоу и т.д.) - это важно!
    if (subtype) {
      const subtypeLabel = category === 'venue' ? 'Тип площадки' : 
                          category === 'show' ? 'Тип шоу' : 
                          category === 'quest' ? 'Тип квеста' : 
                          'Тип'
      context += `${subtypeLabel}: ${subtype}\n`
    }

    // Получаем текущий текст
    const text = currentText || (type === 'short' ? existingData?.shortDescription : existingData?.longDescription)
    const hasText = text && text.trim().length > 0
    
    // Формируем промпт в зависимости от режима и типа
    let prompt = ''
    
    // Базовые требования
    const baseRequirements = type === 'short' 
      ? `- Максимум 1-2 предложения, не более 120 символов
- Лаконичное и цепляющее
- Без вводных слов и штампов`
      : `- СТРОГО ОДИН сплошной абзац (без переносов!)
- Максимум 500 символов
- Естественный, живой язык
- БЕЗ шаблонных фраз ("индивидуальный подход", "широкий спектр")
- Фокус на эмоциях и пользе`
    
    if (mode === 'custom' && customPrompt) {
      // КАСТОМНЫЙ РЕЖИМ: пользователь сам указывает, что делать
      prompt = `Ты - профессиональный копирайтер для детских мероприятий.

${context}

${hasText ? `Текущий текст:\n"${text}"\n\n` : ''}

ИНСТРУКЦИЯ ОТ ПОЛЬЗОВАТЕЛЯ: ${customPrompt}

ТРЕБОВАНИЯ:
${baseRequirements}

ТОЛЬКО текст описания, БЕЗ комментариев.`
      
    } else if (mode === 'rephrase' && hasText) {
      // ПЕРЕФРАЗИРОВАТЬ: переписать другими словами, сохраняя смысл
      prompt = `Ты - профессиональный редактор текстов для детских мероприятий.

${context}

Текущий текст:
"${text}"

ЗАДАЧА: Перефразируй этот текст, сохраняя смысл:
- Используй другие слова и фразы
- Сохрани основную мысль и структуру
- Сделай текст свежим и интересным
- Сохрани длину примерно такой же

ТРЕБОВАНИЯ:
${baseRequirements}

ТОЛЬКО перефразированный текст, БЕЗ комментариев.`
      
    } else if (mode === 'simplify' && hasText) {
      // УПРОСТИТЬ: сделать проще и понятнее
      prompt = `Ты - профессиональный редактор текстов для детских мероприятий.

${context}

Текущий текст:
"${text}"

ЗАДАЧА: Упрости этот текст:
- Используй простые и понятные слова
- Убери сложные обороты
- Сделай текст доступным для всех
- Сохрани основную мысль

ТРЕБОВАНИЯ:
${baseRequirements}

ТОЛЬКО упрощённый текст, БЕЗ комментариев.`
      
    } else if (mode === 'shorten' && hasText) {
      // СОКРАТИТЬ: уменьшить длину
      prompt = `Ты - профессиональный редактор текстов для детских мероприятий.

${context}

Текущий текст:
"${text}"

ЗАДАЧА: Сократи этот текст:
- Убери лишние слова и повторы
- Оставь только самое важное
- Сделай текст более лаконичным
- Сохрани основную мысль

ТРЕБОВАНИЯ:
${baseRequirements}
- Текст должен быть значительно короче оригинала

ТОЛЬКО сокращённый текст, БЕЗ комментариев.`
      
    } else if (mode === 'expand' && hasText) {
      // РАСШИРИТЬ: сделать подробнее
      prompt = `Ты - профессиональный копирайтер для детских мероприятий.

${context}

Текущий текст:
"${text}"

ЗАДАЧА: Расширь этот текст:
- Добавь больше деталей и подробностей
- Раскрой преимущества и особенности
- Добавь эмоций и образности
- Сделай текст более полным и убедительным

ТРЕБОВАНИЯ:
${baseRequirements}

ТОЛЬКО расширенный текст, БЕЗ комментариев.`
      
    } else if (mode === 'continue' && hasText) {
      // ПРОДОЛЖИТЬ: написать продолжение
      prompt = `Ты - профессиональный копирайтер для детских мероприятий.

${context}

Текущий текст:
"${text}"

ЗАДАЧА: Продолжи этот текст:
- Логично развей мысль
- Добавь дополнительную информацию
- Сохрани стиль и тон оригинала
- Сделай переход плавным и естественным

ТРЕБОВАНИЯ:
${baseRequirements}

ТОЛЬКО продолжение текста (БЕЗ повтора оригинала), БЕЗ комментариев.`
      
    } else if (mode === 'improve' && hasText) {
      // УЛУЧШИТЬ: лёгкая стилистическая правка
      prompt = `Ты - профессиональный редактор текстов для детских мероприятий.

${context}

Текущий текст:
"${text}"

ЗАДАЧА: Улучши этот текст ЛЕГКО и ДЕЛИКАТНО:
- Исправь грамматику и синтаксис
- Слегка подправь стилистику по правилам маркетинга
- НЕ меняй смысл и основную структуру
- НЕ переписывай полностью, только полируй
- Сохрани авторский стиль и тон

ТРЕБОВАНИЯ:
${baseRequirements}

ТОЛЬКО улучшенный текст, БЕЗ комментариев.`
      
    } else {
      // СГЕНЕРИРОВАТЬ: создание с нуля
      prompt = `Ты - профессиональный копирайтер для детских мероприятий.

${context}

Напиши ${type === 'short' ? 'КРАТКОЕ' : 'ПОДРОБНОЕ'} описание для этого профиля.

${type === 'long' ? `СТРУКТУРА: Один абзац с цепляющим началом, преимуществами и лёгким призывом к действию.` : ''}

ТРЕБОВАНИЯ:
${baseRequirements}
- Пиши естественно (можно "я" или "мы" - решай сам)
- Ориентируйся ТОЛЬКО на категорию и тип (${category}${subtype ? ` - ${subtype}` : ''})
- НЕ упоминай теги, оборудование, условия - пиши обобщённо
- Фокус на эмоциях, атмосфере и преимуществах именно для этого типа

ТОЛЬКО текст описания, БЕЗ комментариев.`
    }

    // Очищаем кеш AI settings для получения свежих данных
    aiService.clearCache()
    
    // Проверяем настройки AI перед генерацией
    console.log('[Generate Description] Checking AI settings...')
    const settings = await aiService.getActiveSettings()
    console.log('[Generate Description] AI settings:', {
      hasSettings: !!settings,
      provider: settings?.provider,
      model: settings?.model_name,
      hasApiKey: !!settings?.api_key,
    })

    if (!settings) {
      return NextResponse.json(
        { error: 'AI не настроен. Перейдите в админ панель → Настройки → AI и добавьте API ключ.' },
        { status: 500 }
      )
    }

    if (!settings.api_key) {
      return NextResponse.json(
        { error: 'API ключ не найден. Добавьте GOOGLE_GEMINI_API_KEY в переменные окружения или настройте в админ панели.' },
        { status: 500 }
      )
    }

    // Генерируем описание через универсальный AI сервис
    console.log('[Generate Description] Generating text...')
    const generatedText = await aiService.generateTextOrThrow(prompt, {
      temperature: 0.7,
      max_tokens: type === 'short' ? 150 : 600,
    })

    console.log('[Generate Description] Generated text:', {
      hasText: !!generatedText,
      length: generatedText?.length,
    })

    return NextResponse.json({ 
      description: generatedText.trim()
    })

  } catch (error: any) {
    // Нормализованные ошибки от AIService
    if (error instanceof AIServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
          code: error.code,
        },
        { status: error.status }
      )
    }
    
    console.error('Error generating description:', error?.message || error)
    
    // Обработка ошибок квоты Gemini API
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'Превышен лимит запросов к AI. Попробуйте через минуту.' },
        { status: 429 }
      )
    }
    
    // Обработка ошибок перегрузки сервиса (503)
    if (error?.message?.includes('503') || error?.message?.includes('overloaded')) {
      return NextResponse.json(
        { error: 'Сервис AI временно перегружен. Попробуйте через 10-30 секунд.' },
        { status: 503 }
      )
    }
    
    // Обработка ошибок API ключа
    if (error?.message?.includes('API key') || error?.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Ошибка конфигурации AI. Обратитесь к администратору.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Ошибка при генерации описания. Попробуйте позже.' },
      { status: 500 }
    )
  }
}

