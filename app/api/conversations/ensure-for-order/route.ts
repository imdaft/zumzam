import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conversations/ensure-for-order?order_id={id} - Получить или создать conversation для заказа
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    const { searchParams } = new URL(request.url)
    const order_id = searchParams.get('order_id')

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      )
    }

    // Получаем заказ
    const order = await prisma.orders.findUnique({
      where: { id: order_id },
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

    // Определяем второго участника
    const otherParticipantId = order.client_id === userId
      ? (order.profile_id
          ? (await prisma.profiles.findUnique({
              where: { id: order.profile_id },
              select: { user_id: true }
            }))?.user_id
          : null)
      : order.client_id

    if (!otherParticipantId) {
      return NextResponse.json(
        { error: 'Cannot determine conversation participants' },
        { status: 400 }
      )
    }

    // Ищем существующую conversation для этого заказа (по order_id)
    let conversation = await prisma.conversations.findFirst({
      where: {
        order_id: order_id, // Каждый заказ имеет свой отдельный диалог
      },
      include: {
        users_conversations_participant_1_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          }
        },
        users_conversations_participant_2_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          }
        }
      }
    })

    // Если conversation не найдена, создаём новую
    if (!conversation) {
      const [p1, p2] = userId < otherParticipantId
        ? [userId, otherParticipantId]
        : [otherParticipantId, userId]

      // Получаем данные для заголовка диалога
      const orderData = await prisma.orders.findUnique({
        where: { id: order_id },
        select: {
          id: true,
          event_date: true,
          profiles: {
            select: { display_name: true }
          },
          users: {
            select: { full_name: true }
          }
        }
      })

      const clientName = orderData?.users.full_name || 'Клиент'
      const profileName = orderData?.profiles?.display_name || 'Исполнитель'
      
      // Определяем заголовок в зависимости от того, кто смотрит
      const title = order.client_id === userId
        ? `Заказ у ${profileName}`
        : `Заказ от ${clientName}`

      conversation = await prisma.conversations.create({
        data: {
          participant_1_id: p1,
          participant_2_id: p2,
          profile_id: order.profile_id, // Сохраняем ID профиля для отображения аватарки
          type: 'order',
          order_id: order_id,
          title: title,
          last_message_preview: 'Диалог по заказу создан',
        },
        include: {
          users_conversations_participant_1_idTousers: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
            }
          },
          users_conversations_participant_2_idTousers: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
            }
          }
        }
      })
      
      logger.info('[Conversations] Created order conversation:', {
        conversationId: conversation.id,
        orderId: order_id,
        title: title
      })
    }

    return NextResponse.json({
      conversation_id: conversation.id,
      conversation,
      message: 'Conversation ensured successfully'
    })
  } catch (error: any) {
    logger.error('[Conversations Ensure For Order API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to ensure conversation' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations/ensure-for-order - Создать или найти conversation для заказа
 */
export async function POST(request: NextRequest) {
  try {
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
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      )
    }

    // Получаем заказ
    const order = await prisma.orders.findUnique({
      where: { id: order_id },
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

    // Определяем второго участника
    const otherParticipantId = order.client_id === userId
      ? (order.profile_id
          ? (await prisma.profiles.findUnique({
              where: { id: order.profile_id },
              select: { user_id: true }
            }))?.user_id
          : null)
      : order.client_id

    if (!otherParticipantId) {
      return NextResponse.json(
        { error: 'Cannot determine conversation participants' },
        { status: 400 }
      )
    }

    // Ищем существующую conversation для этого заказа (по order_id)
    let conversation = await prisma.conversations.findFirst({
      where: {
        order_id: order_id, // Каждый заказ имеет свой отдельный диалог
      },
      include: {
        users_conversations_participant_1_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          }
        },
        users_conversations_participant_2_idTousers: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          }
        }
      }
    })

    // Если conversation не найдена, создаём новую
    if (!conversation) {
      const [p1, p2] = userId < otherParticipantId
        ? [userId, otherParticipantId]
        : [otherParticipantId, userId]

      conversation = await prisma.conversations.create({
        data: {
          participant_1_id: p1,
          participant_2_id: p2,
        },
        include: {
          users_conversations_participant_1_idTousers: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
            }
          },
          users_conversations_participant_2_idTousers: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
            }
          }
        }
      })
    }

    return NextResponse.json({
      conversation,
      message: 'Conversation ensured successfully'
    })
  } catch (error: any) {
    logger.error('[Conversations Ensure For Order API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to ensure conversation' },
      { status: 500 }
    )
  }
}
