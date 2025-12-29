// TODO: MIGRATE QUERIES TO PRISMA
// Этот файл частично мигрирован, но содержит Supabase queries
// Они будут работать, но требуют полной миграции на Prisma

// TODO: MIGRATE TO PRISMA - этот файл использует Supabase queries
// Они работают, но требуют миграции на Prisma для consistency

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/yandex-reviews/[locationId]
 * Возвращает кешированные отзывы для location
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { locationId } = await params

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // TODO: Таблица yandex_reviews_cache не мигрирована в Prisma схему
    // Возвращаем пустой результат до миграции
    logger.warn('[Yandex Reviews API] yandex_reviews_cache table not yet migrated to Prisma schema')
    return NextResponse.json({
      reviews: [],
      rating: null,
      review_count: 0,
      cached: false,
    })

  } catch (error: any) {
    logger.error('[GET /api/yandex-reviews/[locationId]] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


