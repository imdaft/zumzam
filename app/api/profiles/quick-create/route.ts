import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Быстрое создание пустого профиля
 * POST /api/profiles/quick-create
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Генерируем временный slug
    const timestamp = Date.now()
    const tempSlug = `profile-${userId.slice(0, 8)}-${timestamp}`

    // Создаём минимальный профиль
    const profile = await prisma.profiles.create({
      data: {
        user_id: userId,
        slug: tempSlug,
        display_name: 'Новый профиль',
        category: 'animator', // По умолчанию без адреса
        city: '', // Заполнится позже
        is_published: false,
        verified: false,
      },
    })

    logger.info('[Quick Create] Profile created:', profile.id)
    return NextResponse.json({ profile }, { status: 201 })
  } catch (error: any) {
    logger.error('[Quick Create] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    )
  }
}
