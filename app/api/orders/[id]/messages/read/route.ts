import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * POST /api/orders/[id]/messages/read - Отметить сообщения заказа как прочитанные
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: orderId } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем заказ
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        client_id: true,
        profile_id: true,
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Получаем второго участника
    const otherParticipantId = order.client_id === userId && order.profile_id
      ? (await prisma.profiles.findUnique({
          where: { id: order.profile_id },
          select: { user_id: true }
        }))?.user_id
      : order.client_id

    if (!otherParticipantId) {
      return NextResponse.json({ success: true })
    }

    // Находим conversation
    const conversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          {
            participant_1_id: userId,
            participant_2_id: otherParticipantId
          },
          {
            participant_1_id: otherParticipantId,
            participant_2_id: userId
          }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json({ success: true })
    }

    // Отмечаем все непрочитанные сообщения как прочитанные
    await prisma.messages.updateMany({
      where: {
        conversation_id: conversation.id,
        sender_id: { not: userId },
        read_at: null
      },
      data: {
        read_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Orders Messages Read API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
