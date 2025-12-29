/**
 * API для управления кастомными полями профиля
 * POST /api/profiles/[id]/fields
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fields } = body

    // Проверяем права доступа
    const profile = await prisma.profiles.findUnique({
      where: { id },
      select: { user_id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.user_id !== userId) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Обновляем конфигурацию
    await prisma.profiles.update({
      where: { id },
      data: { custom_fields_config: fields },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Profile fields API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
