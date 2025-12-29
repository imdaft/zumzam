import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signJWT } from '@/lib/auth/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, role, phone } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Проверяем, не существует ли уже пользователь
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже зарегистрирован' },
        { status: 409 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаем пользователя
    const user = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        full_name: fullName || null,
        role: role || 'client',
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
      },
    })

    // Создаем JWT токен
    const token = await signJWT(user.id)

    // Создаем response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    })

    // Устанавливаем cookies
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    response.cookies.set(
      'user-info',
      JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      }
    )

    return response
  } catch (error) {
    console.error('[Register API] Error:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}

