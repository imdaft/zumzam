import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

/**
 * POST /api/auth/forgot-password
 * Создаёт токен восстановления пароля и логирует ссылку в консоль
 * (В production нужно настроить отправку email)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      )
    }

    // Ищем пользователя
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true }
    })

    // Не раскрываем, существует ли email (безопасность)
    if (!user) {
      console.log(`[Forgot Password] User not found: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Если email зарегистрирован, вы получите ссылку для восстановления'
      })
    }

    // Генерируем безопасный токен
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 час

    // Сохраняем токен в БД
    await prisma.$executeRaw`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}::uuid, ${token}, ${expiresAt})
    `

    // Формируем ссылку для восстановления
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'
    const resetLink = `${appUrl}/reset-password?token=${token}`

    // Отправляем email через универсальный модуль
    const { sendPasswordResetEmail } = await import('@/lib/email/send')
    const emailResult = await sendPasswordResetEmail(user.email, token)
    
    if (!emailResult.success) {
      console.error('[Forgot Password] Failed to send email:', emailResult.error)
      // Не раскрываем детали пользователю из соображений безопасности
    }

    return NextResponse.json({
      success: true,
      message: 'Если email зарегистрирован, вы получите ссылку для восстановления'
    })
  } catch (error: any) {
    console.error('[Forgot Password] Error:', error)
    console.error('[Forgot Password] Error message:', error.message)
    console.error('[Forgot Password] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Произошла ошибка при создании ссылки',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

