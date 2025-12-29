import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

// Helper для создания/получения conversation
async function getOrCreateConversation(
  participant1Id: string,
  participant2Id: string
): Promise<string | null> {
  // Убеждаемся что participant1 < participant2 для consistency
  const [p1, p2] = [participant1Id, participant2Id].sort()
  
  try {
    // Ищем существующий conversation
    const existing = await prisma.conversations.findUnique({
      where: {
        participant_1_id_participant_2_id: {
          participant_1_id: p1,
          participant_2_id: p2,
        },
      },
      select: { id: true },
    })

    if (existing) {
      return existing.id
    }

    // Создаём новый
    const newConv = await prisma.conversations.create({
      data: {
        participant_1_id: p1,
        participant_2_id: p2,
      },
      select: { id: true },
    })

    return newConv.id
  } catch (error: any) {
    logger.error('[Conversation Helper] Error:', error)
    return null
  }
}

// PATCH /api/requests/responses/[id] — обновление статуса отклика
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: responseId } = await params
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Валидация статуса
    const validStatuses = ['viewed', 'accepted', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус' },
        { status: 400 }
      )
    }

    // Получаем отклик с информацией о заявке
    const response = await prisma.order_responses.findUnique({
      where: { id: responseId },
      include: {
        order_requests: {
          select: {
            id: true,
            client_id: true,
            title: true,
          },
        },
      },
    })

    if (!response) {
      return NextResponse.json(
        { error: 'Отклик не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь владелец заявки
    if (response.order_requests?.client_id !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому отклику' },
        { status: 403 }
      )
    }

    // Обновляем статус отклика
    const updatedResponse = await prisma.order_responses.update({
      where: { id: responseId },
      data: {
        status: status as any,
        updated_at: new Date(),
      },
    })

    // Если принят — обновляем статус объявления, создаём чат и уведомление
    if (status === 'accepted') {
      // Обновляем статус объявления на "в работе"
      await prisma.order_requests.update({
        where: { id: response.request_id },
        data: {
          status: 'in_progress',
          updated_at: new Date(),
        },
      })

      logger.info('[API Response] Request status updated to in_progress:', response.request_id)

      // Создаём чат между клиентом и исполнителем
      const conversationId = await getOrCreateConversation(
        userId, // клиент
        response.performer_id // исполнитель
      )

      // Создаём уведомление для исполнителя
      if (conversationId) {
        await prisma.notifications.create({
          data: {
            user_id: response.performer_id,
            type: 'response_accepted',
            title: 'Ваш отклик принят! 🎉',
            body: `Заказчик принял ваш отклик на "${response.order_requests?.title}". Теперь вы можете общаться в чате.`,
            action_url: `/messages?chat=${conversationId}`,
            read: false,
            data: {
              request_id: response.request_id,
              response_id: responseId,
            } as any,
          },
        })
      }
    }

    // Если отклонён — создаём уведомление для исполнителя
    if (status === 'rejected') {
      await prisma.notifications.create({
        data: {
          user_id: response.performer_id,
          type: 'response_rejected',
          title: 'Отклик отклонён',
          body: `К сожалению, ваш отклик на "${response.order_requests?.title}" не был принят`,
          action_url: `/board/${response.request_id}`,
          read: false,
          data: {
            request_id: response.request_id,
            response_id: responseId,
          } as any,
        },
      })
    }

    logger.info('[API Response] Response status updated:', { responseId, status })
    return NextResponse.json(updatedResponse)
  } catch (error: any) {
    logger.error('[API Response] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/requests/responses/[id] — получение информации об отклике
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: responseId } = await params
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться' },
        { status: 401 }
      )
    }

    const response = await prisma.order_responses.findUnique({
      where: { id: responseId },
      include: {
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            main_photo: true,
            rating: true,
            reviews_count: true,
          },
        },
        order_requests: {
          select: {
            id: true,
            title: true,
            client_id: true,
          },
        },
      },
    })

    if (!response) {
      return NextResponse.json(
        { error: 'Отклик не найден' },
        { status: 404 }
      )
    }

    // Проверяем доступ: владелец заявки или автор отклика
    const isOwner = response.order_requests?.client_id === userId
    const isPerformer = response.performer_id === userId

    if (!isOwner && !isPerformer) {
      return NextResponse.json(
        { error: 'У вас нет доступа к этому отклику' },
        { status: 403 }
      )
    }

    return NextResponse.json(response)
  } catch (error: any) {
    logger.error('[API Response] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 }
    )
  }
}

