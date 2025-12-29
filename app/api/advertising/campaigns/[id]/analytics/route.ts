import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/advertising/campaigns/[id]/analytics
 * Получение аналитики по кампании
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const campaignId = resolvedParams.id
    
    logger.info('[Analytics API] 🔍 Request for campaign:', campaignId)
    
    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string
    logger.info('[Analytics API] ✅ User authenticated:', userId)

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    logger.info('[Analytics API] 👤 User role:', user?.role)

    // Получаем кампанию
    logger.info('[Analytics API] 🔎 Fetching campaign:', campaignId)
    
    const campaign = await prisma.ad_campaigns.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        user_id: true,
        profile_id: true,
        impressions: true,
        clicks: true,
        spent: true,
        budget: true,
        start_date: true,
        end_date: true
      }
    })

    if (!campaign) {
      logger.error('[Analytics API] ❌ Campaign not found')
      return NextResponse.json(
        { error: 'Кампания не найдена' },
        { status: 404 }
      )
    }

    // Проверяем права доступа (владелец или админ)
    if (!isAdmin && campaign.user_id !== userId) {
      logger.error('[Analytics API] ❌ Access denied. Campaign user_id:', campaign.user_id, 'User:', userId)
      return NextResponse.json(
        { error: 'У вас нет доступа к этой кампании' },
        { status: 403 }
      )
    }

    logger.info('[Analytics API] ✅ Access granted')

    // Получаем статистику показов по дням
    const impressions = await prisma.ad_impressions.groupBy({
      by: ['created_at'],
      where: {
        campaign_id: campaignId
      },
      _count: {
        id: true
      },
      _sum: {
        clicks: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Преобразуем в формат для графиков
    const dailyStats = impressions.map(stat => ({
      date: stat.created_at,
      impressions: stat._count.id,
      clicks: stat._sum.clicks || 0
    }))

    // Общая статистика
    const totalImpressions = campaign.impressions || 0
    const totalClicks = campaign.clicks || 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const spent = campaign.spent ? Number(campaign.spent) : 0
    const budget = campaign.budget ? Number(campaign.budget) : 0
    const cpm = totalImpressions > 0 ? (spent / totalImpressions) * 1000 : 0
    const cpc = totalClicks > 0 ? spent / totalClicks : 0

    const analytics = {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        start_date: campaign.start_date,
        end_date: campaign.end_date
      },
      summary: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: Number(ctr.toFixed(2)),
        spent: spent,
        budget: budget,
        cpm: Number(cpm.toFixed(2)),
        cpc: Number(cpc.toFixed(2)),
        conversions: 0 // TODO: добавить когда будет отслеживание конверсий
      },
      daily_stats: dailyStats,
      devices: {
        desktop: 0, // TODO: добавить когда будет отслеживание устройств
        mobile: 0,
        tablet: 0
      },
      top_locations: [] // TODO: добавить когда будет отслеживание гео
    }

    logger.info('[Analytics API] ✅ Returning analytics')
    return NextResponse.json(analytics)
  } catch (error: any) {
    logger.error('[Analytics API] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 }
    )
  }
}
