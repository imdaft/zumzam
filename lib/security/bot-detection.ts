/**
 * Детекция ботов и скрейперов
 * Защита от недобросовестных конкурентов
 */

// Известные боты (хорошие)
const GOOD_BOTS = [
  'Googlebot',
  'bingbot',
  'Slurp', // Yahoo
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
]

// Подозрительные User-Agent паттерны
const SUSPICIOUS_PATTERNS = [
  /python-requests/i,
  /curl/i,
  /wget/i,
  /scrapy/i,
  /bot/i, // Общий паттерн (но пропускаем хороших ботов)
  /spider/i,
  /crawl/i,
  /scraper/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
]

/**
 * Проверяет, является ли запрос от хорошего бота (поисковики, соцсети)
 */
export function isGoodBot(userAgent: string): boolean {
  return GOOD_BOTS.some(bot => userAgent.includes(bot))
}

/**
 * Проверяет, является ли запрос подозрительным
 */
export function isSuspiciousBot(userAgent: string): boolean {
  // Если это хороший бот - пропускаем
  if (isGoodBot(userAgent)) {
    return false
  }

  // Проверяем подозрительные паттерны
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(userAgent))
}

/**
 * Проверяет валидность User-Agent
 */
export function hasValidUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  if (userAgent.length < 10) return false // Слишком короткий
  if (userAgent.length > 500) return false // Слишком длинный
  return true
}

/**
 * Детектирует подозрительное поведение
 */
export interface BotDetectionResult {
  isBot: boolean
  isSuspicious: boolean
  reason?: string
  allowAccess: boolean
}

export function detectBot(request: Request): BotDetectionResult {
  const userAgent = request.headers.get('user-agent') || ''

  // Проверка 1: Нет User-Agent
  if (!hasValidUserAgent(userAgent)) {
    return {
      isBot: true,
      isSuspicious: true,
      reason: 'Invalid or missing User-Agent',
      allowAccess: false,
    }
  }

  // Проверка 2: Хороший бот (поисковики)
  if (isGoodBot(userAgent)) {
    return {
      isBot: true,
      isSuspicious: false,
      reason: 'Good bot (search engine)',
      allowAccess: true,
    }
  }

  // Проверка 3: Подозрительный бот
  if (isSuspiciousBot(userAgent)) {
    return {
      isBot: true,
      isSuspicious: true,
      reason: 'Suspicious bot detected',
      allowAccess: false,
    }
  }

  // Проверка 4: Отсутствие важных заголовков (признак бота)
  const accept = request.headers.get('accept')
  const acceptLanguage = request.headers.get('accept-language')
  const acceptEncoding = request.headers.get('accept-encoding')

  if (!accept || !acceptLanguage || !acceptEncoding) {
    return {
      isBot: true,
      isSuspicious: true,
      reason: 'Missing browser headers',
      allowAccess: false,
    }
  }

  // Всё ок - похоже на реального пользователя
  return {
    isBot: false,
    isSuspicious: false,
    allowAccess: true,
  }
}

/**
 * Логирует подозрительную активность (для будущего анализа)
 */
export function logSuspiciousActivity(
  identifier: string,
  reason: string,
  userAgent: string
) {
  // В production можно отправлять в сервис мониторинга
  console.warn('[Security] Suspicious activity detected:', {
    identifier,
    reason,
    userAgent: userAgent.substring(0, 100),
    timestamp: new Date().toISOString(),
  })

  // TODO: Отправить в Sentry, LogRocket или свой сервис
}

