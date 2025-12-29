import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/advertising/active-banners?slot=home_carousel
 * Получение активных рекламных баннеров для конкретного слота
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slotName = searchParams.get('slot')

    logger.info('[Active Banners API] Requested slot:', { slotName })

    if (!slotName) {
      return NextResponse.json(
        { error: 'Не указан слот' },
        { status: 400 }
      )
    }

    // Находим слот по имени
    const slot = await prisma.ad_slots.findFirst({
      where: { name: slotName }
    })

    if (!slot) {
      logger.warn('[Active Banners API] Slot not found:', { slotName })
      return NextResponse.json({ banners: [] })
    }

    // Получаем активные бронирования для этого слота
    const now = new Date()
    const bookings = await prisma.ad_bookings.findMany({
      where: {
        ad_slot_id: slot.id,
        status: 'active',
        start_date: { lte: now },
        end_date: { gte: now }
      },
      include: {
        ad_campaigns: {
          select: {
            id: true,
            title: true,
            description: true,
            image_url: true,
            link_url: true,
            status: true,
            moderation_status: true
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Фильтруем только одобренные кампании
    const activeBanners = bookings
      .filter(booking => 
        booking.ad_campaigns && 
        booking.ad_campaigns.status === 'active' &&
        booking.ad_campaigns.moderation_status === 'approved'
      )
      .map(booking => ({
        id: booking.id,
        campaign: booking.ad_campaigns,
        ad_slot_id: booking.ad_slot_id,
        status: booking.status
      }))

    logger.info('[Active Banners API] Found banners:', { count: activeBanners.length })

    return NextResponse.json({ banners: activeBanners })
  } catch (error: any) {
    logger.error('[Advertising API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

