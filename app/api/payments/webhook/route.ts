import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/payments/webhook - webhook от ЮKassa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Проверка подписи webhook от ЮKassa
    // const signature = request.headers.get('x-yookassa-signature')
    // if (!verifyYooKassaSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    // }

    const { object, event } = body

    if (!object || !object.id) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Обработка событий платежа
    switch (event) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(object)
        break
      case 'payment.canceled':
        await handlePaymentCanceled(object)
        break
      case 'refund.succeeded':
        await handleRefundSucceeded(object)
        break
      default:
        console.log('Unhandled webhook event:', event)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentData: any) {
  const paymentId = paymentData.metadata?.payment_id
  const bookingId = paymentData.metadata?.booking_id

  if (!paymentId) {
    console.error('No payment_id in webhook metadata')
    return
  }

  // Обновление статуса платежа
  await prisma.payments.update({
    where: { id: paymentId },
    data: {
      status: 'succeeded',
      transaction_id: paymentData.id,
      provider_data: paymentData,
      succeeded_at: new Date(),
      payment_method: paymentData.payment_method?.type
    }
  })

  // Обновление статуса бронирования
  if (bookingId) {
    await prisma.bookings.update({
      where: { id: bookingId },
      data: {
        payment_status: 'paid',
        paid_at: new Date(),
        status: 'paid'
      }
    })

    // TODO: Отправка уведомлений о успешной оплате
  }
}

async function handlePaymentCanceled(paymentData: any) {
  const paymentId = paymentData.metadata?.payment_id

  if (!paymentId) return

  await prisma.payments.update({
    where: { id: paymentId },
    data: {
      status: 'cancelled',
      provider_data: paymentData,
      failed_at: new Date()
    }
  })
}

async function handleRefundSucceeded(refundData: any) {
  // Обработка возврата средств
  const paymentId = refundData.payment_id

  await prisma.payments.updateMany({
    where: { transaction_id: paymentId },
    data: {
      status: 'refunded',
      refunded_at: new Date()
    }
  })
}



