/**
 * Rate limiting для защиты от скрейперов и DDoS
 * Простая in-memory реализация (для production лучше использовать Redis)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  windowMs: number // Окно времени в мс
  maxRequests: number // Максимум запросов в окне
}

// Конфигурации для разных типов запросов
export const RATE_LIMITS = {
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 100, // 100 запросов в минуту
  },
  // Поиск
  search: {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 поисковых запросов в минуту
  },
  // Создание профиля/услуги
  create: {
    windowMs: 60 * 60 * 1000, // 1 час
    maxRequests: 10, // 10 созданий в час
  },
  // Общие страницы
  page: {
    windowMs: 60 * 1000,
    maxRequests: 60, // 60 страниц в минуту
  },
}

/**
 * Проверяет, не превышен ли лимит запросов
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${identifier}`

  // Получаем или создаём запись
  let entry = rateLimitMap.get(key)

  // Если записи нет или окно истекло - создаём новую
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  // Увеличиваем счётчик
  entry.count++
  rateLimitMap.set(key, entry)

  // Проверяем лимит
  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Очистка старых записей (запускать периодически)
 */
export function cleanupRateLimitMap() {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Очистка каждые 10 минут
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitMap, 10 * 60 * 1000)
}

/**
 * Получить идентификатор клиента (IP + User-Agent)
 */
export function getClientIdentifier(request: Request): string {
  // Получаем IP из заголовков (Vercel, Cloudflare и т.д.)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Хешируем для приватности (опционально)
  return `${ip}:${userAgent.substring(0, 50)}`
}

