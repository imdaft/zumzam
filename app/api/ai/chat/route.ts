import { generateRAGResponse } from '@/lib/ai/rag'
import { NextResponse } from 'next/server'

/**
 * POST /api/ai/chat - RAG-чат для ответов на вопросы о профилях/услугах
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, profileId, conversationHistory = [] } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Генерируем ответ с использованием RAG
    const { answer, sources } = await generateRAGResponse(
      query,
      profileId,
      conversationHistory
    )

    return NextResponse.json({
      answer,
      sources: sources.map(s => ({
        id: s.id,
        type: s.metadata.type,
        title: s.metadata.title,
        similarity: s.similarity,
      })),
    })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: error.message || 'AI chat failed' },
      { status: 500 }
    )
  }
}

