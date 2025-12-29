import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/errors
 * Логирование ошибок с клиента
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Сохраняем ошибку в БД (если есть таблица)
    // Пока просто логируем в консоль
    console.error('[Client Error]', {
      message: body.message,
      url: body.url,
      userAgent: body.userAgent,
      stack: body.stack,
      timestamp: body.timestamp || new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Error API] Failed to log error:', error)
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    )
  }
}

