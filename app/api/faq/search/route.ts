import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { logger } from '@/lib/logger'

/**
 * POST /api/faq/search
 * Семантический поиск по FAQ с использованием векторных embeddings
 */
export async function POST(request: NextRequest) {
  try {
    const { query, threshold = 0.3, limit = 10 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Генерируем embedding для поискового запроса
    const queryEmbedding = await generateEmbedding(query)

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: 'Failed to generate embedding for query' },
        { status: 500 }
      )
    }

    // TODO: Использовать векторный поиск через Prisma
    // Пока возвращаем заглушку, т.к. pgvector функции требуют настройки
    logger.warn('[FAQ Search] Vector search not yet implemented with Prisma, returning empty results')

    return NextResponse.json({
      results: [],
      query,
      count: 0
    })

  } catch (error: any) {
    logger.error('[FAQ Search] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
