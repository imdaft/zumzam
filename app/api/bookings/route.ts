import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings - Получить список бронирований
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const profile_id = searchParams.get('profile_id')
    const client_id = searchParams.get('client_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    // Фильтры
    const where: any = {}

    if (!isAdmin) {
      // Обычный пользователь видит только свои бронирования или бронирования на свои профили
      const userProfiles = await prisma.profiles.findMany({
        where: { user_id: userId },
        select: { id: true }
      })
      const profileIds = userProfiles.map(p => p.id)

      where.OR = [
        { user_id: userId },
        ...(profileIds.length > 0 ? [{ profile_id: { in: profileIds } }] : [])
      ]
    }

    if (status) {
      where.status = status
    }
    if (profile_id) {
      where.profile_id = profile_id
    }
    if (client_id) {
      where.user_id = client_id
    }
    if (date_from) {
      where.event_date = { ...where.event_date, gte: new Date(date_from) }
    }
    if (date_to) {
      where.event_date = { ...where.event_date, lte: new Date(date_to) }
    }

    // Получаем бронирования
    const bookings = await prisma.bookings.findMany({
      where,
      include: {
        services: {
          select: {
            id: true,
            title: true,
            price: true,
            duration_minutes: true,
            photos: true,
          }
        },
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            city: true,
            phone: true,
            email: true,
          }
        },
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({
      bookings,
      total: bookings.length
    })
  } catch (error: any) {
    logger.error('[Bookings API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings - Создать новое бронирование
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json()

    const {
      service_id,
      profile_id,
      event_date,
      event_time,
      duration_minutes,
      total_amount,
      notes,
    } = body

    // Валидация обязательных полей
    if (!service_id || !profile_id || !event_date) {
      return NextResponse.json(
        { error: 'Missing required fields: service_id, profile_id, event_date' },
        { status: 400 }
      )
    }

    // Проверка что услуга существует и активна
    const service = await prisma.services.findUnique({
      where: { id: service_id },
      select: {
        id: true,
        profile_id: true,
        active: true,
        title: true,
        price: true,
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!service.active) {
      return NextResponse.json(
        { error: 'Service is not active' },
        { status: 400 }
      )
    }

    // Проверка что profile_id совпадает с service.profile_id
    if (service.profile_id !== profile_id) {
      return NextResponse.json(
        { error: 'Invalid profile_id' },
        { status: 400 }
      )
    }

    // Создание бронирования
    const booking = await prisma.bookings.create({
      data: {
        service_id,
        profile_id,
        user_id: userId,
        event_date: new Date(event_date),
        event_time: event_time ? new Date(`1970-01-01T${event_time}`) : null,
        duration_minutes: duration_minutes || service.duration_minutes || null,
        total_amount: total_amount || service.price ? parseFloat(service.price.toString()) : null,
        notes,
        status: 'pending',
        payment_status: 'unpaid',
      },
      include: {
        services: {
          select: {
            id: true,
            title: true,
            price: true,
          }
        },
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            phone: true,
            email: true,
          }
        },
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      booking,
      message: 'Booking created successfully',
    }, { status: 201 })
  } catch (error: any) {
    logger.error('[Bookings API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
