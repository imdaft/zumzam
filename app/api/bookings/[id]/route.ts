import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id] - Получить одно бронирование
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем бронирование
    const booking = await prisma.bookings.findUnique({
      where: { id },
      include: {
        services: {
          select: {
            id: true,
            title: true,
            description: true,
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
            cover_photo: true,
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            full_name: true,
            phone: true,
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    const isClient = booking.user_id === userId
    const isProvider = booking.profile_id
      ? await prisma.profiles.findFirst({
          where: {
            id: booking.profile_id,
            user_id: userId
          }
        })
      : false

    if (!isAdmin && !isClient && !isProvider) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ booking })
  } catch (error: any) {
    logger.error('[Bookings API] GET [id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bookings/[id] - Обновить статус бронирования
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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
    const { status, payment_status, notes } = body

    // Валидация статуса
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Получаем текущее бронирование
    const currentBooking = await prisma.bookings.findUnique({
      where: { id },
      select: {
        id: true,
        profile_id: true,
        user_id: true,
        status: true,
      }
    })

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    const isClient = currentBooking.user_id === userId
    const isProvider = currentBooking.profile_id
      ? await prisma.profiles.findFirst({
          where: {
            id: currentBooking.profile_id,
            user_id: userId
          }
        })
      : false

    // Клиент может только отменить (cancelled)
    if (status === 'cancelled' && !isAdmin && !isClient) {
      return NextResponse.json(
        { error: 'Only client can cancel booking' },
        { status: 403 }
      )
    }

    // Студия может подтвердить (confirmed), отклонить (rejected), завершить (completed)
    if (status && ['confirmed', 'rejected', 'completed'].includes(status) && !isAdmin && !isProvider) {
      return NextResponse.json(
        { error: 'Only profile owner can update this status' },
        { status: 403 }
      )
    }

    // Формируем данные для обновления
    const updateData: any = {}
    if (status !== undefined) {
      updateData.status = status
    }
    if (payment_status !== undefined) {
      updateData.payment_status = payment_status
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }
    updateData.updated_at = new Date()

    // Обновляем бронирование
    const booking = await prisma.bookings.update({
      where: { id },
      data: updateData,
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
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            full_name: true,
          }
        }
      }
    })

    return NextResponse.json({
      booking,
      message: `Booking ${status || 'updated'} successfully`,
    })
  } catch (error: any) {
    logger.error('[Bookings API] PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update booking' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bookings/[id] - Удалить бронирование (только для админов)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Только админ может удалять
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Only admin can delete bookings' },
        { status: 403 }
      )
    }

    await prisma.bookings.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Booking deleted successfully'
    })
  } catch (error: any) {
    logger.error('[Bookings API] DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete booking' },
      { status: 500 }
    )
  }
}

      }
    })

    return NextResponse.json({
      booking,
      message: `Booking ${status || 'updated'} successfully`,
    })
  } catch (error: any) {
    logger.error('[Bookings API] PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update booking' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bookings/[id] - Удалить бронирование (только для админов)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Только админ может удалять
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Only admin can delete bookings' },
        { status: 403 }
      )
    }

    await prisma.bookings.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Booking deleted successfully'
    })
  } catch (error: any) {
    logger.error('[Bookings API] DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete booking' },
      { status: 500 }
    )
  }
}
