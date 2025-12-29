import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/settings/notifications/email-confirm - подтвердить email кодом
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
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Поиск кода
    const verificationCode = await prisma.email_verification_codes.findFirst({
      where: {
        user_id: payload.sub,
        code,
        used: false,
        expires_at: {
          gte: new Date()
        }
      }
    })

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    // Отметить код как использованный
    await prisma.email_verification_codes.update({
      where: { id: verificationCode.id },
      data: { used: true }
    })

    // Обновить настройки уведомлений
    await prisma.notification_settings.upsert({
      where: { user_id: payload.sub },
      update: {
        email_verified: true,
        enabled_email: true
      },
      create: {
        user_id: payload.sub,
        email_verified: true,
        enabled_email: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error: any) {
    console.error('Error confirming email:', error)
    return NextResponse.json(
      { error: 'Failed to confirm email', details: error.message },
      { status: 500 }
    )
  }
}



