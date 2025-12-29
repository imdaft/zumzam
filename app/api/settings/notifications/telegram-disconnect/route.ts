import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/settings/notifications/telegram-disconnect - отключить Telegram
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

    // Отключить Telegram в настройках
    await prisma.notification_settings.updateMany({
      where: { user_id: payload.sub },
      data: {
        telegram_verified: false,
        telegram_chat_id: null,
        enabled_telegram: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Telegram disconnected successfully'
    })
  } catch (error: any) {
    console.error('Error disconnecting Telegram:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Telegram', details: error.message },
      { status: 500 }
    )
  }
}



