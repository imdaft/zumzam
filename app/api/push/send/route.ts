import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'
import webpush from 'web-push'

// Настройка VAPID ключей (генерируются командой: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@zumzam.ru'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

/**
 * POST /api/push/send
 * Отправка push-уведомления пользователю
 * 
 * Body:
 * {
 *   userId: string,
 *   title: string,
 *   body: string,
 *   icon?: string,
 *   badge?: string,
 *   url?: string
 * }
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

    // Только админы могут отправлять push-уведомления через этот endpoint
    // (для автоматических уведомлений используйте другую логику)
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, title, body, icon, badge, url } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      )
    }

    // Проверяем наличие VAPID ключей
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Push notifications not configured. Set VAPID keys in environment.' },
        { status: 500 }
      )
    }

    // Получаем подписки пользователя
    try {
      const subscriptions = await (prisma as any).push_subscriptions.findMany({
        where: { user_id: userId }
      })

      if (subscriptions.length === 0) {
        return NextResponse.json(
          { error: 'No push subscriptions found for this user' },
          { status: 404 }
        )
      }

      const payload_data = {
        title,
        body,
        icon: icon || '/icons/icon-192x192.png',
        badge: badge || '/icons/badge-72x72.png',
        url: url || '/',
        timestamp: Date.now()
      }

      // Отправляем push-уведомление на все подписки пользователя
      const results = await Promise.allSettled(
        subscriptions.map((sub: any) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          }

          return webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload_data)
          )
        })
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      return NextResponse.json({
        success: true,
        sent: successful,
        failed: failed,
        total: subscriptions.length
      })
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Push subscriptions table not migrated yet' },
          { status: 500 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('[Push Send] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send push notification', details: error.message },
      { status: 500 }
    )
  }
}
