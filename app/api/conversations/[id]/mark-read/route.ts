import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * POST /api/conversations/[id]/mark-read - Отметить все сообщения conversation как прочитанные
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Проверяем, что пользователь - участник conversation
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participant_1_id: true,
        participant_2_id: true,
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.participant_1_id !== userId && conversation.participant_2_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Отмечаем все непрочитанные сообщения как прочитанные
    await prisma.messages.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        read_at: null
      },
      data: {
        read_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Conversations Mark Read API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
