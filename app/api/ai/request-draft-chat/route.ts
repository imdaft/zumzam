import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// POST /api/ai/request-draft-chat - диалог с AI для уточнения черновика
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { message, current_draft, context } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // TODO: AI диалог для улучшения черновика
    // const updatedDraft = await improveДraftWithAI(message, current_draft, context)

    // Временная заглушка
    const response = {
      message: `Понял! ${message}. Обновляю черновик...`,
      updated_draft: {
        ...current_draft,
        description: current_draft.description + `\n\n${message}`
      },
      suggestions: [
        'Добавить информацию о месте проведения',
        'Указать конкретную дату',
        'Уточнить бюджет'
      ]
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error in draft chat:', error)
    return NextResponse.json(
      { error: 'Failed to process message', details: error.message },
      { status: 500 }
    )
  }
}



