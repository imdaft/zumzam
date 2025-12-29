import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/analytics/interest
 * Обновить интересы пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    // Интересы сохраняем только для авторизованных пользователей
    if (!userId) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const { interest_type, interest_value } = await request.json()

    if (!interest_type || !interest_value) {
      return NextResponse.json({ error: 'Interest type and value required' }, { status: 400 })
    }

    // TODO: Таблица user_interests имеет unique constraint на [user_id, interest_type, interest_value]
    // но нам нужен constraint только на [user_id, interest_type] для upsert
    // Пока просто создаем новую запись
    try {
      await prisma.user_interests.create({
        data: {
          user_id: userId,
          interest_type,
          interest_value: interest_value as any,
        },
      })
    } catch (e: any) {
      // Игнорируем ошибки уникальности - запись уже существует
      if (e.code !== 'P2002') {
        throw e
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    logger.error('[Analytics Interest] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to update interest', 
      details: error.message 
    }, { status: 500 })
  }
}
