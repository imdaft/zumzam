/**
 * Утилиты для диагностики системы
 * 
 * Быстрые проверки для выявления проблем после миграции
 */

import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export interface DiagnosticResult {
  check: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

/**
 * Полная диагностика системы
 */
export async function runFullDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = []

  logger.info('[Diagnostics] 🔍 Запуск полной диагностики системы...')

  // 1. Проверка подключения к БД
  results.push(await checkDatabaseConnection())

  // 2. Проверка основных таблиц
  results.push(await checkMainTables())

  // 3. Проверка индексов
  results.push(await checkIndexes())

  // 4. Проверка целостности данных
  results.push(await checkDataIntegrity())

  // 5. Проверка производительности запросов
  results.push(await checkQueryPerformance())

  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warning').length

  if (failed > 0) {
    logger.error(`[Diagnostics] ❌ Диагностика завершена: ${failed} критических ошибок`)
  } else if (warnings > 0) {
    logger.warn(`[Diagnostics] ⚠️ Диагностика завершена: ${warnings} предупреждений`)
  } else {
    logger.info(`[Diagnostics] ✅ Диагностика завершена успешно`)
  }

  return results
}

/**
 * Проверка подключения к БД
 */
async function checkDatabaseConnection(): Promise<DiagnosticResult> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start

    return {
      check: 'Database Connection',
      status: 'pass',
      message: `Подключение к БД работает (${duration}ms)`,
      details: { duration },
    }
  } catch (error) {
    return {
      check: 'Database Connection',
      status: 'fail',
      message: 'Не удалось подключиться к БД',
      details: { error: error instanceof Error ? error.message : String(error) },
    }
  }
}

/**
 * Проверка наличия основных таблиц
 */
async function checkMainTables(): Promise<DiagnosticResult> {
  try {
    const tables = [
      { name: 'users', model: prisma.users },
      { name: 'profiles', model: prisma.profiles },
      { name: 'services', model: prisma.services },
      { name: 'reviews', model: prisma.reviews },
      { name: 'profile_activities', model: prisma.profile_activities },
      { name: 'profile_services', model: prisma.profile_services },
    ]

    const counts: Record<string, number> = {}
    
    for (const table of tables) {
      const count = await (table.model as any).count()
      counts[table.name] = count
    }

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0)

    return {
      check: 'Main Tables',
      status: 'pass',
      message: `Все основные таблицы доступны (${totalRecords} записей)`,
      details: counts,
    }
  } catch (error) {
    return {
      check: 'Main Tables',
      status: 'fail',
      message: 'Ошибка при проверке таблиц',
      details: { error: error instanceof Error ? error.message : String(error) },
    }
  }
}

/**
 * Проверка индексов для производительности
 */
