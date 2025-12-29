import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/yandex-reviews/parse - парсинг отзывов с Яндекс.Карт
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { profile_id, yandex_maps_url } = body

    if (!profile_id || !yandex_maps_url) {
      return NextResponse.json(
        { error: 'profile_id and yandex_maps_url are required' },
        { status: 400 }
      )
    }

    // Проверка прав
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { user_id: true }
    })

    if (!profile || profile.user_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // TODO: Парсинг отзывов с Яндекс.Карт
    // Можно использовать:
    // 1. Официальный API Яндекс.Карт (если есть доступ)
    // 2. Puppeteer для scraping (осторожно с ToS)
    // 3. Сторонний сервис парсинга
    //
    // const reviews = await parseYandexReviews(yandex_maps_url)
    // const imported = await importReviewsToProfile(profile_id, reviews)

    return NextResponse.json({
      success: true,
      imported: 0,
      message: 'Yandex Reviews parsing is in development. Use manual review import for now.'
    })
  } catch (error: any) {
    console.error('Error parsing Yandex reviews:', error)
    return NextResponse.json(
      { error: 'Failed to parse reviews', details: error.message },
      { status: 500 }
    )
  }
}



