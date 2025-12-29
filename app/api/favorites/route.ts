import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/favorites
 * Получение списка избранных профилей текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await prisma.favorites.findMany({
      where: {
        user_id: userId,
      },
      include: {
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            category: true,
            city: true,
            rating: true,
            reviews_count: true,
            main_photo: true,
            photos: true,
            price_range: true,
            tags: true,
            verified: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100,
    })

    // Преобразуем в формат, ожидаемый фронтендом
    const formattedFavorites = favorites
      .filter((fav) => fav.profiles) // Фильтруем удаленные профили
      .map((fav) => {
        // Парсим price_range для получения минимальной цены
        let priceFrom = 0
        if (fav.profiles?.price_range) {
          const match = fav.profiles.price_range.match(/от\s*(\d+)/i)
          if (match) {
            priceFrom = parseInt(match[1], 10)
          }
        }

        // Формируем массив фото: main_photo + photos
        const photos = fav.profiles?.main_photo
          ? [fav.profiles.main_photo, ...(fav.profiles.photos || [])]
          : fav.profiles?.photos || []

        return {
          id: fav.id,
          notes: null, // Поле notes отсутствует в схеме Prisma
          created_at: fav.created_at?.toISOString() || null,
          profile: fav.profiles
            ? {
                id: fav.profiles.id,
                slug: fav.profiles.slug,
                display_name: fav.profiles.display_name,
                category: fav.profiles.category,
                city: fav.profiles.city,
                rating: fav.profiles.rating || 0,
                reviews_count: fav.profiles.reviews_count || 0,
                main_photo: fav.profiles.main_photo,
                photos: photos,
                priceFrom: priceFrom,
                tags: fav.profiles.tags || [],
                verified: fav.profiles.verified || false,
              }
            : null,
        }
      })

    return NextResponse.json(formattedFavorites)
  } catch (error: any) {
    logger.error('[Favorites API] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error?.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/favorites - Добавить профиль в избранное
 * Body: { profile_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profile_id } = body

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    // Проверяем, что профиль существует
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Создаём или игнорируем если уже есть
    try {
      await prisma.favorites.create({
        data: {
          user_id: userId,
          profile_id: profile_id,
        },
      })
    } catch (error: any) {
      // Если уже существует (unique constraint), игнорируем
      if (error.code === 'P2002') {
        return NextResponse.json({ success: true, message: 'Already in favorites' })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Favorites API] POST error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/favorites?profile_id=... - Удалить профиль из избранного
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    await prisma.favorites.deleteMany({
      where: {
        user_id: userId,
        profile_id: profile_id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Favorites API] DELETE error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
