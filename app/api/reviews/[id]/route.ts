import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/reviews/[id] - Получить один отзыв
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const review = await prisma.reviews.findUnique({
      where: { id },
      include: {
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            cover_photo: true,
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('Get review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reviews/[id] - Обновить отзыв
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Проверка авторизации через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    const body = await request.json()
    const { comment, photos, rating } = body

    // Получаем текущий отзыв
    const currentReview = await prisma.reviews.findUnique({
      where: { id },
      select: { id: true, user_id: true, profile_id: true }
    })

    if (!currentReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Проверка прав доступа (только автор)
    const isAuthor = currentReview.user_id === userId

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    const isAdmin = user?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Формируем данные для обновления
    const updateData: any = {}

    if (isAuthor) {
      if (comment !== undefined) {
        updateData.comment = comment
      }
      if (rating !== undefined) {
        updateData.rating = rating
      }
    }

    // Обновление отзыва
    const review = await prisma.reviews.update({
      where: { id },
      data: updateData,
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

    // Обновляем рейтинг профиля
    await updateProfileRating(currentReview.profile_id)

    return NextResponse.json({
      review,
      message: 'Review updated successfully',
    })
  } catch (error: any) {
    console.error('Update review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/[id] - Удалить отзыв
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Проверка авторизации через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем текущий отзыв
    const currentReview = await prisma.reviews.findUnique({
      where: { id },
      select: { id: true, user_id: true, profile_id: true }
    })

    if (!currentReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Только автор или админ может удалить
    const isAuthor = currentReview.user_id === userId

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    const isAdmin = user?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Удаление
    await prisma.reviews.delete({
      where: { id }
    })

    // Обновляем рейтинг профиля
    await updateProfileRating(currentReview.profile_id)

    return NextResponse.json({
      message: 'Review deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    )
  }
}

/**
 * Обновление рейтинга профиля
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
  } catch (error) {
    console.error('Update profile rating error:', error)
  }
}
