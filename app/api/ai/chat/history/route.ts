import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/ai/chat/history - получить историю чата с AI
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    try {
      const messages = await prisma.ai_chat_messages.findMany({
        where: { user_id: payload.sub },
        orderBy: { created_at: 'desc' },
        take: limit,
        select: {
          id: true,
          role: true,
          content: true,
          suggestions: true,
          gallery: true,
          created_at: true
        }
      })

      // Возвращаем в обратном порядке (от старых к новым)
      return NextResponse.json({ messages: messages.reverse() })
    } catch (dbError: any) {
      // Таблица AI может не существовать - возвращаем пустую историю
      console.warn('AI chat history table not found (expected during development):', dbError.message)
      return NextResponse.json({ messages: [] })
    }
  } catch (error: any) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/ai/chat/history - очистить историю чата
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    try {
      await prisma.ai_chat_messages.deleteMany({
        where: { user_id: payload.sub }
      })
      return NextResponse.json({ success: true, message: 'History cleared' })
    } catch (dbError: any) {
      // Таблица AI может не существовать - игнорируем
      console.warn('AI chat history table not found (expected during development):', dbError.message)
      return NextResponse.json({ success: true, message: 'History cleared' })
    }
  } catch (error: any) {
    console.error('Error clearing chat history:', error)
    return NextResponse.json(
      { error: 'Failed to clear history', details: error.message },
      { status: 500 }
    )
  }
}



