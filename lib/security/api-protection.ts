/**
 * Middleware для защиты API routes
 * Использовать в каждом API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from './rate-limit'
import { detectBot, logSuspiciousActivity } from './bot-detection'

export interface ApiProtectionConfig {
  rateLimit?: boolean
  botDetection?: boolean
  requireAuth?: boolean
  allowedMethods?: string[]
}

/**
 * Защищает API endpoint от злоупотреблений
 */
export async function protectApiRoute(
  request: NextRequest,
  config: ApiProtectionConfig = {}
): Promise<NextResponse | null> {
  const {
    rateLimit = true,
    botDetection = true,
    requireAuth = false,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  } = config

  // Проверка 1: Разрешённые методы
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  // Проверка 2: Bot Detection
  if (botDetection) {
    const botResult = detectBot(request)
    
    if (botResult.isSuspicious && !botResult.allowAccess) {
      const identifier = getClientIdentifier(request)
      logSuspiciousActivity(identifier, botResult.reason || 'Unknown', request.headers.get('user-agent') || '')
      
      return NextResponse.json(
        { error: 'Access denied' },
        { 
          status: 403,
          headers: {
            'X-Block-Reason': botResult.reason || 'Suspicious activity',
          }
        }
      )
    }
  }

  // Проверка 3: Rate Limiting
  if (rateLimit) {
    const identifier = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.api)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS.api.maxRequests),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          }
        }
      )
    }

    // Добавляем rate limit headers в ответ
    const headers = {
      'X-RateLimit-Limit': String(RATE_LIMITS.api.maxRequests),
      'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    }

    // Сохраняем headers для добавления в финальный ответ
    ;(request as any)._rateLimitHeaders = headers
  }

  // Проверка 4: Аутентификация (если требуется)
  if (requireAuth) {
    // TODO: Implement auth check with Supabase
    // const session = await getSession(request)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
  }

  // Все проверки пройдены
  return null
}

/**
 * Добавляет rate limit headers к ответу
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const headers = (request as any)._rateLimitHeaders
  
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string)
    })
  }

  return response
}

/**
 * Helper для использования в API routes
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   // Проверяем защиту
 *   const protection = await withApiProtection(request)
 *   if (protection) return protection
 * 
 *   // Ваш код API
 *   const data = await fetchData()
 *   return NextResponse.json(data)
 * }
 * ```
 */
export async function withApiProtection(
  request: NextRequest,
  config?: ApiProtectionConfig
): Promise<NextResponse | null> {
  return protectApiRoute(request, config)
}

