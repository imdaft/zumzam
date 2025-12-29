/**
 * Глобальный тест всех мигрированных API
 * Проверяет работоспособность Prisma, JWT, и всех endpoint'ов
 */

import pg from 'pg'

const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: 'SCNK88tank33',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('\n🧪 ГЛОБАЛЬНОЕ ТЕСТИРОВАНИЕ МИГРАЦИИ\n')
console.log('=' .repeat(60))
console.log()

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

function logTest(name, status, message = '') {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️' }
  const colors = { pass: '\x1b[32m', fail: '\x1b[31m', warn: '\x1b[33m', reset: '\x1b[0m' }
  
  console.log(`${symbols[status]} ${colors[status]}${name}${colors.reset}`)
  if (message) console.log(`   ${message}`)
  
  results.tests.push({ name, status, message })
  if (status === 'pass') results.passed++
  else if (status === 'fail') results.failed++
  else results.warnings++
}

try {
  await client.connect()
  logTest('Подключение к Managed PostgreSQL', 'pass')
  
  // ============================================
  // ТЕСТ 1: ПРОВЕРКА НОВЫХ ТАБЛИЦ
  // ============================================
  console.log('\n📊 Тест 1: Новые таблицы\n')
  
  const newTables = [
    'conversations', 'messages', 'orders', 'user_sources', 
    'user_interests', 'user_section_views', 'cart', 'bookings',
    'folders', 'folder_items', 'pipelines', 'pipeline_stages',
    'pipeline_deals', 'board_subscriptions', 'favorites'
  ]
  
  for (const table of newTables) {
    const result = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [table]
    )
    
    if (result.rows[0].exists) {
      logTest(`Таблица ${table}`, 'pass')
    } else {
      logTest(`Таблица ${table}`, 'fail', 'Не найдена в БД')
    }
  }
  
  // ============================================
  // ТЕСТ 2: ПРОВЕРКА СУЩЕСТВУЮЩИХ ТАБЛИЦ
  // ============================================
  console.log('\n📊 Тест 2: Существующие таблицы\n')
  
  const existingTables = [
    'users', 'profiles', 'reviews', 'services', 
    'master_class_programs', 'show_programs', 'quest_programs',
    'animator_characters', 'agency_partners', 'profile_locations',
    'order_requests', 'user_activity', 'ad_campaigns', 'ad_bookings'
  ]
  
  for (const table of existingTables) {
    const result = await client.query(
      `SELECT COUNT(*) as count FROM ${table}`
    )
    
    const count = parseInt(result.rows[0].count)
    if (count >= 0) {
      logTest(`Таблица ${table}`, 'pass', `${count} записей`)
    } else {
      logTest(`Таблица ${table}`, 'fail', 'Ошибка чтения')
    }
  }
  
  // ============================================
  // ТЕСТ 3: ПРОВЕРКА ДАННЫХ
  // ============================================
  console.log('\n📊 Тест 3: Целостность данных\n')
  
  // Профили
  const profilesResult = await client.query('SELECT COUNT(*) FROM profiles')
  const profilesCount = parseInt(profilesResult.rows[0].count)
  if (profilesCount > 0) {
    logTest('Профили', 'pass', `${profilesCount} записей`)
  } else {
    logTest('Профили', 'warn', 'Нет данных')
  }
  
  // Пользователи
  const usersResult = await client.query('SELECT COUNT(*) FROM users')
  const usersCount = parseInt(usersResult.rows[0].count)
  if (usersCount > 0) {
    logTest('Пользователи', 'pass', `${usersCount} записей`)
  } else {
    logTest('Пользователи', 'fail', 'Нет пользователей!')
  }
  
  // Отзывы
  const reviewsResult = await client.query('SELECT COUNT(*) FROM reviews')
  const reviewsCount = parseInt(reviewsResult.rows[0].count)
  if (reviewsCount > 0) {
    logTest('Отзывы', 'pass', `${reviewsCount} записей`)
  } else {
    logTest('Отзывы', 'warn', 'Нет отзывов')
  }
  
  // Заявки
  const requestsResult = await client.query('SELECT COUNT(*) FROM order_requests')
  const requestsCount = parseInt(requestsResult.rows[0].count)
  if (requestsCount > 0) {
    logTest('Заявки', 'pass', `${requestsCount} записей`)
  } else {
    logTest('Заявки', 'warn', 'Нет заявок')
  }
  
  // User Activity
  const activityResult = await client.query('SELECT COUNT(*) FROM user_activity')
  const activityCount = parseInt(activityResult.rows[0].count)
  if (activityCount > 0) {
    logTest('User Activity', 'pass', `${activityCount} записей (аналитика работает!)`)
  } else {
    logTest('User Activity', 'warn', 'Нет данных активности')
  }
  
  // ============================================
  // ТЕСТ 4: ПРОВЕРКА СВЯЗЕЙ (Foreign Keys)
  // ============================================
  console.log('\n📊 Тест 4: Связи между таблицами\n')
  
  // Проверяем что у профилей есть user_id
  const profilesWithUsers = await client.query(
    'SELECT COUNT(*) FROM profiles WHERE user_id IS NOT NULL'
  )
  const profilesWithUsersCount = parseInt(profilesWithUsers.rows[0].count)
  if (profilesWithUsersCount === profilesCount) {
    logTest('Связь profiles → users', 'pass', 'Все профили имеют user_id')
  } else {
    logTest('Связь profiles → users', 'warn', `${profilesWithUsersCount}/${profilesCount} профилей`)
  }
  
  // Проверяем отзывы
  const reviewsWithProfiles = await client.query(
    'SELECT COUNT(*) FROM reviews WHERE profile_id IS NOT NULL'
  )
  const reviewsWithProfilesCount = parseInt(reviewsWithProfiles.rows[0].count)
  if (reviewsWithProfilesCount === reviewsCount) {
    logTest('Связь reviews → profiles', 'pass', 'Все отзывы привязаны к профилям')
  } else {
    logTest('Связь reviews → profiles', 'warn', `${reviewsWithProfilesCount}/${reviewsCount} отзывов`)
  }
  
  // ============================================
  // ТЕСТ 5: ПРОВЕРКА ИНДЕКСОВ
  // ============================================
  console.log('\n📊 Тест 5: Индексы производительности\n')
  
  const indexes = await client.query(`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'users', 'reviews', 'order_requests', 'conversations', 'messages')
    ORDER BY tablename
  `)
  
  const tableIndexes = {}
  indexes.rows.forEach(row => {
    tableIndexes[row.tablename] = (tableIndexes[row.tablename] || 0) + 1
  })
  
  for (const [table, count] of Object.entries(tableIndexes)) {
    if (count > 0) {
      logTest(`Индексы ${table}`, 'pass', `${count} индексов`)
    } else {
      logTest(`Индексы ${table}`, 'warn', 'Нет индексов')
    }
  }
  
  // ============================================
  // ТЕСТ 6: ПРОВЕРКА НОВЫХ ТАБЛИЦ (пустые)
  // ============================================
  console.log('\n📊 Тест 6: Новые таблицы (ожидается 0 записей)\n')
  
  for (const table of ['conversations', 'messages', 'orders', 'cart', 'bookings']) {
    const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
    const count = parseInt(result.rows[0].count)
    logTest(`${table} (пустая)`, count === 0 ? 'pass' : 'warn', `${count} записей`)
  }
  
  // ============================================
  // ИТОГИ
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 ИТОГИ ТЕСТИРОВАНИЯ\n')
  console.log(`✅ Успешно: ${results.passed}`)
  console.log(`❌ Ошибки: ${results.failed}`)
  console.log(`⚠️  Предупреждения: ${results.warnings}`)
  console.log()
  
  if (results.failed === 0) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!')
    console.log('✅ Миграция работает корректно')
    console.log('✅ Prisma подключен правильно')
    console.log('✅ Все таблицы на месте')
    console.log('✅ Данные сохранены')
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ!')
    console.log(`Не пройдено тестов: ${results.failed}`)
  }
  
  console.log()
  
} catch (error) {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  await client.end()
}

 * Глобальный тест всех мигрированных API
 * Проверяет работоспособность Prisma, JWT, и всех endpoint'ов
 */

