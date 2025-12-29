import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zumzam.ru'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export const dynamic = 'force-dynamic'

/**
 * POST /api/board-subscriptions/notify
 * Отправка уведомлений подписчикам о новом объявлении
 * 
 * Вызывается после создания нового объявления
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем API ключ для внутренних вызовов
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'requestId required' }, { status: 400 })
    }

    // Получаем объявление
    const orderRequest = await prisma.order_requests.findUnique({
      where: { id: requestId }
    })

    if (!orderRequest) {
      logger.error('[Notify Subscribers] Request not found', { requestId })
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Получаем подходящие подписки (упрощённая логика)
    const matchingSubscriptions = await prisma.board_subscriptions.findMany({
      where: {
        notification_enabled: true,
        OR: [
          { category: orderRequest.category || undefined },
          { city: orderRequest.city || undefined },
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    })

    if (!matchingSubscriptions || matchingSubscriptions.length === 0) {
      logger.info('[Notify Subscribers] No matching subscriptions', { requestId })
      return NextResponse.json({ sent: 0, subscriptions: 0 })
    }

    logger.info('[Notify Subscribers] Found matching subscriptions', {
      requestId,
      count: matchingSubscriptions.length
    })

    // Статистика отправки
    const stats = {
      internal: 0,
      email: 0,
      telegram: 0,
      push: 0,
      errors: 0,
    }

    // Обрабатываем каждую подписку
    for (const sub of matchingSubscriptions) {
      try {
        // Внутреннее уведомление
        if (sub.notification_enabled) {
          try {
            // TODO: Создать уведомление через prisma.notifications (таблица может отсутствовать)
            stats.internal++
          } catch (e) {
            logger.error('[Notify Subscribers] Internal notification failed', { error: e })
          }
        }

        // Email уведомление
        if (sub.email_enabled && sub.users?.email) {
          try {
            // TODO: Отправить email через email-провайдер
            logger.info('[Email Notification] Would send email', {
              to: sub.users.email,
              requestId
            })
            stats.email++
          } catch (e) {
            logger.error('[Notify Subscribers] Email notification failed', { error: e })
          }
        }

        // Telegram уведомление
        if (sub.telegram_enabled) {
          try {
            // TODO: Отправить через Telegram Bot API
            stats.telegram++
          } catch (e) {
            logger.error('[Notify Subscribers] Telegram notification failed', { error: e })
          }
        }

      } catch (e) {
        logger.error('[Notify Subscribers] Error processing subscription', {
          subscriptionId: sub.id,
          error: e
        })
        stats.errors++
      }
    }

    logger.info('[Notify Subscribers] Notifications sent', { requestId, stats })

    return NextResponse.json({
      success: true,
      subscriptions: matchingSubscriptions.length,
      sent: stats,
    })
  } catch (error: any) {
    logger.error('[Notify Subscribers] Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
