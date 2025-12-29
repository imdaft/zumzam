import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * GET /api/notifications
 * Получение уведомлений текущего пользователя
 * 
 * TODO: Требуется таблица notifications
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    const searchParams = new URL(request.url).searchParams
    const limitParam = searchParams.get('limit')
    const limitRaw = limitParam ? Number(limitParam) : NaN
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 100) : 20

    try {
      const notificationsRaw = await prisma.notifications.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit
      })

      // Маппим для совместимости с frontend (link -> action_url, используем поле read из БД)
      const notifications = notificationsRaw.map(n => ({
        ...n,
        action_url: n.link,
        // read уже есть в БД как Boolean, просто пробрасываем
        body: n.message, // Для совместимости со старым кодом
      }))

      return NextResponse.json({ notifications: notifications || [] })
    } catch (error) {
      console.warn('[Notifications API] Table notifications not migrated, returning empty array')
      return NextResponse.json({ notifications: [] })
    }
  } catch (error: unknown) {
    console.error('[Notifications API] Unexpected error:', error)
    const details = error instanceof Error ? error.message : undefined
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details },
      { status: 500 }
    )
  }
}
