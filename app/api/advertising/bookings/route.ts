import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/advertising/bookings - получить бронирования рекламы
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

    const searchParams = request.nextUrl.searchParams
    const campaign_id = searchParams.get('campaign_id')

    const where: any = {}
    
    if (campaign_id) {
      where.campaign_id = campaign_id
      
      // Проверка прав (только владелец кампании)
      const campaign = await prisma.ad_campaigns.findUnique({
        where: { id: campaign_id },
        select: { user_id: true }
      })

      if (!campaign || campaign.user_id !== payload.sub) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const bookings = await prisma.ad_bookings.findMany({
      where,
      include: {
        ad_campaigns: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        ad_slots: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ bookings })
  } catch (error: any) {
    console.error('Error fetching ad bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/advertising/bookings - создать бронирование слота
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { campaign_id, ad_slot_id, start_date, end_date } = body

    if (!campaign_id || !ad_slot_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'campaign_id, ad_slot_id, start_date, end_date are required' },
        { status: 400 }
      )
    }

    // Проверка прав
    const campaign = await prisma.ad_campaigns.findUnique({
      where: { id: campaign_id },
      select: { user_id: true }
    })

    if (!campaign || campaign.user_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Получение информации о слоте
    const slot = await prisma.ad_slots.findUnique({
      where: { id: ad_slot_id }
    })

    if (!slot) {
      return NextResponse.json({ error: 'Ad slot not found' }, { status: 404 })
    }

    // Расчет стоимости
    const days = Math.ceil(
      (new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const total_cost = Number(slot.price_per_day) * days

    // Создание бронирования
    const booking = await prisma.ad_bookings.create({
      data: {
        campaign_id,
        ad_slot_id,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        total_cost,
        status: 'pending'
      }
    })

    return NextResponse.json(booking)
  } catch (error: any) {
    console.error('Error creating ad booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking', details: error.message },
      { status: 500 }
    )
  }
}



