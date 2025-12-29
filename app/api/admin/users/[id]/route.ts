import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users/[id]
 * Получить детальную информацию о пользователе
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    logger.info('[Admin User Detail] Starting request for user:', id)
    
    const token = request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем информацию о пользователе
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        profiles_profiles_user_idTousers: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            category: true,
            city: true,
            rating: true,
            verified: true,
            main_photo: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Получаем статистику заказов
    const orderStats = await prisma.order_requests.groupBy({
      by: ['status'],
      where: { client_id: id },
      _count: true
    })

    const totalOrders = orderStats.reduce((sum, stat) => sum + stat._count, 0)
    const pendingOrders = orderStats.find(s => s.status === 'pending')?._count || 0
    const confirmedOrders = orderStats.find(s => s.status === 'confirmed')?._count || 0
    const completedOrders = orderStats.find(s => s.status === 'completed')?._count || 0
    const cancelledOrders = orderStats.find(s => s.status === 'cancelled')?._count || 0
    const activeOrders = pendingOrders + confirmedOrders

    // Получаем последние заказы
    const recentOrders = await prisma.order_requests.findMany({
      where: { client_id: id },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        event_date: true,
        created_at: true,
        category: true
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })

    // Получаем последнюю дату заказа
    const lastOrder = recentOrders[0]
    const lastOrderDate = lastOrder ? lastOrder.created_at.toISOString() : null

    // Получаем статистику активностей
    const activities = await prisma.user_activity.findMany({
      where: { user_id: id },
      orderBy: { created_at: 'desc' },
      take: 50
    })

    const pageViews = activities.filter(a => a.action_type === 'page_view').length
    const searches = activities.filter(a => a.action_type === 'search').length
    const profileViews = activities.filter(a => a.action_type === 'profile_view').length
    const lastActivity = activities[0]
    const lastActivityDate = lastActivity ? lastActivity.created_at?.toISOString() : null

    // Получаем первую активность для UTM меток
    const firstActivity = await prisma.user_activity.findFirst({
      where: { user_id: id },
      orderBy: { created_at: 'asc' }
    })

    const firstUtmSource = null // UTM метки не хранятся в user_activity
    const firstUtmCampaign = null
    const firstReferrer = firstActivity?.referrer_url || null

    // Группируем активности по типам
    const activityStats: Record<string, number> = {}
    activities.forEach(a => {
      activityStats[a.action_type] = (activityStats[a.action_type] || 0) + 1
    })

    // Источники трафика (пока пусто, т.к. UTM не хранится)
    const sources: any[] = []

    // История поиска (из action_data)
    const searchHistory = activities
      .filter(a => a.action_type === 'search')
      .slice(0, 20)
      .map(a => ({
        id: a.id,
        query: typeof a.action_data === 'object' && a.action_data !== null ? (a.action_data as any).query : null,
        created_at: a.created_at?.toISOString()
      }))

    // Просмотренные профили (пока пусто, т.к. profile_id нет в user_activity)
    const viewedProfilesWithData: any[] = []

    // Интересы (пока пусто)
    const interests: any[] = []

    // Конвертируем rating в number для профилей
    const userWithNumberRating = {
      ...user,
      profiles_profiles_user_idTousers: user.profiles_profiles_user_idTousers.map(p => ({
        ...p,
        rating: p.rating ? Number(p.rating) : 0
      }))
    }

    // Формируем ответ
    const response = {
      user: userWithNumberRating,
      profiles: userWithNumberRating.profiles_profiles_user_idTousers,
      statistics: {
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        confirmed_orders: confirmedOrders,
        completed_orders: completedOrders,
        cancelled_orders: cancelledOrders,
        active_orders: activeOrders,
        total_spent: 0, // TODO: если будет поле amount в order_requests
        avg_order_value: 0,
        last_order_date: lastOrderDate,
        total_activities: activities.length,
        page_views: pageViews,
        searches: searches,
        profile_views: profileViews,
        last_activity_date: lastActivityDate,
        first_utm_source: firstUtmSource,
        first_utm_campaign: firstUtmCampaign,
        first_referrer: firstReferrer
      },
      recentOrders: recentOrders.map(order => ({
        ...order,
        budget: order.budget ? Number(order.budget) : null
      })),
      sources,
      recentActivity: activities.slice(0, 20).map(a => ({
        id: a.id,
        activity_type: a.action_type,
        page_url: a.page_url,
        action_data: a.action_data,
        created_at: a.created_at?.toISOString()
      })),
      interests,
      activityStats,
      searchHistory,
      viewedProfiles: viewedProfilesWithData
    }

    return NextResponse.json(response)
  } catch (error: any) {
    logger.error('[Admin User Detail] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Обновить пользователя (роль, кредиты)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const token = request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { role, credits } = body

    const updateData: any = {}
    if (role) updateData.role = role
    if (typeof credits === 'number') updateData.credits = credits

    const user = await prisma.users.update({
      where: { id },
      data: updateData
    })

    logger.info('[Admin User PATCH] User updated:', id)
    return NextResponse.json({ user })
  } catch (error: any) {
    logger.error('[Admin User PATCH] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to update user', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Удалить пользователя
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const token = request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.users.delete({
      where: { id }
    })

    logger.info('[Admin User DELETE] User deleted:', id)
    return NextResponse.json({ message: 'User deleted' })
  } catch (error: any) {
    logger.error('[Admin User DELETE] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user', 
      details: error.message 
    }, { status: 500 })
  }
}