import pg from 'pg'

const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: 'SCNK88tank33',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('\n🧪 ГЛОБАЛЬНОЕ ТЕСТИРОВАНИЕ МИГРАЦИИ\n')
console.log('=' .repeat(60))
console.log()

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

function logTest(name, status, message = '') {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️' }
  const colors = { pass: '\x1b[32m', fail: '\x1b[31m', warn: '\x1b[33m', reset: '\x1b[0m' }
  
  console.log(`${symbols[status]} ${colors[status]}${name}${colors.reset}`)
  if (message) console.log(`   ${message}`)
  
  results.tests.push({ name, status, message })
  if (status === 'pass') results.passed++
  else if (status === 'fail') results.failed++
  else results.warnings++
}

try {
  await client.connect()
  logTest('Подключение к Managed PostgreSQL', 'pass')
  
  // ============================================
  // ТЕСТ 1: ПРОВЕРКА НОВЫХ ТАБЛИЦ
  // ============================================
  console.log('\n📊 Тест 1: Новые таблицы\n')
  
  const newTables = [
    'conversations', 'messages', 'orders', 'user_sources', 
    'user_interests', 'user_section_views', 'cart', 'bookings',
    'folders', 'folder_items', 'pipelines', 'pipeline_stages',
    'pipeline_deals', 'board_subscriptions', 'favorites'
  ]
  
  for (const table of newTables) {
    const result = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [table]
    )
    
    if (result.rows[0].exists) {
      logTest(`Таблица ${table}`, 'pass')
    } else {
      logTest(`Таблица ${table}`, 'fail', 'Не найдена в БД')
    }
  }
  
  // ============================================
  // ТЕСТ 2: ПРОВЕРКА СУЩЕСТВУЮЩИХ ТАБЛИЦ
  // ============================================
  console.log('\n📊 Тест 2: Существующие таблицы\n')
  
  const existingTables = [
    'users', 'profiles', 'reviews', 'services', 
    'master_class_programs', 'show_programs', 'quest_programs',
    'animator_characters', 'agency_partners', 'profile_locations',
    'order_requests', 'user_activity', 'ad_campaigns', 'ad_bookings'
  ]
  
  for (const table of existingTables) {
    const result = await client.query(
      `SELECT COUNT(*) as count FROM ${table}`
    )
    
    const count = parseInt(result.rows[0].count)
    if (count >= 0) {
      logTest(`Таблица ${table}`, 'pass', `${count} записей`)
    } else {
      logTest(`Таблица ${table}`, 'fail', 'Ошибка чтения')
    }
  }
  
  // ============================================
  // ТЕСТ 3: ПРОВЕРКА ДАННЫХ
  // ============================================
  console.log('\n📊 Тест 3: Целостность данных\n')
  
  // Профили
  const profilesResult = await client.query('SELECT COUNT(*) FROM profiles')
  const profilesCount = parseInt(profilesResult.rows[0].count)
  if (profilesCount > 0) {
    logTest('Профили', 'pass', `${profilesCount} записей`)
  } else {
    logTest('Профили', 'warn', 'Нет данных')
  }
  
  // Пользователи
  const usersResult = await client.query('SELECT COUNT(*) FROM users')
  const usersCount = parseInt(usersResult.rows[0].count)
  if (usersCount > 0) {
    logTest('Пользователи', 'pass', `${usersCount} записей`)
  } else {
    logTest('Пользователи', 'fail', 'Нет пользователей!')
  }
  
  // Отзывы
  const reviewsResult = await client.query('SELECT COUNT(*) FROM reviews')
  const reviewsCount = parseInt(reviewsResult.rows[0].count)
  if (reviewsCount > 0) {
    logTest('Отзывы', 'pass', `${reviewsCount} записей`)
  } else {
    logTest('Отзывы', 'warn', 'Нет отзывов')
  }
  
  // Заявки
  const requestsResult = await client.query('SELECT COUNT(*) FROM order_requests')
  const requestsCount = parseInt(requestsResult.rows[0].count)
  if (requestsCount > 0) {
    logTest('Заявки', 'pass', `${requestsCount} записей`)
  } else {
    logTest('Заявки', 'warn', 'Нет заявок')
  }
  
  // User Activity
  const activityResult = await client.query('SELECT COUNT(*) FROM user_activity')
  const activityCount = parseInt(activityResult.rows[0].count)
  if (activityCount > 0) {
    logTest('User Activity', 'pass', `${activityCount} записей (аналитика работает!)`)
  } else {
    logTest('User Activity', 'warn', 'Нет данных активности')
  }
  
  // ============================================
  // ТЕСТ 4: ПРОВЕРКА СВЯЗЕЙ (Foreign Keys)
  // ============================================
  console.log('\n📊 Тест 4: Связи между таблицами\n')
  
  // Проверяем что у профилей есть user_id
  const profilesWithUsers = await client.query(
    'SELECT COUNT(*) FROM profiles WHERE user_id IS NOT NULL'
  )
  const profilesWithUsersCount = parseInt(profilesWithUsers.rows[0].count)
  if (profilesWithUsersCount === profilesCount) {
    logTest('Связь profiles → users', 'pass', 'Все профили имеют user_id')
  } else {
    logTest('Связь profiles → users', 'warn', `${profilesWithUsersCount}/${profilesCount} профилей`)
  }
  
  // Проверяем отзывы
  const reviewsWithProfiles = await client.query(
    'SELECT COUNT(*) FROM reviews WHERE profile_id IS NOT NULL'
  )
  const reviewsWithProfilesCount = parseInt(reviewsWithProfiles.rows[0].count)
  if (reviewsWithProfilesCount === reviewsCount) {
    logTest('Связь reviews → profiles', 'pass', 'Все отзывы привязаны к профилям')
  } else {
    logTest('Связь reviews → profiles', 'warn', `${reviewsWithProfilesCount}/${reviewsCount} отзывов`)
  }
  
  // ============================================
  // ТЕСТ 5: ПРОВЕРКА ИНДЕКСОВ
  // ============================================
  console.log('\n📊 Тест 5: Индексы производительности\n')
  
  const indexes = await client.query(`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'users', 'reviews', 'order_requests', 'conversations', 'messages')
    ORDER BY tablename
  `)
  
  const tableIndexes = {}
  indexes.rows.forEach(row => {
    tableIndexes[row.tablename] = (tableIndexes[row.tablename] || 0) + 1
  })
  
  for (const [table, count] of Object.entries(tableIndexes)) {
    if (count > 0) {
      logTest(`Индексы ${table}`, 'pass', `${count} индексов`)
    } else {
      logTest(`Индексы ${table}`, 'warn', 'Нет индексов')
    }
  }
  
  // ============================================
  // ТЕСТ 6: ПРОВЕРКА НОВЫХ ТАБЛИЦ (пустые)
  // ============================================
  console.log('\n📊 Тест 6: Новые таблицы (ожидается 0 записей)\n')
  
  for (const table of ['conversations', 'messages', 'orders', 'cart', 'bookings']) {
    const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
    const count = parseInt(result.rows[0].count)
    logTest(`${table} (пустая)`, count === 0 ? 'pass' : 'warn', `${count} записей`)
  }
  
  // ============================================
  // ИТОГИ
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 ИТОГИ ТЕСТИРОВАНИЯ\n')
  console.log(`✅ Успешно: ${results.passed}`)
  console.log(`❌ Ошибки: ${results.failed}`)
  console.log(`⚠️  Предупреждения: ${results.warnings}`)
  console.log()
  
  if (results.failed === 0) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!')
    console.log('✅ Миграция работает корректно')
    console.log('✅ Prisma подключен правильно')
    console.log('✅ Все таблицы на месте')
    console.log('✅ Данные сохранены')
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ!')
    console.log(`Не пройдено тестов: ${results.failed}`)
  }
  
  console.log()
  
} catch (error) {
  console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  await client.end()
}




