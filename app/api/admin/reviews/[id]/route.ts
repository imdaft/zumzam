import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * PATCH /api/admin/reviews/[id]
 * Обновить статус отзыва (одобрить/отклонить)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const token = request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Валидируем данные
    const body = await request.json()
    const parsedData = updateReviewSchema.parse(body)

    // Обновляем отзыв
    const updatedReview = await prisma.reviews.update({
      where: { id },
      data: {
        status: parsedData.status,
        updated_at: new Date()
      }
    })

    // Если одобрен, пересчитываем рейтинг профиля
    if (parsedData.status === 'approved') {
      const reviews = await prisma.reviews.findMany({
        where: {
          profile_id: updatedReview.profile_id,
          status: 'approved'
        },
        select: { rating: true }
      })

      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        
        await prisma.profiles.update({
          where: { id: updatedReview.profile_id },
          data: {
            rating: avgRating,
            reviews_count: reviews.length
          }
        })
      }
    }

    logger.info('[Admin Review PATCH] Review updated:', id)
    return NextResponse.json({ review: updatedReview })
  } catch (error: any) {
    logger.error('[Admin Review PATCH] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to update review', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/reviews/[id]
 * Удалить отзыв
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const token = request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем отзыв перед удалением
    const review = await prisma.reviews.findUnique({
      where: { id },
      select: { profile_id: true }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Удаляем отзыв
    await prisma.reviews.delete({
      where: { id }
    })

    // Пересчитываем рейтинг профиля
    const reviews = await prisma.reviews.findMany({
      where: {
        profile_id: review.profile_id,
        status: 'approved'
      },
      select: { rating: true }
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    await prisma.profiles.update({
      where: { id: review.profile_id },
      data: {
        rating: avgRating,
        reviews_count: reviews.length
      }
    })

    logger.info('[Admin Review DELETE] Review deleted:', id)
    return NextResponse.json({ message: 'Review deleted' })
  } catch (error: any) {
    logger.error('[Admin Review DELETE] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete review', 
      details: error.message 
    }, { status: 500 })
  }
}
