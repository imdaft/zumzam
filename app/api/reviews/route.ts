import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { triggerEmbeddingRegeneration } from '@/lib/ai/trigger-embedding-regeneration'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/reviews - Получить список отзывов
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const profile_id = searchParams.get('profile_id')
  const author_id = searchParams.get('author_id')
  const rating_min = searchParams.get('rating_min')
  const rating_max = searchParams.get('rating_max')
  const is_approved = searchParams.get('is_approved')
  const sort = searchParams.get('sort') || 'recent'
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Фильтры для Prisma
    const where: any = {}
    
    if (profile_id) {
      where.profile_id = profile_id
    }
    if (author_id) {
      where.user_id = author_id
    }
    if (rating_min && rating_max) {
      where.rating = {
        gte: parseInt(rating_min),
        lte: parseInt(rating_max),
      }
    } else if (rating_min) {
      where.rating = { gte: parseInt(rating_min) }
    } else if (rating_max) {
      where.rating = { lte: parseInt(rating_max) }
    }
    if (is_approved === 'true') {
      where.is_approved = true
    } else if (is_approved === 'false') {
      where.is_approved = false
    }

    // Сортировка
    let orderBy: any = { created_at: 'desc' }
    switch (sort) {
      case 'recent':
        orderBy = { created_at: 'desc' }
        break
      case 'rating_high':
        orderBy = { rating: 'desc' }
        break
      case 'rating_low':
        orderBy = { rating: 'asc' }
        break
    }

    // Получаем отзывы с профилями
    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        include: {
          profiles: {
            select: {
              id: true,
              slug: true,
              display_name: true,
              cover_photo: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.reviews.count({ where }),
    ])

    return NextResponse.json({ 
      reviews, 
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    logger.error('Get reviews error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews - Создать новый отзыв
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      profile_id,
      rating,
      comment,
    } = body

    // Валидация
    if (!profile_id || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Проверка что профиль существует
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { id: true, user_id: true }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Нельзя оставлять отзыв самому себе
    if (profile.user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot review your own profile' },
        { status: 400 }
      )
    }

    // Проверка что пользователь ещё не оставлял отзыв на этот профиль
    const existingReview = await prisma.reviews.findFirst({
      where: {
        profile_id,
        user_id: userId
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this profile' },
        { status: 400 }
      )
    }

    // Создание отзыва
    const review = await prisma.reviews.create({
      data: {
        profile_id,
        user_id: userId,
        rating,
        comment,
      },
      include: {
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
          }
        }
      }
    })

    // Обновление рейтинга профиля
    await updateProfileRating(profile_id)

    // Триггерим регенерацию embeddings для профиля
    triggerEmbeddingRegeneration(profile_id)

    return NextResponse.json({
      review,
      message: 'Review created successfully. It will be published after moderation.',
    }, { status: 201 })
  } catch (error: any) {
    logger.error('Create review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    )
  }
}

/**
 * Обновление рейтинга профиля на основе отзывов
 */
async function updateProfileRating(profileId: string) {
  try {
    const reviews = await prisma.reviews.findMany({
      where: { profile_id: profileId },
      select: { rating: true }
    })

    if (!reviews || reviews.length === 0) {
      await prisma.profiles.update({
        where: { id: profileId },
        data: { rating: 0, reviews_count: 0 }
      })
      return
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / reviews.length

    await prisma.profiles.update({
      where: { id: profileId },
      data: {
        rating: Number(avgRating.toFixed(1)),
        reviews_count: reviews.length,
      }
    })
  } catch (error: any) {
    logger.error('Update profile rating error:', error)
  }
}
