import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/debug/profiles
 * Debug endpoint для проверки профилей (только для админов)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Проверяем роль
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    logger.info('Current user:', { id: userId, role: user?.role })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin only.' 
      }, { status: 403 })
    }

    // Получаем все профили
    const [allProfiles, totalCount] = await Promise.all([
      prisma.profiles.findMany({
        take: 100, // Ограничиваем для debug
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          slug: true,
          display_name: true,
          user_id: true,
          category: true,
          is_published: true,
          verified: true,
          claim_status: true,
          created_at: true
        }
      }),
      prisma.profiles.count()
    ])

    // Получаем профили текущего пользователя
    const userProfiles = await prisma.profiles.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        slug: true,
        display_name: true,
        category: true,
        is_published: true
      }
    })

    // Статистика по категориям
    const categoriesStats = await prisma.profiles.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Статистика по статусам
    const [published, unpublished, verified, unclaimed] = await Promise.all([
      prisma.profiles.count({ where: { is_published: true } }),
      prisma.profiles.count({ where: { is_published: false } }),
      prisma.profiles.count({ where: { verified: true } }),
      prisma.profiles.count({ where: { claim_status: 'unclaimed' } })
    ])

    return NextResponse.json({
      debug: {
        userId,
        userRole: user.role,
        timestamp: new Date().toISOString()
      },
      statistics: {
        total: totalCount,
        published,
        unpublished,
        verified,
        unclaimed
      },
      categories: categoriesStats.map(stat => ({
        category: stat.category,
        count: stat._count.id
      })),
      userProfiles,
      recentProfiles: allProfiles
    })
  } catch (error: any) {
    logger.error('Debug profiles error:', error)
    return NextResponse.json({ 
      error: 'Internal error', 
      details: error.message
    }, { status: 500 })
  }
}
