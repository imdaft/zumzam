import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/[id]/messages - Получить сообщения для заказа
 * Сообщения хранятся в conversations между участниками заказа
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

    // Получаем второго участника для поиска conversation
    const otherParticipantId = isClient && order.profile_id
      ? (await prisma.profiles.findUnique({
          where: { id: order.profile_id },
          select: { user_id: true }
        }))?.user_id
      : order.client_id

    if (!otherParticipantId) {
      return NextResponse.json({ messages: [] })
    }

    // Ищем conversation между участниками
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
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
              }
            }
          },
          orderBy: { created_at: 'asc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({
      messages: conversation.messages,
      conversation_id: conversation.id
    })
  } catch (error: any) {
    logger.error('[Orders Messages API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders/[id]/messages - Создать сообщение для заказа
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
    const body = await request.json()
    const { content, attachments = [] } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

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
    const otherParticipantId = isClient && order.profile_id
      ? (await prisma.profiles.findUnique({
          where: { id: order.profile_id },
          select: { user_id: true }
        }))?.user_id
      : order.client_id

    if (!otherParticipantId) {
      return NextResponse.json(
        { error: 'Cannot determine conversation participants' },
        { status: 400 }
      )
    }

    // Находим или создаём conversation
    let conversation = await prisma.conversations.findFirst({
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
      // Создаём новую conversation
      conversation = await prisma.conversations.create({
        data: {
          participant_1_id: userId < otherParticipantId ? userId : otherParticipantId,
          participant_2_id: userId < otherParticipantId ? otherParticipantId : userId,
        }
      })
    }

    // Создаём сообщение
    const message = await prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_id: userId,
        content,
        attachments: attachments.length > 0 ? attachments : [],
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          }
        }
      }
    })

    // Обновляем last_message_at в conversation
    await prisma.conversations.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() }
    })

    return NextResponse.json({
      message,
      message: 'Message sent successfully'
    }, { status: 201 })
  } catch (error: any) {
    logger.error('[Orders Messages API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
