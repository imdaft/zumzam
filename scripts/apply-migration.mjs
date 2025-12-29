import pg from 'pg'
import { readFileSync } from 'fs'

const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: 'SCNK88tank33',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('\n📊 Применяю миграцию...\n')

try {
  await client.connect()
  console.log('✅ Подключено к Managed PostgreSQL\n')

  const sql = readFileSync('supabase/migrations/20251225_create_missing_tables.sql', 'utf8')
  
  await client.query(sql)
  
  console.log('✅ Миграция успешно применена!\n')
  
  // Проверяем созданные таблицы
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('conversations', 'messages', 'orders', 'user_sources', 'user_interests', 'user_section_views', 'cart', 'bookings', 'folders', 'pipelines', 'board_subscriptions', 'favorites')
    ORDER BY table_name
  `)
  
  console.log('📋 Созданные таблицы:')
  result.rows.forEach(row => {
    console.log(`  ✅ ${row.table_name}`)
  })
  console.log()
  
} catch (error) {
  console.error('❌ Ошибка:', error.message)
  process.exit(1)
} finally {
  await client.end()
}

import { readFileSync } from 'fs'

const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: 'SCNK88tank33',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('\n📊 Применяю миграцию...\n')

try {
  await client.connect()
  console.log('✅ Подключено к Managed PostgreSQL\n')

  const sql = readFileSync('supabase/migrations/20251225_create_missing_tables.sql', 'utf8')
  
  await client.query(sql)
  
  console.log('✅ Миграция успешно применена!\n')
  
  // Проверяем созданные таблицы
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('conversations', 'messages', 'orders', 'user_sources', 'user_interests', 'user_section_views', 'cart', 'bookings', 'folders', 'pipelines', 'board_subscriptions', 'favorites')
    ORDER BY table_name
  `)
  
  console.log('📋 Созданные таблицы:')
  result.rows.forEach(row => {
    console.log(`  ✅ ${row.table_name}`)
  })
  console.log()
  
} catch (error) {
  console.error('❌ Ошибка:', error.message)
  process.exit(1)
} finally {
  await client.end()
}




