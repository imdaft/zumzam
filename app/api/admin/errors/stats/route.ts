import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/errors/stats - статистика ошибок
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

    // Проверка прав администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Получение статистики
    const [
      totalErrors,
      unresolvedErrors,
      criticalErrors,
      errorsByType,
      recentErrors
    ] = await Promise.all([
      prisma.errors.count(),
      prisma.errors.count({ where: { is_resolved: false } }),
      prisma.errors.count({ where: { is_critical: true, is_resolved: false } }),
      prisma.errors.groupBy({
        by: ['error_type'],
        _count: true,
        orderBy: { _count: { error_type: 'desc' } }
      }),
      prisma.errors.findMany({
        where: { is_resolved: false },
        select: {
          id: true,
          message: true,
          error_type: true,
          is_critical: true,
          created_at: true,
          url: true
        },
        orderBy: { created_at: 'desc' },
        take: 10
      })
    ])

    return NextResponse.json({
      total: totalErrors,
      unresolved: unresolvedErrors,
      critical: criticalErrors,
      by_type: errorsByType.map(item => ({
        type: item.error_type,
        count: item._count
      })),
      recent: recentErrors
    })
  } catch (error: any) {
    console.error('Error fetching error stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch error stats', details: error.message },
      { status: 500 }
    )
  }
}



