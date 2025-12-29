import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * POST /api/subscriptions/check-feature
 * Проверка доступа к функции по подписке
 * 
 * Body: { feature: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase client removed

    // Проверяем авторизацию
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
    const { feature } = body

    if (!feature) {
      return NextResponse.json(
        { error: 'Не указана функция для проверки' },
        { status: 400 }
      )
    }

    // ⚠️ ВРЕМЕННО: подписки ещё не введены в прод-логику.
    // Чтобы не блокировать продукт и не ломать UX, открываем доступ ко всем фичам.
    // Когда подписки будут включены — вернём проверку через БД функцию has_subscription_feature().
    return NextResponse.json({
      feature,
      hasAccess: true,
    })
  } catch (error) {
    console.error('[Subscriptions API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

