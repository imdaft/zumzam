import { GoogleGenerativeAI } from '@google/generative-ai'
import { MODELS } from './gemini'

// Инициализируем лениво, чтобы не крашилось при импорте если нет ключа
let genAI: GoogleGenerativeAI | null = null

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Embeddings will not be generated.')
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
  return process.env.GEMINI_API_BASE_URL
}

/**
 * Генерирует embedding для текста
 * Размерность: 768 (text-embedding-004)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const client = getGenAI()
    if (!client) {
      return null // Возвращаем null, если нет клиента
    }

    const model = client.getGenerativeModel({ 
      model: MODELS.EMBEDDING 
    }, {
      baseUrl: getBaseUrl() // Поддержка прокси
    })

    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error('Error generating embedding:', error)
    return null // Возвращаем null в случае ошибки
  }
}

/**
 * Генерирует embeddings для массива текстов (батч)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => generateEmbedding(text)))
}

/**
 * Вычисляет косинусное сходство между двумя векторами
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
