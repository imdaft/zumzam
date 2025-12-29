import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/favorites/[id]
 * Удаление избранного профиля
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Проверяем, что избранное принадлежит текущему пользователю
    const favorite = await prisma.favorites.findUnique({
      where: { id },
      select: { user_id: true },
    })

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    if (favorite.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем избранное
    await prisma.favorites.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Favorites API] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error?.message },
      { status: 500 }
    )
  }
}




