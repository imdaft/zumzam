/**
 * Prisma Middleware для мониторинга всех запросов к БД
 * 
 * Отслеживает:
 * - Время выполнения запросов
 * - Типы операций (findMany, create, update и т.д.)
 * - Медленные запросы (>1000ms)
 * - Ошибки БД
 */

import { Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

const SLOW_QUERY_THRESHOLD = 1000 // ms
const LOG_ALL_QUERIES = process.env.NODE_ENV === 'development'

interface QueryStats {
  model: string
  action: string
  duration: number
  timestamp: Date
  success: boolean
  error?: string
}

// Хранилище статистики запросов (в памяти)
const queryStats: QueryStats[] = []
const MAX_STATS = 1000 // Храним последние 1000 запросов

export function getQueryStats() {
  return queryStats.slice()
}

export function clearQueryStats() {
  queryStats.length = 0
}

// Счетчики для быстрой статистики
const counters = {
  total: 0,
  slow: 0,
  errors: 0,
  byModel: new Map<string, number>(),
  byAction: new Map<string, number>(),
}

export function getCounters() {
  return {
    ...counters,
    byModel: Object.fromEntries(counters.byModel),
    byAction: Object.fromEntries(counters.byAction),
  }
}

export function resetCounters() {
  counters.total = 0
  counters.slow = 0
  counters.errors = 0
  counters.byModel.clear()
  counters.byAction.clear()
}

/**
 * Middleware для Prisma
 */
export const prismaMonitorMiddleware: Prisma.Middleware = async (params, next) => {
  const start = Date.now()
  const { model, action } = params

  try {
    // Выполняем запрос
    const result = await next(params)
    const duration = Date.now() - start

    // Обновляем счетчики
    counters.total++
    if (duration > SLOW_QUERY_THRESHOLD) {
      counters.slow++
    }
    if (model) {
      counters.byModel.set(model, (counters.byModel.get(model) || 0) + 1)
    }
    counters.byAction.set(action, (counters.byAction.get(action) || 0) + 1)

    // Сохраняем статистику
    const stat: QueryStats = {
      model: model || 'unknown',
      action,
      duration,
      timestamp: new Date(),
      success: true,
    }
    
    queryStats.push(stat)
    if (queryStats.length > MAX_STATS) {
      queryStats.shift() // Удаляем старые записи
    }

    // Логирование
    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn(`[Prisma] 🐌 Медленный запрос: ${model}.${action} (${duration}ms)`, {
        params: sanitizeParams(params),
      })
    } else if (LOG_ALL_QUERIES) {
      logger.debug(`[Prisma] ${model}.${action} (${duration}ms)`)
    }

    return result
  } catch (error) {
    const duration = Date.now() - start
    
    // Обновляем счетчики ошибок
    counters.total++
    counters.errors++
    if (model) {
      counters.byModel.set(model, (counters.byModel.get(model) || 0) + 1)
    }
    counters.byAction.set(action, (counters.byAction.get(action) || 0) + 1)

    // Сохраняем статистику с ошибкой
    const stat: QueryStats = {
      model: model || 'unknown',
      action,
      duration,
      timestamp: new Date(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
    
    queryStats.push(stat)
    if (queryStats.length > MAX_STATS) {
      queryStats.shift()
    }

    // Логируем ошибку
    logger.error(`[Prisma] ❌ Ошибка в ${model}.${action}`, {
      error,
      params: sanitizeParams(params),
      duration,
    })

    throw error
  }
}

/**
 * Очистка параметров запроса от чувствительных данных
 */
function sanitizeParams(params: Prisma.MiddlewareParams) {
  const { model, action, args } = params
  
  // Не логируем пароли и токены
  if (args && typeof args === 'object') {
    const sanitized = { ...args }
    
    if ('data' in sanitized && sanitized.data) {
      const data = { ...sanitized.data }
      if ('password' in data) data.password = '***'
      if ('token' in data) data.token = '***'
      if ('refresh_token' in data) data.refresh_token = '***'
      sanitized.data = data
    }
    
    return { model, action, args: sanitized }
  }
  
  return { model, action }
}

/**
 * Анализ статистики запросов
 */
export function analyzeStats() {
  if (queryStats.length === 0) {
    return {
      message: 'Нет данных для анализа',
      stats: null,
    }
  }

  const totalQueries = queryStats.length
  const slowQueries = queryStats.filter(s => s.duration > SLOW_QUERY_THRESHOLD).length
  const errorQueries = queryStats.filter(s => !s.success).length
  
  const avgDuration = queryStats.reduce((sum, s) => sum + s.duration, 0) / totalQueries
  const maxDuration = Math.max(...queryStats.map(s => s.duration))
  
  // Топ медленных моделей
  const modelDurations = new Map<string, number[]>()
  queryStats.forEach(stat => {
    const durations = modelDurations.get(stat.model) || []
    durations.push(stat.duration)
    modelDurations.set(stat.model, durations)
  })
  
  const slowestModels = Array.from(modelDurations.entries())
    .map(([model, durations]) => ({
      model,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      count: durations.length,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 5)

  return {
    summary: {
      totalQueries,
      slowQueries,
      errorQueries,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      successRate: ((totalQueries - errorQueries) / totalQueries * 100).toFixed(1) + '%',
    },
    slowestModels,
    recentErrors: queryStats
      .filter(s => !s.success)
      .slice(-10)
      .map(s => ({
        model: s.model,
        action: s.action,
        error: s.error,
        timestamp: s.timestamp.toISOString(),
      })),
  }
}

