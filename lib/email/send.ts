/**
 * Универсальный модуль отправки email
 * Работает локально и в продакшене
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Отправка email через выбранный провайдер
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, text } = options

  // Проверяем наличие провайдера
  if (!process.env.EMAIL_PROVIDER) {
    // Если провайдер не настроен - логируем в консоль (только в DEV)
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 =============== EMAIL (DEV MODE) ===============')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('HTML:', html)
      console.log('Text:', text || '(no text version)')
      console.log('====================================================\n')
      return { success: true }
    }
    
    console.error('[Email] EMAIL_PROVIDER not configured')
    return { success: false, error: 'Email provider not configured' }
  }

  // Если провайдер настроен - ВСЕГДА отправляем реально (даже в DEV)
  console.log(`[Email] Sending via ${process.env.EMAIL_PROVIDER} to ${to}...`)

  try {
    switch (process.env.EMAIL_PROVIDER) {
      case 'resend':
        return await sendViaResend(options)
      
      case 'mailtrap':
        return await sendViaMailtrap(options)
      
      case 'yandex':
        return await sendViaYandex(options)
      
      default:
        console.error(`[Email] Unknown provider: ${process.env.EMAIL_PROVIDER}`)
        return { success: false, error: 'Unknown email provider' }
    }
  } catch (error: any) {
    console.error('[Email] Send error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Отправка через Resend (рекомендуется)
 */
async function sendViaResend(options: EmailOptions) {
  // Динамический импорт только если используется
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'ZumZam <noreply@zumzam.ru>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Отправка через Mailtrap (для тестов)
 */
async function sendViaMailtrap(options: EmailOptions) {
  const nodemailer = await import('nodemailer')
  
  const transporter = nodemailer.default.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@zumzam.ru',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  })

  return { success: true }
}

/**
 * Отправка через Яндекс.SMTP
 */
async function sendViaYandex(options: EmailOptions) {
  const nodemailer = await import('nodemailer')
  
  const transporter = nodemailer.default.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: process.env.YANDEX_EMAIL,
      pass: process.env.YANDEX_APP_PASSWORD
    }
  })

  await transporter.sendMail({
    from: `"ZumZam" <${process.env.YANDEX_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  })

  return { success: true }
}

/**
 * Специализированные функции для разных типов писем
 */

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/reset-password?token=${resetToken}`
  
  return sendEmail({
    to: email,
    subject: 'Восстановление пароля - ZumZam',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #F97316; 
              color: white; 
              text-decoration: none; 
              border-radius: 24px;
              font-weight: 600;
            }
            .footer { margin-top: 40px; color: #64748B; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Восстановление пароля</h1>
            <p>Вы запросили восстановление пароля на платформе ZumZam.</p>
            <p>Перейдите по ссылке для установки нового пароля:</p>
            <p style="margin: 30px 0;">
              <a href="${resetLink}" class="button">Восстановить пароль</a>
            </p>
            <p style="color: #64748B; font-size: 14px;">
              Или скопируйте эту ссылку в браузер:<br>
              <a href="${resetLink}">${resetLink}</a>
            </p>
            <div class="footer">
              <p><strong>⚠️ Важно:</strong></p>
              <ul>
                <li>Ссылка действительна 1 час</li>
                <li>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо</li>
              </ul>
              <p>С уважением,<br>Команда ZumZam</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Восстановление пароля

Вы запросили восстановление пароля на платформе ZumZam.

Перейдите по ссылке для установки нового пароля:
${resetLink}

Ссылка действительна 1 час.

Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.

С уважением,
Команда ZumZam
    `
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Добро пожаловать в ZumZam! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Привет, ${name}! 👋</h1>
          <p>Добро пожаловать на платформу ZumZam!</p>
          <p>Теперь вы можете:</p>
          <ul>
            <li>Создавать профили услуг</li>
            <li>Принимать заказы от клиентов</li>
            <li>Управлять своим расписанием</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Перейти в личный кабинет</a></p>
        </body>
      </html>
    `
  })
}

