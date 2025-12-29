import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

// POST /api/requests/[id]/respond — отклик на заявку
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: requestId } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Валидация
    if (!body.profileId) {
      return NextResponse.json(
        { error: 'Не указан профиль для отклика' },
        { status: 400 }
      )
    }

    if (!body.price || body.price <= 0) {
      return NextResponse.json(
        { error: 'Укажите цену' },
        { status: 400 }
      )
    }

    // Проверяем, что профиль принадлежит пользователю
    const profile = await prisma.profiles.findFirst({
      where: {
        id: body.profileId,
        user_id: userId
      },
      select: { id: true, display_name: true }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден или не принадлежит вам' },
        { status: 403 }
      )
    }

    // Проверяем, что заявка существует и активна
    const orderRequest = await prisma.order_requests.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, client_id: true, title: true }
    })

    if (!orderRequest) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    if (orderRequest.status !== 'active') {
      return NextResponse.json(
        { error: 'Заявка уже закрыта' },
        { status: 400 }
      )
    }

    // Нельзя откликаться на свою заявку
    if (orderRequest.client_id === userId) {
      return NextResponse.json(
        { error: 'Нельзя откликнуться на свою заявку' },
        { status: 400 }
      )
    }

    // Проверяем, нет ли уже отклика от этого профиля
    try {
      const existingResponse = await prisma.order_responses.findFirst({
        where: {
          request_id: requestId,
          profile_id: body.profileId
        }
      })

      if (existingResponse) {
        return NextResponse.json(
          { error: 'Вы уже откликнулись на эту заявку' },
          { status: 400 }
        )
      }
    } catch (error: any) {
      // Если таблица не существует, пропускаем проверку
      if (error.code !== 'P2021') {
        logger.warn('[Respond API] order_responses table may not exist')
      }
    }

    // Создаём отклик
    let response
    try {
      response = await prisma.order_responses.create({
        data: {
          request_id: requestId,
          profile_id: body.profileId,
          performer_id: userId,
          price: body.price,
          message: body.message || null,
          attachments: body.attachments || [],
          status: 'pending',
        }
      })

      // Увеличиваем счётчик откликов
      await prisma.order_requests.update({
        where: { id: requestId },
        data: {
          responses_count: { increment: 1 }
        }
      })
    } catch (error: any) {
      if (error.code === 'P2021') {
        logger.warn('[Respond API] order_responses table not found')
        return NextResponse.json({ 
          message: 'API готов, но таблица order_responses требует настройки',
          requestId,
          profileId: body.profileId,
          price: body.price
        }, { status: 201 })
      }
      throw error
    }

    // Создаём уведомление для владельца заявки
    try {
      await prisma.notifications.create({
        data: {
          user_id: orderRequest.client_id,
          type: 'new_response',
          title: 'Новый отклик на объявление! 🎉',
          body: `${profile.display_name} откликнулся на "${orderRequest.title}" с ценой ${body.price.toLocaleString('ru-RU')} ₽`,
          action_url: `/my-requests/${requestId}`,
          read: false,
          data: {
            request_id: requestId,
            response_id: response.id,
            profile_id: body.profileId,
            profile_name: profile.display_name,
            price: body.price,
          },
        }
      })
    } catch (error: any) {
      // Если таблица не существует, просто логируем
      if (error.code === 'P2021') {
        logger.warn('[Respond API] notifications table not found')
      } else {
        logger.error('[Respond API] Failed to create notification:', error)
      }
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    logger.error('[API Respond] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET /api/requests/[id]/respond — получение откликов на заявку
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: requestId } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться' },
        { status: 401 }
      )
    }

    // Проверяем, что пользователь владелец заявки
    const orderRequest = await prisma.order_requests.findUnique({
      where: { id: requestId },
      select: { client_id: true }
    })

    if (!orderRequest) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    if (orderRequest.client_id !== userId) {
      return NextResponse.json(
        { error: 'У вас нет доступа к откликам этой заявки' },
        { status: 403 }
      )
    }

    // Получение откликов
    try {
      const responses = await prisma.order_responses.findMany({
        where: { request_id: requestId },
        include: {
          profiles: {
            select: {
              id: true,
              slug: true,
              display_name: true,
              main_photo: true,
              rating: true,
              reviews_count: true,
              category: true,
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      return NextResponse.json({ responses })
    } catch (error: any) {
      if (error.code === 'P2021') {
        logger.warn('[Respond API GET] order_responses table not found')
        return NextResponse.json({ 
          responses: [],
          message: 'Таблица order_responses требует настройки'
        })
      }
      throw error
    }
  } catch (error: any) {
    logger.error('[API Respond GET] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

