import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

/**
 * GET /api/realtime/notifications
 * Server-Sent Events (SSE) для realtime обновлений уведомлений
 * 
 * Клиент подключается один раз, сервер отправляет события:
 * - notification-created
 * - notification-read
 * - message-received
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload || !payload.sub) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = payload.sub

  // Создаём ReadableStream для SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Функция для отправки события клиенту
      const send = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Отправляем keepalive каждые 30 секунд
      const keepaliveInterval = setInterval(() => {
        send('keepalive', { timestamp: Date.now() })
      }, 30000)

      // Функция для проверки новых уведомлений
      let lastCheck = new Date()
      const checkInterval = setInterval(async () => {
        try {
          // Проверяем новые уведомления с последней проверки
          const newNotifications = await prisma.notifications.findMany({
            where: {
              user_id: userId,
              created_at: { gt: lastCheck }
            },
            orderBy: { created_at: 'desc' },
            take: 10
          })

          if (newNotifications.length > 0) {
            send('notification-created', {
              count: newNotifications.length,
              notifications: newNotifications.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                link: n.link,
                created_at: n.created_at
              }))
            })
            lastCheck = new Date()
          }

          // Проверяем новые сообщения
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

          if (conversationIds.length > 0) {
            const newMessages = await prisma.messages.findMany({
              where: {
                conversation_id: { in: conversationIds },
                sender_id: { not: userId },
                created_at: { gt: lastCheck },
                read_at: null
              },
              orderBy: { created_at: 'desc' },
              take: 10,
              include: {
                users: {
                  select: {
                    full_name: true,
                    avatar_url: true
                  }
                }
              }
            })

            if (newMessages.length > 0) {
              send('message-received', {
                count: newMessages.length,
                messages: newMessages.map(m => ({
                  id: m.id,
                  conversation_id: m.conversation_id,
                  sender_name: m.users.full_name,
                  sender_avatar: m.users.avatar_url,
                  content: m.content,
                  created_at: m.created_at
                }))
              })
            }
          }
        } catch (error) {
          console.error('[SSE] Error checking updates:', error)
        }
      }, 5000) // Проверяем каждые 5 секунд

      // Очистка при закрытии соединения
      request.signal.addEventListener('abort', () => {
        clearInterval(keepaliveInterval)
        clearInterval(checkInterval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

