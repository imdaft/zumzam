import { GoogleGenerativeAI } from '@google/generative-ai'

// Модели (используем самые актуальные из доступных)
export const MODELS = {
  FLASH: 'gemini-2.5-flash', // Gemini 2.5 Flash - стабильная (рекомендуется)
  FLASH_LITE: 'gemini-2.5-flash-lite', // Легковесная версия
  PRO: 'gemini-2.5-pro', // Лучшее качество Gemini 2.5
  FLASH_2: 'gemini-2.0-flash', // Gemini 2.0 Flash
  FLASH_LATEST: 'gemini-flash-latest', // Всегда последняя версия Flash
  PRO_LATEST: 'gemini-pro-latest', // Всегда последняя версия Pro
  EMBEDDING: 'text-embedding-004',
} as const

let genAI: GoogleGenerativeAI | null = null

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Не выбрасываем ошибку сразу, чтобы не ломать импорты
      console.warn('GEMINI_API_KEY is not defined. AI features will be disabled.')
      return null
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Получает базовый URL для API (для работы через прокси)
 */
function getBaseUrl(): string | undefined {
  // Если задан прокси URL в env (например для Yandex Cloud)
  // GEMINI_API_BASE_URL=https://my-proxy.workers.dev
  return process.env.GEMINI_API_BASE_URL
}

/**
 * Генерация текста через Gemini
 */
export async function generateText(prompt: string, options?: {
  model?: string
  temperature?: number
  maxTokens?: number
}) {
  const client = getGenAI()
  if (!client) throw new Error('GEMINI_API_KEY required for generateText')

  const model = client.getGenerativeModel({
    model: options?.model || MODELS.FLASH,
    generationConfig: {
      temperature: options?.temperature || 0.7,
      maxOutputTokens: options?.maxTokens || 2048,
    },
  }, {
    baseUrl: getBaseUrl() // Поддержка прокси
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}

/**
 * Streaming генерация (для чатов)
 */
export async function* generateTextStream(prompt: string) {
  const client = getGenAI()
  if (!client) throw new Error('GEMINI_API_KEY required for generateTextStream')

  const model = client.getGenerativeModel({ 
    model: MODELS.FLASH 
  }, {
    baseUrl: getBaseUrl() // Поддержка прокси
  })

  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    yield chunk.text()
  }
}

/**
 * Генерация JSON (structured output)
 */
export async function generateJSON<T>(prompt: string, schema?: string): Promise<T> {
  const fullPrompt = schema
    ? `${prompt}\n\nОТВЕТ СТРОГО В ФОРМАТЕ JSON:\n${schema}`
    : `${prompt}\n\nОТВЕТ СТРОГО В ФОРМАТЕ JSON (без markdown, без дополнительного текста).`

  const result = await generateText(fullPrompt, { temperature: 0.3 })

  // Очистка от markdown ```json и ```
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    console.error('Failed to parse JSON:', cleaned)
    throw new Error('Failed to parse AI response as JSON')
  }
}

export default getGenAI
