/**
 * Middleware для мониторинга API запросов
 * 
 * Отслеживает:
 * - Время ответа API
 * - Статус коды ответов
 * - Частоту запросов по endpoint'ам
 * - Ошибки API
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const SLOW_API_THRESHOLD = 2000 // ms
const LOG_ALL_REQUESTS = process.env.NODE_ENV === 'development'

interface ApiStats {
  endpoint: string
  method: string
  status: number
  duration: number
  timestamp: Date
  userAgent?: string
  error?: string
}

// Хранилище статистики API (в памяти)
const apiStats: ApiStats[] = []
const MAX_STATS = 1000

export function getApiStats() {
  return apiStats.slice()
}

export function clearApiStats() {
  apiStats.length = 0
}

// Счетчики для быстрой статистики
const counters = {
  total: 0,
  slow: 0,
  errors: 0,
  byEndpoint: new Map<string, number>(),
  byStatus: new Map<number, number>(),
}

export function getApiCounters() {
  return {
    ...counters,
    byEndpoint: Object.fromEntries(counters.byEndpoint),
    byStatus: Object.fromEntries(counters.byStatus),
  }
}

export function resetApiCounters() {
  counters.total = 0
  counters.slow = 0
  counters.errors = 0
  counters.byEndpoint.clear()
  counters.byStatus.clear()
}

/**
 * Обёртка для API route handlers с мониторингом
 */
export function withApiMonitoring<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  endpoint?: string
): T {
  return (async (...args: any[]) => {
    const start = Date.now()
    const request = args[0] as NextRequest
    const detectedEndpoint = endpoint || request.nextUrl.pathname
    const method = request.method

    try {
      // Выполняем handler
      const response = await handler(...args)
      const duration = Date.now() - start
      const status = response.status

      // Обновляем счетчики
      counters.total++
      if (duration > SLOW_API_THRESHOLD) {
        counters.slow++
      }
      if (status >= 400) {
        counters.errors++
      }
      counters.byEndpoint.set(detectedEndpoint, (counters.byEndpoint.get(detectedEndpoint) || 0) + 1)
      counters.byStatus.set(status, (counters.byStatus.get(status) || 0) + 1)

      // Сохраняем статистику
      const stat: ApiStats = {
        endpoint: detectedEndpoint,
        method,
        status,
        duration,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || undefined,
      }

      apiStats.push(stat)
      if (apiStats.length > MAX_STATS) {
        apiStats.shift()
      }

      // Логирование
      if (status >= 500) {
        logger.error(`[API] ❌ 5xx ошибка: ${method} ${detectedEndpoint} → ${status} (${duration}ms)`)
      } else if (status >= 400) {
        logger.warn(`[API] ⚠️ 4xx ошибка: ${method} ${detectedEndpoint} → ${status} (${duration}ms)`)
      } else if (duration > SLOW_API_THRESHOLD) {
        logger.warn(`[API] 🐌 Медленный запрос: ${method} ${detectedEndpoint} (${duration}ms)`)
      } else if (LOG_ALL_REQUESTS) {
        logger.debug(`[API] ${method} ${detectedEndpoint} → ${status} (${duration}ms)`)
      }

      return response
    } catch (error) {
      const duration = Date.now() - start

      // Обновляем счетчики
      counters.total++
      counters.errors++
      counters.byEndpoint.set(detectedEndpoint, (counters.byEndpoint.get(detectedEndpoint) || 0) + 1)
      counters.byStatus.set(500, (counters.byStatus.get(500) || 0) + 1)

      // Сохраняем статистику с ошибкой
      const stat: ApiStats = {
        endpoint: detectedEndpoint,
        method,
        status: 500,
        duration,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || undefined,
        error: error instanceof Error ? error.message : String(error),
      }

      apiStats.push(stat)
      if (apiStats.length > MAX_STATS) {
        apiStats.shift()
      }

      // Логируем ошибку
      logger.error(`[API] ❌ Необработанная ошибка: ${method} ${detectedEndpoint}`, error)

      // Пробрасываем ошибку дальше
      throw error
    }
  }) as T
}

/**
 * Анализ статистики API
 */
export function analyzeApiStats() {
  if (apiStats.length === 0) {
    return {
      message: 'Нет данных для анализа',
      stats: null,
    }
  }

  const totalRequests = apiStats.length
  const slowRequests = apiStats.filter(s => s.duration > SLOW_API_THRESHOLD).length
  const errorRequests = apiStats.filter(s => s.status >= 400).length

  const avgDuration = apiStats.reduce((sum, s) => sum + s.duration, 0) / totalRequests
  const maxDuration = Math.max(...apiStats.map(s => s.duration))

  // Топ медленных endpoint'ов
  const endpointDurations = new Map<string, number[]>()
  apiStats.forEach(stat => {
    const durations = endpointDurations.get(stat.endpoint) || []
    durations.push(stat.duration)
    endpointDurations.set(stat.endpoint, durations)
  })

  const slowestEndpoints = Array.from(endpointDurations.entries())
    .map(([endpoint, durations]) => ({
      endpoint,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      count: durations.length,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10)

  // Топ частых endpoint'ов
  const endpointCounts = new Map<string, number>()
  apiStats.forEach(stat => {
    endpointCounts.set(stat.endpoint, (endpointCounts.get(stat.endpoint) || 0) + 1)
  })

  const mostUsedEndpoints = Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    summary: {
      totalRequests,
      slowRequests,
      errorRequests,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      successRate: ((totalRequests - errorRequests) / totalRequests * 100).toFixed(1) + '%',
    },
    slowestEndpoints,
    mostUsedEndpoints,
    recentErrors: apiStats
      .filter(s => s.status >= 400)
      .slice(-20)
      .map(s => ({
        endpoint: s.endpoint,
        method: s.method,
        status: s.status,
        error: s.error,
        duration: s.duration,
        timestamp: s.timestamp.toISOString(),
      })),
  }
}

