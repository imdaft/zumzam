/**
 * Monitoring Stats Endpoint
 * 
 * Возвращает статистику работы системы:
 * - Статистика Prisma запросов
 * - Статистика API запросов
 * - Анализ производительности
 * 
 * 🔒 Только для авторизованных администраторов
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/jwt'
import { 
  getQueryStats, 
  getCounters, 
  analyzeStats,
  clearQueryStats,
  resetCounters,
} from '@/lib/monitoring/prisma-monitor'
import {
  getApiStats,
  getApiCounters,
  analyzeApiStats,
  clearApiStats,
  resetApiCounters,
} from '@/lib/monitoring/api-monitor'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Проверка авторизации
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Проверка прав администратора
  if (authResult.user.role !== 'admin' && authResult.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  const type = request.nextUrl.searchParams.get('type') || 'all'

  // Возвращаем статистику
  const response: any = {
    timestamp: new Date().toISOString(),
  }

  if (type === 'all' || type === 'prisma') {
    response.prisma = {
      counters: getCounters(),
      analysis: analyzeStats(),
      recentQueries: getQueryStats().slice(-50), // Последние 50 запросов
    }
  }

  if (type === 'all' || type === 'api') {
    response.api = {
      counters: getApiCounters(),
      analysis: analyzeApiStats(),
      recentRequests: getApiStats().slice(-50), // Последние 50 запросов
    }
  }

  return NextResponse.json(response)
}

/**
 * Очистка статистики
 */
export async function DELETE(request: NextRequest) {
  // Проверка авторизации
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Проверка прав администратора
  if (authResult.user.role !== 'admin' && authResult.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  const type = request.nextUrl.searchParams.get('type') || 'all'

  if (type === 'all' || type === 'prisma') {
    clearQueryStats()
    resetCounters()
  }

  if (type === 'all' || type === 'api') {
    clearApiStats()
    resetApiCounters()
  }

  return NextResponse.json({ 
    success: true, 
    message: `Статистика ${type} очищена` 
  })
}

