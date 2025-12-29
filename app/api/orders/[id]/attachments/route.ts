import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/[id]/attachments - Получить вложения для заказа
 * Вложения хранятся в attachments полях сообщений
 */
export async function GET(
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

    // Проверка прав доступа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    const isClient = order.client_id === userId
    const isProvider = order.profile_id ? await prisma.profiles.findFirst({
      where: {
        id: order.profile_id,
        user_id: userId
      }
    }) : false

    if (!isAdmin && !isClient && !isProvider) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
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
      return NextResponse.json({ attachments: [] })
    }

    // Находим conversation и собираем все вложения из сообщений
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
      },
      include: {
        messages: {
          select: {
            id: true,
            attachments: true,
            created_at: true,
            sender_id: true,
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ attachments: [] })
    }

    // Собираем все вложения
    const attachments: any[] = []
    conversation.messages.forEach(msg => {
      if (msg.attachments && Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att: any) => {
          attachments.push({
            ...att,
            message_id: msg.id,
            sender_id: msg.sender_id,
            created_at: msg.created_at
          })
        })
      }
    })

    return NextResponse.json({ attachments })
  } catch (error: any) {
    logger.error('[Orders Attachments API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}
