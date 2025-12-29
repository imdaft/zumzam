import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/provider/breakdowns?period=week|month|year&profileId=all|<uuid>
 * Разрезы по данным аналитики (устройства, источники, воронка)
 * 
 * TODO: Требуются таблицы user_activity, user_sources
 * Упрощённая версия
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

    const profiles = await prisma.profiles.findMany({
      where: { user_id: userId },
      select: { id: true }
    })

    const allProfileIds = profiles.map(p => p.id)
    let selectedProfileIds = allProfileIds

    if (profileIdParam && profileIdParam !== 'all') {
      if (!allProfileIds.includes(profileIdParam)) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      selectedProfileIds = [profileIdParam]
    }

    // TODO: Реальные данные требуют таблиц user_activity, user_sources
    console.warn('[Provider Analytics Breakdowns] Tables user_activity and user_sources not migrated')

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
      selectedProfileIds,
      devices: { mobile: 0, desktop: 0, tablet: 0, unknown: 0 },
      sources: [],
      funnel: { 
        profile_view: 0, 
        service_click: 0, 
        cart_add: 0, 
        checkout_start: 0, 
        order_create: 0 
      },
      engagement: { 
        time_on_page_avg_sec: 0, 
        scroll_depth_avg: 0, 
        samples: 0 
      },
    })
  } catch (error: any) {
    console.error('[Provider Analytics Breakdowns] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load breakdowns', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
