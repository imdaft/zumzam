import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signJWT } from '@/lib/auth/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Ищем пользователя
    console.log('==================== LOGIN API ====================')
    console.log('Email:', email)
    console.log('===================================================')
    
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        password_hash: true,
      },
    })
    
    console.log('User found:', !!user)
    console.log('Has password_hash:', !!user?.password_hash)

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    console.log('[Login] Comparing password for user:', user.email)
    console.log('[Login] Password hash in DB starts with:', user.password_hash?.substring(0, 10) || 'null')
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('[Login] Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('[Login] ❌ Invalid password for user:', user.email)
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    console.log('[Login] ✅ Password valid, creating JWT token...')

    // Создаем JWT токен
    const token = await signJWT(user.id, user.email, user.role || 'user')

    // Создаем response с токеном в cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    })

    // Устанавливаем cookie с токеном
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    // Дублируем информацию о пользователе в отдельной cookie для client-side
    response.cookies.set(
      'user-info',
      JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      }),
      {
        httpOnly: false, // Доступна на клиенте
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      }
    )

    return response
  } catch (error) {
    console.error('[Login API] Error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}

