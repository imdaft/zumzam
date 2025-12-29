import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/subscriptions/current
 * Получение текущей активной подписки пользователя
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

    // TODO: Таблицы subscriptions и subscription_plans отсутствуют в Prisma
    // Возвращаем заглушку с FREE планом
    logger.warn('[Subscriptions API] subscriptions table not found in schema, returning free plan stub')
    
    return NextResponse.json({
      subscription: null,
      plan: {
        id: 'free',
        slug: 'free',
        name: 'Бесплатный',
        price: 0,
        features: [],
        is_active: true,
      },
      isFree: true
    })
  } catch (error: any) {
    logger.error('[Subscriptions API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
