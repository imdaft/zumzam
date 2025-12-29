import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/board-subscriptions/[id]
 * Получение одной подписки
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем подписку
    const subscription = await prisma.board_subscriptions.findFirst({
      where: {
        id,
        user_id: userId
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    return NextResponse.json({ subscription })
  } catch (error: any) {
    logger.error('[Board Subscriptions] Error fetching subscription', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/board-subscriptions/[id]
 * Обновление подписки
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Проверяем, что подписка принадлежит пользователю
    const existing = await prisma.board_subscriptions.findFirst({
      where: {
        id,
        user_id: userId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Формируем данные для обновления
    const updateData: any = {
      updated_at: new Date()
    }

    if (body.category !== undefined) updateData.category = body.category
    if (body.city !== undefined) updateData.city = body.city
    if (body.budget_min !== undefined) updateData.budget_min = body.budget_min ? parseFloat(body.budget_min) : null
    if (body.budget_max !== undefined) updateData.budget_max = body.budget_max ? parseFloat(body.budget_max) : null
    if (body.notification_enabled !== undefined) updateData.notification_enabled = body.notification_enabled
    if (body.email_enabled !== undefined) updateData.email_enabled = body.email_enabled
    if (body.telegram_enabled !== undefined) updateData.telegram_enabled = body.telegram_enabled

    // Обновляем подписку
    const subscription = await prisma.board_subscriptions.update({
      where: { id },
      data: updateData
    })

    logger.info('[Board Subscriptions] Subscription updated', {
      subscriptionId: id,
      userId
    })

    return NextResponse.json({ subscription })
  } catch (error: any) {
    logger.error('[Board Subscriptions] Error updating subscription', { error })
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/board-subscriptions/[id]
 * Удаление подписки
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Проверяем, что подписка принадлежит пользователю
    const existing = await prisma.board_subscriptions.findFirst({
      where: {
        id,
        user_id: userId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Удаляем подписку
    await prisma.board_subscriptions.delete({
      where: { id }
    })

    logger.info('[Board Subscriptions] Subscription deleted', {
      subscriptionId: id,
      userId
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Board Subscriptions] Error deleting subscription', { error })
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}
