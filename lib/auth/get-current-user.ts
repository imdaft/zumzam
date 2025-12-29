/**
 * Server-side утилита для получения текущего пользователя из JWT cookie
 */

import { cookies } from 'next/headers'
import { verifyJWT } from './jwt'
import prisma from '@/lib/prisma'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    // Верифицируем JWT
    const payload = await verifyJWT(token)
    
    if (!payload || !payload.userId) {
      return null
    }

    // Получаем пользователя из БД
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        avatar_url: true,
        phone: true,
        created_at: true,
      },
    })

    return user
  } catch (error) {
    console.error('[getCurrentUser] Error:', error)
    return null
  }
}

/**
 * Требует авторизации, выбрасывает ошибку если пользователь не найден
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

