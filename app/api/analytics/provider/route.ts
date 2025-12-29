import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/provider?period=week|month|year&profileId=all|<uuid>
 * Аналитика для исполнителя (по его профилям)
 * 
 * TODO: Требуются таблицы user_activity, orders
 * Упрощённая версия - возвращаем базовую статистику
 */
export async function GET(request: NextRequest) {
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

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const role = user?.role
    if (role !== 'provider' && role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'week'
    const profileIdParam = (url.searchParams.get('profileId') || 'all').trim()

    // Получаем профили пользователя
    const profiles = await prisma.profiles.findMany({
      where: { user_id: userId },
      select: { id: true, display_name: true, rating: true, reviews_count: true }
    })

    const allProfileIds = profiles.map(p => p.id)
    let selectedProfileIds = allProfileIds

    if (profileIdParam && profileIdParam !== 'all') {
      if (!allProfileIds.includes(profileIdParam)) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      selectedProfileIds = [profileIdParam]
    }

    // TODO: Реальные данные требуют таблиц user_activity и orders
    // Пока возвращаем упрощённую структуру
    console.warn('[Provider Analytics] Tables user_activity and orders not fully migrated')

    const fromDate = new Date()
    const toDate = new Date()
    if (period === 'week') fromDate.setDate(fromDate.getDate() - 7)
    if (period === 'month') fromDate.setDate(fromDate.getDate() - 30)
    if (period === 'year') fromDate.setDate(fromDate.getDate() - 365)

    return NextResponse.json({
      period: { 
        from: fromDate.toISOString(), 
        to: toDate.toISOString(), 
        key: period 
      },
      profiles: profiles.map(p => ({ id: p.id, name: p.display_name })),
      selectedProfileIds,
      kpis: {
        views: 0,
        orders: 0,
        revenue: 0,
        conversion: 0,
        avgOrderValue: 0,
        rating: profiles[0]?.rating ? Number(profiles[0].rating) : 0,
      },
      series: [],
      topProfiles: [],
    })
  } catch (error: any) {
    console.error('[Provider Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load analytics', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
