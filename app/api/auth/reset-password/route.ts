import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/reset-password
 * Обновляет пароль пользователя по токену восстановления
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    console.log('[Reset Password] Request received, token length:', token?.length || 0)

    if (!token) {
      console.log('[Reset Password] Error: Token missing')
      return NextResponse.json(
        { error: 'Токен обязателен' },
        { status: 400 }
      )
    }

    if (!password) {
      console.log('[Reset Password] Error: Password missing')
      return NextResponse.json(
        { error: 'Пароль обязателен' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log('[Reset Password] Error: Password too short')
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    console.log('[Reset Password] Validations passed, looking up token...')

    // Ищем токен в базе
    const resetToken = await prisma.$queryRaw<Array<{
      id: string
      user_id: string
      expires_at: Date
      used_at: Date | null
    }>>`
      SELECT id, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token = ${token}
      LIMIT 1
    `

    console.log('[Reset Password] Token lookup result:', resetToken.length > 0 ? 'Found' : 'Not found')

    if (!resetToken || resetToken.length === 0) {
      console.log('[Reset Password] Error: Token not found in database')
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 400 }
      )
    }

    const tokenData = resetToken[0]
    console.log('[Reset Password] Token data:', { 
      user_id: tokenData.user_id, 
      used_at: tokenData.used_at,
      expires_at: tokenData.expires_at 
    })

    // Проверяем, не использован ли токен
    if (tokenData.used_at) {
      console.log('[Reset Password] Error: Token already used')
      return NextResponse.json(
        { error: 'Токен уже использован' },
        { status: 400 }
      )
    }

    // Проверяем, не истёк ли токен
    if (new Date() > tokenData.expires_at) {
      console.log('[Reset Password] Error: Token expired')
      return NextResponse.json(
        { error: 'Токен истёк. Запросите новую ссылку.' },
        { status: 400 }
      )
    }

    console.log('[Reset Password] Token is valid, hashing new password...')

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('[Reset Password] Password hashed, hash starts with:', hashedPassword.substring(0, 10))

    // Обновляем пароль пользователя
    await prisma.users.update({
      where: { id: tokenData.user_id },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date()
      }
    })
    console.log('[Reset Password] User password updated in database')

    // Помечаем токен как использованный
    await prisma.$executeRaw`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = ${tokenData.id}::uuid
    `
    console.log('[Reset Password] Token marked as used')

    console.log(`[Reset Password] ✅ SUCCESS! Password updated for user: ${tokenData.user_id}`)

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно обновлен'
    })
  } catch (error) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { error: 'Произошла ошибка при обновлении пароля' },
      { status: 500 }
    )
  }
}

