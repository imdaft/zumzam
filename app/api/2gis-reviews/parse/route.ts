import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 180 // 3 минуты

interface DgisReview {
  id: string
  author: {
    name: string
    avatar?: string
  }
  rating: number
  text: string
  date: string
  photos?: string[]
}

/**
 * POST /api/2gis-reviews/parse
 * Парсит отзывы с 2GIS и кеширует в БД с ограничениями:
 * - Успешный парсинг → блокировка на 3 дня
 * - Неудачный парсинг → интервал 10 минут, максимум 5 попыток в день
 */
export async function POST(request: Request) {
  logger.info('[Parse2GisReviews] ===== START =====')
  try {
    const body = await request.json()
    logger.info('[Parse2GisReviews] Request body:', body)
    
    const { location_id } = body

    if (!location_id) {
      logger.error('[Parse2GisReviews] Missing location_id')
      return NextResponse.json(
        { error: 'location_id is required' },
        { status: 400 }
      )
    }

    logger.info('[Parse2GisReviews] Parsing reviews for location:', location_id)

    // Получаем location с dgis_url
    const location = await prisma.profile_locations.findUnique({
      where: { id: location_id },
      select: {
        id: true,
        dgis_url: true
      }
    })

    if (!location || !location.dgis_url) {
      return NextResponse.json(
        { error: 'Location not found or dgis_url is missing' },
        { status: 404 }
      )
    }

    // Извлекаем FIRM_ID из URL
    const firmId = extractFirmIdFromUrl(location.dgis_url)
    
    if (!firmId) {
      return NextResponse.json(
        { error: 'Could not extract FIRM_ID from dgis_url' },
        { status: 400 }
      )
    }

    logger.info('[Parse2GisReviews] Extracted FIRM_ID:', firmId)

    // Проверяем кеш и ограничения
    const existingCache = await prisma.dgis_reviews_cache.findUnique({
      where: { profile_location_id: location_id }
    })

    const now = new Date()
    
    // Проверка 1: Успешный парсинг был менее 3 дней назад
    if (existingCache?.last_successful_parse_at) {
      const lastSuccess = new Date(existingCache.last_successful_parse_at)
      const daysSinceSuccess = (now.getTime() - lastSuccess.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceSuccess < 3) {
        const hoursLeft = Math.ceil((3 * 24 - daysSinceSuccess * 24) * 10) / 10
        logger.info('[Parse2GisReviews] ⏰ Too early! Last success:', lastSuccess)
        return NextResponse.json(
          { 
            error: 'Парсинг заблокирован',
            details: `После успешного парсинга можно повторить только через 3 дня. Осталось ≈${hoursLeft} часов.`,
            next_available_at: new Date(lastSuccess.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { status: 429 } // Too Many Requests
        )
      }
    }

    // Проверка 2: Последняя попытка была менее 10 минут назад
    if (existingCache?.last_attempt_at) {
      const lastAttempt = new Date(existingCache.last_attempt_at)
      const minutesSinceAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60)
      
      if (minutesSinceAttempt < 10) {
        const minutesLeft = Math.ceil(10 - minutesSinceAttempt)
        logger.info('[Parse2GisReviews] ⏰ Too early! Last attempt:', lastAttempt)
        return NextResponse.json(
          { 
            error: 'Слишком частые попытки',
            details: `Между попытками парсинга должен быть интервал 10 минут. Осталось ${minutesLeft} мин.`,
            next_available_at: new Date(lastAttempt.getTime() + 10 * 60 * 1000).toISOString(),
          },
          { status: 429 }
        )
      }
    }

    // Проверка 3: Сброс счётчика попыток, если новый день
    let attemptsToday = existingCache?.attempts_today || 0
    const resetDate = existingCache?.attempts_reset_at ? new Date(existingCache.attempts_reset_at) : null
    const today = new Date().toISOString().split('T')[0]
    
    if (!resetDate || resetDate.toISOString().split('T')[0] !== today) {
      // Новый день - сбрасываем счётчик
      attemptsToday = 0
    }

    // Проверка 4: Максимум 5 попыток в день
    if (attemptsToday >= 5) {
      logger.info('[Parse2GisReviews] ⛔ Daily limit reached:', attemptsToday)
      return NextResponse.json(
        { 
          error: 'Превышен лимит попыток',
          details: 'Максимум 5 попыток парсинга в день. Попробуйте завтра.',
          attempts_today: attemptsToday,
          next_available_at: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(), // Начало следующего дня
        },
        { status: 429 }
      )
    }

    // Обновляем счётчики ПЕРЕД попыткой парсинга
    await prisma.dgis_reviews_cache.upsert({
      where: { profile_location_id: location_id },
      create: {
        profile_location_id: location_id,
        dgis_firm_id: firmId,
        reviews: existingCache?.reviews || [],
        rating: existingCache?.rating || null,
        review_count: existingCache?.review_count || 0,
        parse_attempts: 1,
        last_attempt_at: now,
        attempts_today: 1,
        attempts_reset_at: new Date(today),
        last_successful_parse_at: null
      },
      update: {
        dgis_firm_id: firmId,
        parse_attempts: { increment: 1 },
        last_attempt_at: now,
        attempts_today: attemptsToday + 1,
        attempts_reset_at: new Date(today)
      }
    })

    // Парсим отзывы через Puppeteer
    logger.info('[Parse2GisReviews] Starting 2GIS parser...')
    let reviews, rating, reviewCount
    
    try {
      // TODO: Раскомментировать когда парсер будет готов
      // const { parse2GisReviewsWithPuppeteer } = await import('@/lib/2gis-parser')
      // const result = await parse2GisReviewsWithPuppeteer(location.dgis_url)
      
      // Временно используем mock-данные
      const result = getMock2GisReviews()
      
      logger.info('[Parse2GisReviews] Parser SUCCESS!')
      logger.info('[Parse2GisReviews] Reviews count:', result.reviews.length)
      logger.info('[Parse2GisReviews] Rating:', result.rating)
      
      reviews = result.reviews
      rating = result.rating
      reviewCount = result.reviewCount
    } catch (puppeteerError: any) {
      logger.error('[Parse2GisReviews] Parser error:', puppeteerError.message)
      
      // Парсинг НЕ УДАЛСЯ - не обновляем last_successful_parse_at
      return NextResponse.json(
        { 
          error: 'Ошибка парсинга',
          details: puppeteerError.message,
          attempts_today: attemptsToday + 1,
          remaining_attempts: 5 - (attemptsToday + 1),
        },
        { status: 500 }
      )
    }
    
    logger.info('[Parse2GisReviews] Parsed', reviews.length, 'reviews')

    // Вычисляем средний рейтинг
    const finalRating = rating || (reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : null)

    // Парсинг УСПЕШЕН - сохраняем и обновляем last_successful_parse_at
    await prisma.dgis_reviews_cache.update({
      where: { profile_location_id: location_id },
      data: {
        reviews: reviews as any, // JSONB
        rating: finalRating ? parseFloat(finalRating.toFixed(1)) : null,
        review_count: reviewCount,
        last_successful_parse_at: now, // ✅ Успешный парсинг!
        last_parsed_at: now
      }
    })

    logger.info('[Parse2GisReviews] ✅ Successfully cached', reviews.length, 'reviews')

    return NextResponse.json({ 
      success: true, 
      reviews_count: reviews.length,
      rating: finalRating,
      next_parse_available_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Через 3 дня
    })

  } catch (error: any) {
    logger.error('[Parse2GisReviews] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Извлекает FIRM_ID из URL 2GIS
 */
function extractFirmIdFromUrl(url: string): string | null {
  try {
    // Варианты URL:
    // https://2gis.ru/moscow/firm/70000001021105874
    // https://2gis.ru/firm/70000001021105874
    // https://2gis.ru/moscow/firm/70000001021105874/tab/reviews
    
    const match = url.match(/\/firm\/(\d+)/)
    if (match) return match[1]
    
    return null
  } catch {
    return null
  }
}

/**
 * Mock-данные для демонстрации
 */
function getMock2GisReviews() {
  return {
    reviews: [
      {
        id: 'mock_2gis_1',
        author: { name: 'Анна Петрова', avatar: undefined },
        rating: 5,
        text: 'Отличное место! Дети в восторге, персонал очень доброжелательный. Обязательно вернёмся снова!',
        date: new Date().toISOString(),
        businessComment: {
          text: 'Анна, благодарим за отзыв! Рады, что вам понравилось. Ждём вас снова! 🎉',
          date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        id: 'mock_2gis_2',
        author: { name: 'Дмитрий Соколов', avatar: undefined },
        rating: 5,
        text: 'Провели день рождения сына - всё прошло отлично! Спасибо большое команде за организацию.',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock_2gis_3',
        author: { name: 'Елена Иванова', avatar: undefined },
        rating: 4,
        text: 'Хорошее место, но хотелось бы больше разнообразия в меню. В целом рекомендую!',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    rating: 4.7,
    reviewCount: 3,
  }
}
