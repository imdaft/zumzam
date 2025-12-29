import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * API для отправки email уведомлений о критических ошибках
 * POST /api/admin/errors/notify
 */
export async function POST(request: NextRequest) {
  try {
    const { error, frequency } = await request.json()

    // Email админа для уведомлений (из переменных окружения)
    const adminEmail = process.env.ADMIN_EMAIL

    if (!adminEmail) {
      logger.warn('[Error Notify] ADMIN_EMAIL not configured')
      return NextResponse.json({ success: false, message: 'Email not configured' })
    }

    // Формируем текст письма
    const subject = `🚨 Критическая ошибка на ${process.env.NEXT_PUBLIC_SITE_URL}`
    const text = `
Обнаружена критическая ошибка:

Сообщение: ${error.message}
Тип: ${error.errorType}
URL: ${error.url}
Пользователь: ${error.userEmail || 'анонимный'}
Частота: ${frequency} раз за последний час
Время: ${new Date().toLocaleString('ru-RU')}

${error.stack ? `\nStack trace:\n${error.stack}\n` : ''}

Посмотреть подробности: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/errors

---
Это автоматическое уведомление от системы мониторинга ошибок.
`

    // TODO: Интеграция с email сервисом
    // Можно использовать:
    // - Nodemailer + SMTP
    // - SendGrid
    // - Resend
    // - AWS SES
    
    // Пример с Resend (рекомендую):
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'errors@yourdomain.com',
    //   to: adminEmail,
    //   subject,
    //   text,
    // })

    // Пока просто логируем
    logger.error('[Error Notify] Critical error detected', {
      message: error.message,
      frequency,
      email: adminEmail,
    })

    console.log('\n' + '='.repeat(80))
    console.log('📧 EMAIL NOTIFICATION (would be sent to:', adminEmail + ')')
    console.log('='.repeat(80))
    console.log(text)
    console.log('='.repeat(80) + '\n')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Error Notify] Exception', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
















