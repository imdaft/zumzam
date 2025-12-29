import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * API для экспорта ошибок (только для админов)
 * GET /api/admin/errors/export?format=json|csv&errorType=...&isCritical=...&isResolved=...&timeRange=...
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Проверяем, что пользователь - админ
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'
    const errorType = searchParams.get('errorType')
    const isCritical = searchParams.get('isCritical')
    const isResolved = searchParams.get('isResolved')
    const timeRange = searchParams.get('timeRange') || 'all'

    // Строим фильтры Prisma
    const where: any = {}

    // Применяем фильтр по времени
    if (timeRange !== 'all') {
      const now = new Date()
      let since = new Date()
      
      switch (timeRange) {
        case '1h':
          since.setHours(now.getHours() - 1)
          break
        case '24h':
          since.setHours(now.getHours() - 24)
          break
        case '7d':
          since.setDate(now.getDate() - 7)
          break
        case '30d':
          since.setDate(now.getDate() - 30)
          break
      }
      
      where.created_at = { gte: since }
    }

    // Применяем фильтры
    if (errorType) {
      where.error_type = errorType
    }
    if (isCritical !== null) {
      where.is_critical = isCritical === 'true'
    }
    if (isResolved !== null) {
      where.is_resolved = isResolved === 'true'
    }

    // Получаем ошибки
    const errors = await prisma.errors.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1000 // Ограничиваем экспорт 1000 записями
    })

    logger.info(`[Errors Export] Exporting ${errors.length} errors in format: ${format}`)

    // Возвращаем в нужном формате
    if (format === 'csv') {
      // CSV экспорт
      const headers = [
        'ID',
        'Type',
        'Message',
        'Stack',
        'Critical',
        'Resolved',
        'User ID',
        'Route',
        'Metadata',
        'Created At',
        'Updated At'
      ].join(',')

      const rows = errors.map(err => [
        err.id,
        err.error_type || '',
        `"${(err.message || '').replace(/"/g, '""')}"`,
        `"${(err.stack_trace || '').replace(/"/g, '""')}"`,
        err.is_critical ? 'Yes' : 'No',
        err.is_resolved ? 'Yes' : 'No',
        err.user_id || '',
        err.route_path || '',
        JSON.stringify(err.metadata || {}),
        err.created_at?.toISOString() || '',
        err.updated_at?.toISOString() || ''
      ].join(','))

      const csv = [headers, ...rows].join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="errors-export-${Date.now()}.csv"`
        }
      })
    } else {
      // JSON экспорт (по умолчанию)
      return NextResponse.json({
        total: errors.length,
        exported_at: new Date().toISOString(),
        filters: {
          errorType,
          isCritical,
          isResolved,
          timeRange
        },
        errors
      })
    }
  } catch (error: any) {
    logger.error('[Errors Export] Error:', error)
    return NextResponse.json(
      { error: 'Failed to export errors', details: error.message },
      { status: 500 }
    )
  }
}
