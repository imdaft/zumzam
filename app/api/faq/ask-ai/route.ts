import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `Ты — AI-помощник сервиса ZumZam (платформа для поиска детских праздников: аниматоры, площадки, шоу).

СТРОГИЕ ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе предоставленного контекста из FAQ
2. Если ответа нет в контексте — честно скажи: "К сожалению, я не нашёл точного ответа на этот вопрос. Рекомендую обратиться в поддержку."
3. НЕ ВЫДУМЫВАЙ информацию о ценах, сроках, гарантиях, условиях возврата
4. На вопросы о конкретных суммах, юридических деталях — направляй в поддержку
5. Будь кратким и дружелюбным
6. Отвечай на русском языке

ИНФОРМАЦИЯ О СЕРВИСЕ:
- ZumZam — маркетплейс детских праздников
- Есть аниматоры, площадки, шоу-программы, квесты
- Для родителей: поиск и бронирование
- Для бизнеса: размещение услуг, получение заявок
- Поддержка: support@zumzam.ru`

/**
 * POST /api/faq/ask-ai
 * Генерирует AI-ответ на вопрос с использованием контекста из FAQ
 */
export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // 1. Ищем релевантные FAQ записи для контекста
    const queryEmbedding = await generateEmbedding(question)

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: 'Failed to process question' },
        { status: 500 }
      )
    }

    // TODO: Векторный поиск через Prisma
    logger.warn('[FAQ Ask AI] Vector search not yet implemented, using empty context')
    const faqResults: any[] = []

    // 2. Формируем контекст из найденных FAQ
    let context = ''
    if (faqResults && faqResults.length > 0) {
      context = 'КОНТЕКСТ ИЗ FAQ:\n\n'
      faqResults.forEach((item: { question: string; answer: string; similarity: number }, idx: number) => {
        context += `${idx + 1}. Вопрос: ${item.question}\n`
        context += `   Ответ: ${item.answer}\n`
        context += `   (релевантность: ${Math.round(item.similarity * 100)}%)\n\n`
      })
    } else {
      context = 'В FAQ не найдено похожих вопросов.'
    }

    // 3. Генерируем ответ через Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `${SYSTEM_PROMPT}

${context}

ВОПРОС ПОЛЬЗОВАТЕЛЯ:
${question}

ОТВЕТ:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const answer = response.text()

    return NextResponse.json({
      answer,
      context_used: faqResults.length > 0,
      sources: faqResults.map((item: any) => ({
        question: item.question,
        similarity: item.similarity
      }))
    })
  } catch (error: any) {
    logger.error('[FAQ Ask AI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    )
  }
}
