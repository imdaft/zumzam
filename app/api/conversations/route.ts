import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/conversations - Получить список conversations пользователя
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Получаем все conversations пользователя (как participant_1 или participant_2)
    const [conversations, total] = await Promise.all([
      prisma.conversations.findMany({
        where: {
          OR: [
            { participant_1_id: userId },
            { participant_2_id: userId }
          ]
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
          },
          profiles: {
            select: {
              id: true,
              slug: true,
              display_name: true,
              main_photo: true,
              logo: true,
              photos: true,
              user_id: true,
            }
          },
          orders: {
            select: {
              id: true,
              status: true,
              total_amount: true,
              event_date: true,
              event_time: true,
              order_requests: {
                select: {
                  category: true,
                  children_count: true,
                  city: true,
                  address: true,
                  client_name: true,
                }
              }
            }
          },
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              users: {
                select: {
                  id: true,
                  full_name: true,
                }
              }
            }
          }
        },
        orderBy: { last_message_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.conversations.count({
        where: {
          OR: [
            { participant_1_id: userId },
            { participant_2_id: userId }
          ]
        }
      })
    ])

    // Обогащаем данными о непрочитанных сообщениях
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participant_1_id === userId
          ? conv.users_conversations_participant_2_idTousers
          : conv.users_conversations_participant_1_idTousers

        const unreadCount = await prisma.messages.count({
          where: {
            conversation_id: conv.id,
            sender_id: { not: userId },
            read_at: null
          }
        })

        return {
          ...conv,
          order: conv.orders || null, // Переименовываем orders в order для фронтенда
          other_participant: otherParticipant,
          last_message: conv.messages[0] || null,
          unread_count: unreadCount,
        }
      })
    )

    return NextResponse.json({
      conversations: enrichedConversations,
      total,
      limit,
      offset
    })
  } catch (error: any) {
    logger.error('[Conversations API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations - Создать новую conversation
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
    const { participant_id } = body

    if (!participant_id) {
      return NextResponse.json(
        { error: 'participant_id is required' },
        { status: 400 }
      )
    }

    if (participant_id === userId) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли уже conversation
    let conversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          {
            participant_1_id: userId,
            participant_2_id: participant_id
          },
          {
            participant_1_id: participant_id,
            participant_2_id: userId
          }
        ]
      }
    })

    if (!conversation) {
      // Создаём новую conversation (упорядочиваем ID для уникальности)
      const [p1, p2] = userId < participant_id
        ? [userId, participant_id]
        : [participant_id, userId]

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
      message: 'Conversation created successfully'
    }, { status: 201 })
  } catch (error: any) {
    logger.error('[Conversations API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