async function checkIndexes(): Promise<DiagnosticResult> {
  try {
    // Проверяем наличие важных индексов через query
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'services', 'users', 'reviews')
      ORDER BY tablename, indexname
    `

    const criticalIndexes = [
      'profiles_pkey',
      'users_pkey',
      'services_pkey',
    ]

    const foundIndexes = indexes.map(idx => idx.indexname)
    const missingCritical = criticalIndexes.filter(idx => !foundIndexes.includes(idx))

    if (missingCritical.length > 0) {
      return {
        check: 'Database Indexes',
        status: 'warning',
        message: `Отсутствуют критичные индексы: ${missingCritical.join(', ')}`,
        details: { total: indexes.length, missing: missingCritical },
      }
    }

    return {
      check: 'Database Indexes',
      status: 'pass',
      message: `Найдено ${indexes.length} индексов`,
      details: { total: indexes.length },
    }
  } catch (error) {
    return {
      check: 'Database Indexes',
      status: 'warning',
      message: 'Не удалось проверить индексы',
      details: { error: error instanceof Error ? error.message : String(error) },
    }
  }
}

/**
 * Проверка целостности данных
 */
async function checkDataIntegrity(): Promise<DiagnosticResult> {
  try {
    const issues: string[] = []

    // 1. Профили без пользователей
    const orphanedProfiles = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM profiles p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE u.id IS NULL
    `
    
    if (orphanedProfiles[0]?.count > 0) {
      issues.push(`${orphanedProfiles[0].count} профилей без пользователей`)
    }

    // 2. Услуги без профилей
    const orphanedServices = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM services s
      LEFT JOIN profiles p ON s.profile_id = p.id
      WHERE p.id IS NULL
    `
    
    if (orphanedServices[0]?.count > 0) {
      issues.push(`${orphanedServices[0].count} услуг без профилей`)
    }

    // 3. Отзывы без профилей
    const orphanedReviews = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM reviews r
      LEFT JOIN profiles p ON r.profile_id = p.id
      WHERE p.id IS NULL
    `
    
    if (orphanedReviews[0]?.count > 0) {
      issues.push(`${orphanedReviews[0].count} отзывов без профилей`)
    }

    if (issues.length > 0) {
      return {
        check: 'Data Integrity',
        status: 'warning',
        message: `Найдены проблемы целостности: ${issues.join(', ')}`,
        details: { issues },
      }
    }

    return {
      check: 'Data Integrity',
      status: 'pass',
      message: 'Целостность данных в порядке',
    }
  } catch (error) {
    return {
      check: 'Data Integrity',
      status: 'fail',
      message: 'Ошибка при проверке целостности',
      details: { error: error instanceof Error ? error.message : String(error) },
    }
  }
}

/**
 * Проверка производительности типичных запросов
 */
async function checkQueryPerformance(): Promise<DiagnosticResult> {
  try {
    const queries = []

    // 1. Загрузка списка профилей
    const start1 = Date.now()
    await prisma.profiles.findMany({ take: 10 })
    queries.push({ query: 'profiles.findMany(10)', duration: Date.now() - start1 })

    // 2. Загрузка одного профиля с relations
    const start2 = Date.now()
    const profile = await prisma.profiles.findFirst({
      include: {
        users_profiles_user_idTousers: true,
        services: true,
      },
    })
    queries.push({ query: 'profiles.findFirst + relations', duration: Date.now() - start2 })

    // 3. Подсчет профилей
    const start3 = Date.now()
    await prisma.profiles.count()
    queries.push({ query: 'profiles.count()', duration: Date.now() - start3 })

    const slowQueries = queries.filter(q => q.duration > 1000)

    if (slowQueries.length > 0) {
      return {
        check: 'Query Performance',
        status: 'warning',
        message: `${slowQueries.length} медленных запросов обнаружено`,
        details: { queries, slow: slowQueries },
      }
    }

    const avgDuration = queries.reduce((sum, q) => sum + q.duration, 0) / queries.length

    return {
      check: 'Query Performance',
      status: 'pass',
      message: `Производительность в норме (среднее: ${Math.round(avgDuration)}ms)`,
      details: { queries, avgDuration },
    }
  } catch (error) {
    return {
      check: 'Query Performance',
      status: 'fail',
      message: 'Ошибка при проверке производительности',
      details: { error: error instanceof Error ? error.message : String(error) },
    }
  }
}

/**
 * Быстрая проверка - только критичные пункты
 */
export async function runQuickCheck(): Promise<{
  status: 'ok' | 'issues'
  message: string
  details?: any
}> {
  try {
    // Проверка БД
    await prisma.$queryRaw`SELECT 1`

    // Проверка доступности основных таблиц
    const profilesCount = await prisma.profiles.count()
    const usersCount = await prisma.users.count()

    if (profilesCount === 0 || usersCount === 0) {
      return {
        status: 'issues',
        message: 'БД пуста или недоступна',
        details: { profilesCount, usersCount },
      }
    }

    return {
      status: 'ok',
      message: `Система работает (${profilesCount} профилей, ${usersCount} пользователей)`,
      details: { profilesCount, usersCount },
    }
  } catch (error) {
    return {
      status: 'issues',
      message: 'Ошибка подключения к БД',
      details: { error: error instanceof Error ? error.message : String(error) },
    }
  }
}

