import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/subscriptions/plans
 * Получение списка тарифных планов
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Таблица subscription_plans отсутствует в Prisma
    // Возвращаем заглушку с базовыми планами
    logger.warn('[Subscriptions API] subscription_plans table not found in schema, returning stub plans')
    
    return NextResponse.json({
      plans: [
        {
          id: 'free',
          slug: 'free',
          name: 'Бесплатный',
          price: 0,
          features: [],
          is_active: true,
          display_order: 0,
        }
      ]
    })
  } catch (error: any) {
    logger.error('[Subscriptions API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
