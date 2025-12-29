import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/payments/create - создание платежа (ЮKassa)
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
    const {
      booking_id,
      amount,
      payment_type = 'full', // 'deposit' | 'full' | 'partial'
      description,
      return_url
    } = body

    if (!booking_id || !amount) {
      return NextResponse.json(
        { error: 'booking_id and amount are required' },
        { status: 400 }
      )
    }

    // Проверка существования бронирования
    const booking = await prisma.bookings.findUnique({
      where: { id: booking_id },
      select: {
        id: true,
        parent_id: true,
        price: true,
        status: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Проверка прав (только владелец бронирования)
    if (booking.parent_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Создание записи о платеже
    const payment = await prisma.payments.create({
      data: {
        booking_id,
        amount,
        payment_type,
        status: 'pending',
        provider: 'yookassa',
        currency: 'RUB'
      }
    })

    // TODO: Интеграция с ЮKassa API
    // Здесь должен быть запрос к ЮKassa для создания платежа
    // const yookassaPayment = await createYooKassaPayment({
    //   amount: { value: amount.toString(), currency: 'RUB' },
    //   confirmation: { type: 'redirect', return_url },
    //   description,
    //   metadata: { payment_id: payment.id, booking_id }
    // })

    // Временная заглушка для разработки
    const paymentUrl = return_url || `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?payment_id=${payment.id}`

    return NextResponse.json({
      payment_id: payment.id,
      confirmation_url: paymentUrl,
      status: 'pending'
    })
  } catch (error: any) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    )
  }
}



