import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

/**
 * POST /api/push/subscribe
 * Сохранение Push-подписки для пользователя
 */
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

    const userId = payload.sub
    const subscription = await request.json()

    // Проверяем, существует ли таблица push_subscriptions
    try {
      // Удаляем старые подписки этого пользователя (если есть)
      await (prisma as any).push_subscriptions.deleteMany({
        where: { user_id: userId }
      })

      // Сохраняем новую подписку
      await (prisma as any).push_subscriptions.create({
        data: {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          created_at: new Date()
        }
      })

      return NextResponse.json({ success: true })
    } catch (error: any) {
      // Если таблица не существует, возвращаем успех (миграция ещё не применена)
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('[Push Subscribe] push_subscriptions table not migrated yet')
        return NextResponse.json({ success: true, warning: 'Push subscriptions not enabled yet' })
      }
      throw error
    }
  } catch (error: any) {
    console.error('[Push Subscribe] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/push/subscribe
 * Удаление Push-подписки
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    try {
      await (prisma as any).push_subscriptions.deleteMany({
        where: { user_id: userId }
      })

      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('[Push Unsubscribe] push_subscriptions table not migrated yet')
        return NextResponse.json({ success: true })
      }
      throw error
    }
  } catch (error: any) {
    console.error('[Push Unsubscribe] Error:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription', details: error.message },
      { status: 500 }
    )
  }
}
