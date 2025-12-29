import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/settings/notifications/email-verify - отправить код верификации email
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
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Генерация 6-значного кода
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Сохранение кода в БД (срок действия 15 минут)
    await prisma.email_verification_codes.create({
      data: {
        user_id: payload.sub,
        email,
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 минут
      }
    })

    // TODO: Отправка email с кодом
    console.log(`Verification code for ${email}: ${code}`)
    // await sendVerificationEmail(email, code)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email'
    })
  } catch (error: any) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: 'Failed to send code', details: error.message },
      { status: 500 }
    )
  }
}



