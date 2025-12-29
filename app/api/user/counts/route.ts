import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

// GET /api/user/counts - получить ВСЕ счётчики для header
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
    }

    // Получаем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isClient = user?.role === 'client'

    let newOrdersCount = 0
    let newResponsesCount = 0
    let unreadNotifications = 0
    let unreadMessages = 0

    // Упрощённый подсчёт
    const fallbackDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    try {
      if (isClient) {
        // Для клиента: новые отклики на его объявления
        try {
          newResponsesCount = await prisma.order_responses.count({
            where: {
              order_requests: {
                client_id: userId
              },
              created_at: {
                gt: fallbackDate
              }
            }
          })
        } catch (error) {
          logger.warn('[API Counts] order_responses table may not exist')
        }
      } else {
        // Для исполнителя: новые заявки
        newOrdersCount = await prisma.order_requests.count({
          where: {
            status: 'active',
            created_at: {
              gt: fallbackDate
            }
          }
        })
      }

      // Уведомления
      try {
        unreadNotifications = await prisma.notifications.count({
          where: {
            user_id: userId,
            read: false
          }
        })
      } catch (error) {
        logger.warn('[API Counts] notifications table may not exist')
      }

      // Сообщения в беседах
      try {
        // Находим все conversations пользователя
        const userConversations = await prisma.conversations.findMany({
          where: {
            OR: [
              { participant_1_id: userId },
              { participant_2_id: userId }
            ]
          },
          select: { id: true }
        })

        const conversationIds = userConversations.map(c => c.id)

        // Считаем непрочитанные сообщения в этих conversations
        if (conversationIds.length > 0) {
          unreadMessages = await prisma.messages.count({
            where: {
              conversation_id: { in: conversationIds },
              sender_id: { not: userId },
              read_at: null
            }
          })
        }
      } catch (error) {
        logger.warn('[API Counts] messages/conversations tables may not exist:', error)
      }
    } catch (error: any) {
      logger.warn('[API Counts] Some tables missing, returning zeros:', error)
    }

    return NextResponse.json({
      newOrdersCount,
      newResponsesCount,
      unreadNotifications,
      unreadMessages,
    })
  } catch (error: any) {
    logger.error('[API Counts] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
