import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/tests - тест системных компонентов
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверка прав администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Тест 1: Подключение к БД
    try {
      await prisma.$queryRaw`SELECT 1`
      results.tests.database = { status: 'ok', message: 'Database connection successful' }
    } catch (error: any) {
      results.tests.database = { status: 'error', message: error.message }
    }

    // Тест 2: Количество записей в основных таблицах
    try {
      const [usersCount, profilesCount, ordersCount, reviewsCount] = await Promise.all([
        prisma.users.count(),
        prisma.profiles.count(),
        prisma.orders.count(),
        prisma.reviews.count()
      ])

      results.tests.tables = {
        status: 'ok',
        counts: {
          users: usersCount,
          profiles: profilesCount,
          orders: ordersCount,
          reviews: reviewsCount
        }
      }
    } catch (error: any) {
      results.tests.tables = { status: 'error', message: error.message }
    }

    // Тест 3: Проверка индексов и производительности
    try {
      const start = Date.now()
      await prisma.profiles.findMany({
        where: { is_published: true },
        take: 10
      })
      const duration = Date.now() - start

      results.tests.performance = {
        status: duration < 500 ? 'ok' : 'warning',
        message: `Query took ${duration}ms`,
        duration
      }
    } catch (error: any) {
      results.tests.performance = { status: 'error', message: error.message }
    }

    // Общий статус
    const hasErrors = Object.values(results.tests).some((test: any) => test.status === 'error')
    results.overall_status = hasErrors ? 'error' : 'ok'

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error running tests:', error)
    return NextResponse.json(
      { error: 'Failed to run tests', details: error.message },
      { status: 500 }
    )
  }
}



