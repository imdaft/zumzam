import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/conversations/[id]/messages - Получить сообщения conversation
 */
export async function GET(
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Получаем сообщения
    const [messages, total] = await Promise.all([
      prisma.messages.findMany({
        where: { conversation_id: conversationId },
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.messages.count({
        where: { conversation_id: conversationId }
      })
    ])

    return NextResponse.json({
      messages: messages.reverse(), // Возвращаем в хронологическом порядке
      total,
      limit,
      offset
    })
  } catch (error: any) {
    logger.error('[Conversations Messages API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations/[id]/messages - Создать сообщение в conversation
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
    const body = await request.json()
    const { content, attachments = [] } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

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

    // Создаём сообщение
    const message = await prisma.messages.create({
      data: {
        conversation_id: conversationId,
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

    // Обновляем last_message_at и превью в conversation
    const preview = content.length > 50 ? content.substring(0, 50) + '...' : content
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { 
        last_message_at: new Date(),
        last_message_preview: preview 
      }
    })

    return NextResponse.json({
      message,
      message: 'Message sent successfully'
    }, { status: 201 })
  } catch (error: any) {
    logger.error('[Conversations Messages API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
