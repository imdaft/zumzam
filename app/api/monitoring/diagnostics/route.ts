/**
 * Diagnostics Endpoint
 * 
 * Запуск диагностики системы для выявления проблем
 * 
 * 🔒 Только для авторизованных администраторов
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/jwt'
import { runFullDiagnostics, runQuickCheck } from '@/lib/monitoring/diagnostics'

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

  const type = request.nextUrl.searchParams.get('type') || 'quick'

  try {
    if (type === 'full') {
      const results = await runFullDiagnostics()
      
      const failed = results.filter(r => r.status === 'fail')
      const warnings = results.filter(r => r.status === 'warning')
      const passed = results.filter(r => r.status === 'pass')

      return NextResponse.json({
        type: 'full',
        timestamp: new Date().toISOString(),
        summary: {
          total: results.length,
          passed: passed.length,
          warnings: warnings.length,
          failed: failed.length,
          status: failed.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'ok',
        },
        results,
      })
    } else {
      const result = await runQuickCheck()
      
      return NextResponse.json({
        type: 'quick',
        timestamp: new Date().toISOString(),
        ...result,
      })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostics failed',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

