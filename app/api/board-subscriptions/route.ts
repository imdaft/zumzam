import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/board-subscriptions
 * Получение списка подписок текущего пользователя
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

    // Получаем подписки пользователя
    const subscriptions = await prisma.board_subscriptions.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ subscriptions })
  } catch (error: any) {
    logger.error('[Board Subscriptions] Error fetching subscriptions', { error })
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/board-subscriptions
 * Создание новой подписки
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

    // Валидация
    if (!body.category && !body.city) {
      return NextResponse.json(
        { error: 'Необходимо указать хотя бы один фильтр (category или city)' },
        { status: 400 }
      )
    }

    // Проверяем лимит подписок (макс 10 на пользователя)
    const count = await prisma.board_subscriptions.count({
      where: { user_id: userId }
    })

    if (count >= 10) {
      return NextResponse.json(
        { error: 'Достигнут лимит подписок (максимум 10)' },
        { status: 400 }
      )
    }

    // Создаём подписку
    const subscription = await prisma.board_subscriptions.create({
      data: {
        user_id: userId,
        category: body.category || null,
        city: body.city || null,
        budget_min: body.budget_min ? parseFloat(body.budget_min) : null,
        budget_max: body.budget_max ? parseFloat(body.budget_max) : null,
        notification_enabled: body.notification_enabled ?? true,
        email_enabled: body.email_enabled ?? false,
        telegram_enabled: body.telegram_enabled ?? false,
      }
    })

    logger.info('[Board Subscriptions] Subscription created', {
      subscriptionId: subscription.id,
      userId
    })

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error: any) {
    logger.error('[Board Subscriptions] Error creating subscription', { error })
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
