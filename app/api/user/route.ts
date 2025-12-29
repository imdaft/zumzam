/**
 * API для получения информации о текущем пользователе
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('[User API] Request received')
    
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    console.log('[User API] User ID:', userId)

    // Получаем роль пользователя из таблицы users
    const userData = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    })

    if (!userData) {
      console.warn('[User API] User not found in DB, using default role')
      return NextResponse.json({
        id: userId,
        email: payload.email || null,
        role: 'client' // default role
      })
    }

    console.log('[User API] User data fetched:', userData.role)

    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      role: userData.role || 'client'
    })
  } catch (error: any) {
    console.error('[User API] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
