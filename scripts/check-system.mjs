#!/usr/bin/env node
/**
 * Скрипт для быстрой проверки системы после миграции
 * 
 * Использование:
 *   node scripts/check-system.mjs
 *   npm run check-system
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logCheck(name, status, details = '') {
  const icon = status === 'ok' ? '✅' : status === 'warning' ? '⚠️' : '❌'
  const color = status === 'ok' ? 'green' : status === 'warning' ? 'yellow' : 'red'
  log(`${icon} ${name}`, color)
  if (details) {
    console.log(`   ${details}`)
  }
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    logCheck('Подключение к БД', 'ok', 'PostgreSQL через Prisma')
    return true
  } catch (error) {
    logCheck('Подключение к БД', 'error', error.message)
    return false
  }
}

async function checkTables() {
  try {
    const tables = [
      { name: 'users', count: await prisma.users.count() },
      { name: 'profiles', count: await prisma.profiles.count() },
      { name: 'services', count: await prisma.services.count() },
      { name: 'reviews', count: await prisma.reviews.count() },
      { name: 'profile_activities', count: await prisma.profile_activities.count() },
      { name: 'profile_services', count: await prisma.profile_services.count() },
    ]

    logCheck('Основные таблицы', 'ok')
    tables.forEach(table => {
      console.log(`   - ${table.name}: ${table.count} записей`)
    })

    return true
  } catch (error) {
    logCheck('Основные таблицы', 'error', error.message)
    return false
  }
}

async function checkDataIntegrity() {
  try {
    const issues = []

    // Профили без пользователей
    const orphanedProfiles = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM profiles p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE u.id IS NULL
    `
    if (orphanedProfiles[0]?.count > 0) {
      issues.push(`${orphanedProfiles[0].count} профилей без пользователей`)
    }

    // Услуги без профилей
    const orphanedServices = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM services s
      LEFT JOIN profiles p ON s.profile_id = p.id
      WHERE p.id IS NULL
    `
    if (orphanedServices[0]?.count > 0) {
      issues.push(`${orphanedServices[0].count} услуг без профилей`)
    }

    if (issues.length > 0) {
      logCheck('Целостность данных', 'warning')
      issues.forEach(issue => console.log(`   - ${issue}`))
    } else {
      logCheck('Целостность данных', 'ok', 'Все связи в порядке')
    }

    return true
  } catch (error) {
    logCheck('Целостность данных', 'error', error.message)
    return false
  }
}

async function checkPerformance() {
  try {
    const queries = []

    // Простой запрос
    let start = Date.now()
    await prisma.profiles.findMany({ take: 10 })
    queries.push({ name: 'profiles.findMany(10)', duration: Date.now() - start })

    // Запрос с relations
    start = Date.now()
    await prisma.profiles.findFirst({
      include: {
        users_profiles_user_idTousers: true,
        services: true,
      },
    })
    queries.push({ name: 'profiles + relations', duration: Date.now() - start })

    // Подсчет
    start = Date.now()
    await prisma.profiles.count()
    queries.push({ name: 'profiles.count()', duration: Date.now() - start })

    const avgDuration = queries.reduce((sum, q) => sum + q.duration, 0) / queries.length
    const slowQueries = queries.filter(q => q.duration > 1000)

    if (slowQueries.length > 0) {
      logCheck('Производительность', 'warning', `${slowQueries.length} медленных запросов`)
      slowQueries.forEach(q => {
        console.log(`   - ${q.name}: ${q.duration}ms`)
      })
    } else {
      logCheck('Производительность', 'ok', `Среднее время: ${Math.round(avgDuration)}ms`)
      queries.forEach(q => {
        console.log(`   - ${q.name}: ${q.duration}ms`)
      })
    }

    return true
  } catch (error) {
    logCheck('Производительность', 'error', error.message)
    return false
  }
}

async function checkCatalogs() {
  try {
    const catalogs = [
      { name: 'activity_catalog', count: await prisma.activity_catalog.count() },
      { name: 'service_catalog', count: await prisma.service_catalog.count() },
      { name: 'animator_services_catalog', count: await prisma.animator_services_catalog.count() },
      { name: 'show_types_catalog', count: await prisma.show_types_catalog.count() },
    ]

    const emptyCatalogs = catalogs.filter(c => c.count === 0)

    if (emptyCatalogs.length > 0) {
      logCheck('Каталоги', 'warning')
      catalogs.forEach(c => {
        const status = c.count === 0 ? '⚠️' : '✅'
        console.log(`   ${status} ${c.name}: ${c.count} записей`)
      })
    } else {
      logCheck('Каталоги', 'ok')
      catalogs.forEach(c => {
        console.log(`   - ${c.name}: ${c.count} записей`)
      })
    }

    return true
  } catch (error) {
    logCheck('Каталоги', 'error', error.message)
    return false
  }
}

async function main() {
  log('\n🔍 Проверка системы после миграции на Prisma\n', 'cyan')
  log('═'.repeat(50), 'blue')
  console.log()

  const results = []

  results.push(await checkDatabase())
  console.log()

  if (results[0]) {
    results.push(await checkTables())
    console.log()

    results.push(await checkCatalogs())
    console.log()

    results.push(await checkDataIntegrity())
    console.log()

    results.push(await checkPerformance())
    console.log()
  }

  log('═'.repeat(50), 'blue')

  const failed = results.filter(r => !r).length
  if (failed > 0) {
    log(`\n❌ Найдено ${failed} критических проблем\n`, 'red')
    process.exit(1)
  } else {
    log('\n✅ Все проверки пройдены успешно!\n', 'green')
    log('💡 Система работает корректно после миграции на Prisma', 'cyan')
    console.log()
  }
}

main()
  .catch(error => {
    log('\n❌ Критическая ошибка при проверке:', 'red')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

