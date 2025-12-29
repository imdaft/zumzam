import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/subscriptions
 * Получить список всех подписок
 */
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

    // Проверяем роль админа
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const city = searchParams.get('city')

    const skip = (page - 1) * limit

    // Формируем WHERE условие
    const where: any = {}
    if (category) where.category = category
    if (city) where.city = city

    // Получаем подписки с информацией о пользователях
    const [subscriptions, total] = await Promise.all([
      prisma.board_subscriptions.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              full_name: true,
              phone: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.board_subscriptions.count({ where })
    ])

    // Конвертируем Decimal в number
    const subscriptionsWithNumbers = subscriptions.map(sub => ({
      ...sub,
      budget_min: sub.budget_min ? Number(sub.budget_min) : null,
      budget_max: sub.budget_max ? Number(sub.budget_max) : null
    }))

    return NextResponse.json({
      subscriptions: subscriptionsWithNumbers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    logger.error('[Admin Subscriptions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/subscriptions
 * Удалить подписку
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { subscription_id } = body

    if (!subscription_id) {
      return NextResponse.json({ error: 'subscription_id is required' }, { status: 400 })
    }

    await prisma.board_subscriptions.delete({
      where: { id: subscription_id }
    })

    logger.info('[Admin Subscriptions] Deleted subscription:', subscription_id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Admin Subscriptions DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription', details: error.message },
      { status: 500 }
    )
  }
}



