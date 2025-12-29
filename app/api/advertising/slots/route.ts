import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/advertising/slots - получить список рекламных слотов
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location') // 'home' | 'search' | 'profile'
    const is_active = searchParams.get('is_active')

    const where: any = {}

    if (location) {
      where.location = location
    }

    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active === 'true'
    }

    const slots = await prisma.ad_slots.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        location: true,
        position: true,
        price_per_day: true,
        price_per_week: true,
        price_per_month: true,
        format: true,
        max_concurrent_ads: true,
        avg_impressions_per_day: true,
        avg_clicks_per_day: true,
        avg_ctr: true,
        is_active: true
      },
      orderBy: { display_order: 'asc' }
    })

    return NextResponse.json({ slots })
  } catch (error: any) {
    console.error('Error fetching ad slots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch slots', details: error.message },
      { status: 500 }
    )
  }
}



