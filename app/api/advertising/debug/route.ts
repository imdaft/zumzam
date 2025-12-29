import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/advertising/debug - отладочная информация о рекламе
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

    // Сбор отладочной информации
    const [
      totalCampaigns,
      activeCampaigns,
      totalSlots,
      activeSlots,
      totalBookings,
      recentImpressions
    ] = await Promise.all([
      prisma.ad_campaigns.count(),
      prisma.ad_campaigns.count({ where: { status: 'active' } }),
      prisma.ad_slots.count(),
      prisma.ad_slots.count({ where: { is_active: true } }),
      prisma.ad_bookings.count(),
      prisma.ad_impressions.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Последние 24 часа
          }
        }
      })
    ])

    return NextResponse.json({
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns
      },
      slots: {
        total: totalSlots,
        active: activeSlots
      },
      bookings: {
        total: totalBookings
      },
      impressions: {
        last_24h: recentImpressions
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching debug info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: error.message },
      { status: 500 }
    )
  }
}



