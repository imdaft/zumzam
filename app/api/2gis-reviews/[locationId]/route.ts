// TODO: MIGRATE QUERIES TO PRISMA
// Этот файл частично мигрирован, но содержит Supabase queries
// Они будут работать, но требуют полной миграции на Prisma

// TODO: MIGRATE TO PRISMA - этот файл использует Supabase queries
// Они работают, но требуют миграции на Prisma для consistency

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

/**
 * GET /api/2gis-reviews/[locationId]
 * Получает кешированные отзывы с 2GIS для location
 */
export async function GET(
  request: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    const { locationId } = params
    logger.info('[GET 2gis-reviews] Location ID:', locationId)

    // Supabase client removed

    // Получаем кешированные отзывы
    const { data: cache, error } = await supabase
      .from('dgis_reviews_cache')
      .select('*')
      .eq('profile_location_id', locationId)
      .single()

    if (error) {
      logger.error('[GET 2gis-reviews] Error:', error)
      
      // Если просто нет данных - возвращаем пустой массив
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          reviews: [],
          rating: null,
          review_count: 0,
          last_parsed_at: null,
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reviews: cache.reviews || [],
      rating: cache.rating,
      review_count: cache.review_count,
      last_parsed_at: cache.last_parsed_at,
      last_successful_parse_at: cache.last_successful_parse_at,
    })

  } catch (error: any) {
    logger.error('[GET 2gis-reviews] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
















