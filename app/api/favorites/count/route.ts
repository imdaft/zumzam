import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/favorites/count
 * Получение количества избранных профилей
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Подсчитываем количество избранного
    const count = await prisma.favorites.count({
      where: {
        user_id: userId,
      },
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    logger.error('[Favorites API] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error?.message },
      { status: 500 }
    )
  }
}
