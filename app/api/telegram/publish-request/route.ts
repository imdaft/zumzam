import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/telegram/publish-request - опубликовать заявку в Telegram канал
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
    const { request_id } = body

    if (!request_id) {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 })
    }

    // Получить заявку
    const orderRequest = await prisma.order_requests.findUnique({
      where: { id: request_id }
    })

    if (!orderRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Проверка прав
    if (orderRequest.client_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // TODO: Отправка в Telegram канал через Bot API
    // const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    // const telegramChannelId = process.env.TELEGRAM_CHANNEL_ID
    // const message = formatRequestForTelegram(orderRequest)
    // const result = await sendToTelegram(telegramBotToken, telegramChannelId, message)

    // Обновить статус публикации
    await prisma.order_requests.update({
      where: { id: request_id },
      data: {
        telegram_posted_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Request published to Telegram. (In development)'
    })
  } catch (error: any) {
    console.error('Error publishing to Telegram:', error)
    return NextResponse.json(
      { error: 'Failed to publish', details: error.message },
      { status: 500 }
    )
  }
}



