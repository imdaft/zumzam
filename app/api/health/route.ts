/**
 * Health Check Endpoint
 * 
 * Проверяет состояние системы:
 * - Подключение к БД (Prisma)
 * - Версия приложения
 * - Статус памяти (если в Node.js)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'error'; message?: string; duration?: number }> = {}

  // 1. Проверка подключения к БД
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbDuration = Date.now() - dbStart
    
    checks.database = {
      status: 'ok',
      message: 'Connected to PostgreSQL via Prisma',
      duration: dbDuration,
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
    }
  }

  // 2. Проверка количества профилей (базовая проверка данных)
  try {
    const profileCount = await prisma.profiles.count()
    checks.data = {
      status: 'ok',
      message: `${profileCount} profiles in database`,
    }
  } catch (error) {
    checks.data = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Cannot count profiles',
    }
  }

  // 3. Информация о системе
  const memoryUsage = typeof process !== 'undefined' && process.memoryUsage
    ? process.memoryUsage()
    : null

  const totalDuration = Date.now() - startTime
  const overallStatus = Object.values(checks).every(c => c.status === 'ok') ? 'healthy' : 'unhealthy'

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    checks,
    memory: memoryUsage
      ? {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        }
      : undefined,
  }, {
    status: overallStatus === 'healthy' ? 200 : 503,
  })
}

