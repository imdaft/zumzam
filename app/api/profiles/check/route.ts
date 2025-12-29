import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/profiles/check - Проверить наличие профилей у текущего пользователя
 * Возвращает список профилей и (для совместимости) первый профиль как основной
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Определяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    // Получаем список профилей
    const where = isAdmin ? {} : { user_id: userId }

    const profiles = await prisma.profiles.findMany({
      where,
      include: {
        profile_locations: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const hasProfiles = profiles && profiles.length > 0
    
    return NextResponse.json({ 
      exists: hasProfiles, 
      profile: hasProfiles ? profiles[0] : null, // Для обратной совместимости
      profiles: profiles || [] 
    })
  } catch (error: any) {
    logger.error('[Profiles Check API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
