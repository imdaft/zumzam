import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/board-listing-plans
 * Получение списка тарифов размещения объявлений
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Таблица board_listing_plans отсутствует в Prisma
    // Возвращаем заглушку с базовыми тарифами
    logger.warn('[Board Listing Plans] board_listing_plans table not found in schema, returning stub plans')

    return NextResponse.json({
      plans: [
        {
          id: 'free',
          slug: 'free',
          name: 'Бесплатный',
          price: 0,
          duration_days: 7,
          is_active: true,
          display_order: 0,
        },
        {
          id: 'standard',
          slug: 'standard',
          name: 'Стандарт',
          price: 500,
          duration_days: 30,
          is_active: true,
          display_order: 1,
        }
      ]
    })
  } catch (error: any) {
    logger.error('[Board Listing Plans] Unexpected error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

