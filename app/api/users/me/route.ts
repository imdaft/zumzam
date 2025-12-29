import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/me - Получить текущего пользователя из БД
 */
export async function GET(request: NextRequest) {
  console.log('[API /api/users/me] Request received')
  
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    console.log('[API /api/users/me] User ID:', userId)

    // Получаем данные пользователя из таблицы users
    const userData = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!userData) {
      // Если запись не найдена, возвращаем null (не ошибку)
      return NextResponse.json({ data: null, error: null })
    }

    return NextResponse.json({ data: userData, error: null })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/me - Обновить данные текущего пользователя
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    const body = await request.json()

    // Подготавливаем данные для обновления
    const updateData: any = {}
    
    if (body.full_name !== undefined) updateData.full_name = body.full_name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
    if (body.role !== undefined) {
      // Проверяем, что пользователь не пытается стать админом
      const currentUser = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      
      // Только админы могут менять роль на admin, обычные пользователи могут только client/provider
      if (body.role === 'admin' && currentUser?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: cannot set admin role' },
          { status: 403 }
        )
      }
      
      updateData.role = body.role
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Обновляем пользователя
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
    })

    logger.info('[API /api/users/me] User updated:', { userId, fields: Object.keys(updateData) })

    return NextResponse.json({ data: updatedUser, error: null })
  } catch (error: any) {
    logger.error('[API /api/users/me] PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
