import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/verify-password
 * Проверяет пароль текущего пользователя
 */
export async function POST(request: Request) {
  try {
    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Получаем пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password_hash: true,
        yandex_id: true // OAuth пользователи имеют yandex_id
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Для OAuth пользователей (Яндекс, Google и т.д.) - не требуем пароль
    if (user.yandex_id) {
      return NextResponse.json({ 
        verified: true,
        message: 'OAuth пользователь подтвержден',
        isOAuth: true
      })
    }

    // Для email/password пользователей - проверяем пароль
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Проверяем, что у пользователя есть хеш пароля
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Пользователь не использует пароль (OAuth)' },
        { status: 400 }
      )
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный пароль', verified: false },
        { status: 401 }
      )
    }

    // Если пароль верный - возвращаем успех
    return NextResponse.json({ 
      verified: true,
      message: 'Пароль верный',
      isOAuth: false
    })
  } catch (error: any) {
    console.error('Error verifying password:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
