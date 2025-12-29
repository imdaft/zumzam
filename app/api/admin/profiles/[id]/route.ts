import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateProfileSchema = z.object({
  verified: z.boolean().optional(),
  is_published: z.boolean().optional(),
})

/**
 * PATCH /api/admin/profiles/[id]
 * Обновить профиль (верификация, публикация)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logger.info('[Admin Profile PATCH] Starting request for profile:', id)
    
    // Проверка авторизации
    const token = request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      logger.error('[Admin Profile PATCH] Invalid token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = payload.sub
    logger.info('[Admin Profile PATCH] User authenticated:', userId)

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    logger.info('[Admin Profile PATCH] User role check:', { role: user?.role })

    if (!user || user.role !== 'admin') {
      logger.error('[Admin Profile PATCH] Access denied for role:', user?.role)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Парсим тело запроса
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    logger.info('[Admin Profile PATCH] Update data:', validatedData)

    // Обновляем профиль
    const profile = await prisma.profiles.update({
      where: { id },
      data: validatedData
    })

    logger.info('[Admin Profile PATCH] Profile updated successfully:', profile.id)

    return NextResponse.json({ profile }, { status: 200 })
  } catch (error: any) {
    logger.error('[Admin Profile PATCH] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to update profile', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/profiles/[id]
 * Удалить профиль
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logger.info('[Admin Profile DELETE] Starting request for profile:', id)
    
    // Проверка авторизации
    const token = request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      logger.error('[Admin Profile DELETE] Invalid token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      logger.error('[Admin Profile DELETE] Access denied for role:', user?.role)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Удаляем профиль
    await prisma.profiles.delete({
      where: { id }
    })

    logger.info('[Admin Profile DELETE] Profile deleted successfully:', id)

    return NextResponse.json({ message: 'Profile deleted' }, { status: 200 })
  } catch (error: any) {
    logger.error('[Admin Profile DELETE] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete profile', 
      details: error.message 
    }, { status: 500 })
  }
}
