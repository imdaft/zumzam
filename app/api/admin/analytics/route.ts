import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/analytics
 * Получить общую аналитику платформы
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Параллельно запрашиваем всю статистику
    const [usersStats, profilesStats, reviewsStats, ordersStats] = await Promise.all([
      // Статистика пользователей
      Promise.all([
        prisma.users.count(),
        prisma.users.count({ where: { role: 'client' } }),
        prisma.users.count({ where: { role: 'provider' } }),
        prisma.users.count({ where: { role: 'admin' } }),
      ]).then(([total, clients, providers, admins]) => ({
        total,
        clients,
        providers,
        admins,
      })),

      // Статистика профилей
      Promise.all([
        prisma.profiles.count(),
        prisma.profiles.count({ where: { is_published: true } }),
        prisma.profiles.count({ where: { verified: true } }),
      ]).then(([total, published, verified]) => ({
        total,
        published,
        verified,
      })),

      // Статистика отзывов
      Promise.all([
        prisma.reviews.count(),
        prisma.reviews.count({ where: { status: 'approved' } }),
        prisma.reviews.count({ where: { status: 'pending' } }),
        prisma.reviews.count({ where: { status: 'rejected' } }),
      ]).then(([total, approved, pending, rejected]) => ({
        total,
        approved,
        pending,
        rejected,
      })),

      // Статистика заказов
      Promise.all([
        prisma.orders.count(),
        prisma.orders.count({ where: { status: 'pending' } }),
        prisma.orders.count({ where: { status: 'confirmed' } }),
        prisma.orders.count({ where: { status: 'completed' } }),
        prisma.orders.count({ where: { status: 'cancelled' } }),
      ]).then(([total, pending, confirmed, completed, cancelled]) => ({
        total,
        pending,
        confirmed,
        completed,
        cancelled,
      })),
    ])

    // Получаем динамику за последние 30 дней
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [recentUsers, recentProfiles, recentOrders] = await Promise.all([
      prisma.users.findMany({
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
        select: { created_at: true },
        orderBy: { created_at: 'asc' },
      }),
      prisma.profiles.findMany({
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
        select: { created_at: true },
        orderBy: { created_at: 'asc' },
      }),
      prisma.orders.findMany({
        where: {
          created_at: { gte: thirtyDaysAgo },
        },
        select: { created_at: true, total_amount: true },
        orderBy: { created_at: 'asc' },
      }),
    ])

    // Группируем по дням
    const groupByDay = (items: any[], field: string = 'created_at') => {
      const grouped: Record<string, number> = {}
      items.forEach((item) => {
        const date = new Date(item[field]).toISOString().split('T')[0]
        grouped[date] = (grouped[date] || 0) + 1
      })
      return grouped
    }

    const usersTimeline = groupByDay(recentUsers)
    const profilesTimeline = groupByDay(recentProfiles)
    const ordersTimeline = groupByDay(recentOrders)

    // Общая сумма заказов
    const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    // Статистика посещаемости
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const [pageViews30d, pageViewsOnline, pageViewsToday] = await Promise.all([
      prisma.user_activity.findMany({
        where: {
          action_type: 'page_view',
          created_at: { gte: thirtyDaysAgo },
        },
        select: {
          created_at: true,
          session_id: true,
        },
        orderBy: { created_at: 'asc' },
        take: 100000,
      }),

      prisma.user_activity.findMany({
        where: {
          action_type: 'page_view',
          created_at: { gte: fiveMinutesAgo },
        },
        select: { session_id: true },
        take: 100000,
      }),

      prisma.user_activity.findMany({
        where: {
          action_type: 'page_view',
          created_at: { gte: todayStart },
        },
        select: {
          session_id: true,
          device_type: true,
        },
        take: 100000,
      }),
    ])

    const sessions30d = new Set(pageViews30d.map((e) => e.session_id))
    const sessionsOnline = new Set(pageViewsOnline.map((e) => e.session_id))
    const sessionsToday = new Set(pageViewsToday.map((e) => e.session_id))

    const todayStats = {
      pageviews: pageViewsToday.length,
      unique_visitors: sessionsToday.size,
      mobile: pageViewsToday.filter((e) => e.device_type === 'mobile').length,
      desktop: pageViewsToday.filter((e) => e.device_type === 'desktop').length,
    }

    const visitorsTimeline: Record<string, number> = {}
    for (const visit of pageViews30d) {
      const date = new Date(visit.created_at).toISOString().split('T')[0]
      visitorsTimeline[date] = (visitorsTimeline[date] || 0) + 1
    }

    return NextResponse.json({
      users: usersStats,
      profiles: profilesStats,
      reviews: reviewsStats,
      orders: ordersStats,
      timelines: {
        users: usersTimeline,
        profiles: profilesTimeline,
        orders: ordersTimeline,
        visitors: visitorsTimeline,
      },
      revenue: {
        total: totalRevenue,
        last30Days: totalRevenue,
      },
      traffic: {
        unique_visitors_30d: sessions30d.size,
        online_now: sessionsOnline.size,
        today: todayStats,
      },
    })
  } catch (error: any) {
    logger.error('Admin analytics GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
