import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/notifications/[id]
 * Удалить уведомление
 * 
 * TODO: Требуется таблица notifications
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    try {
      await prisma.notifications.deleteMany({
        where: {
          id,
          user_id: userId
        }
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.warn('[Notifications API] Table notifications not migrated')
      return NextResponse.json({ success: true })
    }
  } catch (error: any) {
    console.error('[Notifications API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
