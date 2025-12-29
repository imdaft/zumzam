import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/telegram/webhook - webhook от Telegram бота
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Обработка разных типов сообщений
    if (body.message) {
      const message = body.message
      const chatId = message.chat.id
      const text = message.text

      // Команда /start для подключения
      if (text?.startsWith('/start')) {
        const token = text.split(' ')[1] // /start TOKEN

        if (token) {
          // Найти пользователя по токену подключения
          const user = await prisma.users.findFirst({
            where: { telegram_connect_token: token }
          })

          if (user) {
            // Обновить настройки
            await prisma.notification_settings.upsert({
              where: { user_id: user.id },
              update: {
                telegram_chat_id: chatId.toString(),
                telegram_username: message.from?.username,
                telegram_verified: true,
                enabled_telegram: true
              },
              create: {
                user_id: user.id,
                telegram_chat_id: chatId.toString(),
                telegram_username: message.from?.username,
                telegram_verified: true,
                enabled_telegram: true
              }
            })

            // Очистить токен
            await prisma.users.update({
              where: { id: user.id },
              data: { telegram_connect_token: null }
            })

            // TODO: Отправить подтверждение в Telegram
            // await sendTelegramMessage(chatId, '✅ Telegram успешно подключен!')
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error processing Telegram webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    )
  }
}



