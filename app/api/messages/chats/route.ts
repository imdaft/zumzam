import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/messages/chats - получить список чатов пользователя
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

    // Получить все разговоры пользователя
    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [
          { participant_1_id: payload.sub },
          { participant_2_id: payload.sub }
        ]
      },
      include: {
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            logo: true
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            content: true,
            sender_id: true,
            read_at: true,
            created_at: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                sender_id: { not: payload.sub },
                read_at: null
              }
            }
          }
        }
      },
      orderBy: { last_message_at: 'desc' }
    })

    // Форматирование ответа
    const chats = conversations.map(conv => {
      const otherParticipantId = 
        conv.participant_1_id === payload.sub 
          ? conv.participant_2_id 
          : conv.participant_1_id

      return {
        conversation_id: conv.id,
        profile: conv.profiles,
        last_message: conv.messages[0] || null,
        unread_count: conv._count.messages,
        last_message_at: conv.last_message_at,
        other_participant_id: otherParticipantId
      }
    })

    return NextResponse.json({ chats })
  } catch (error: any) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats', details: error.message },
      { status: 500 }
    )
  }
}



