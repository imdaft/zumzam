import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/telegram/connect - подключить Telegram для уведомлений
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

    const body = await request.json()
    const { telegram_id, telegram_username } = body

    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 })
    }

    // Обновить настройки уведомлений
    await prisma.notification_settings.upsert({
      where: { user_id: payload.sub },
      update: {
        telegram_chat_id: telegram_id.toString(),
        telegram_username,
        telegram_verified: true,
        enabled_telegram: true
      },
      create: {
        user_id: payload.sub,
        telegram_chat_id: telegram_id.toString(),
        telegram_username,
        telegram_verified: true,
        enabled_telegram: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Telegram connected successfully'
    })
  } catch (error: any) {
    console.error('Error connecting Telegram:', error)
    return NextResponse.json(
      { error: 'Failed to connect Telegram', details: error.message },
      { status: 500 }
    )
  }
}



