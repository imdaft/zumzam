import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * POST /api/subscriptions/check-limit
 * Проверка лимита использования по подписке
 * 
 * Body: { limitType: 'profiles' | 'orders' | 'ai_requests', increment?: number }
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

    const userId = payload.sub as string

    const body = await request.json()
    const { limitType, increment = 1 } = body

    if (!limitType) {
      return NextResponse.json(
        { error: 'Не указан тип лимита' },
        { status: 400 }
      )
    }

    // ⚠️ ВРЕМЕННО: лимиты по подписке ещё не включены.
    // Разрешаем все действия, чтобы не блокировать продукт.
    return NextResponse.json({
      limitType,
      canProceed: true,
    })
  } catch (error) {
    console.error('[Subscriptions API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

