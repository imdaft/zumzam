import pg from 'pg'
import fs from 'fs'

const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: 'SCNK88tank33',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('📥 Импортирую данные в Managed PostgreSQL...\n')

try {
  await client.connect()
  console.log('✅ Подключено к Managed PostgreSQL\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  // Порядок важен из-за foreign keys
  const tables = [
    'users',
    'profiles',
    'profile_activities',
    'profile_services',
    'profile_locations',
    'master_class_programs',
    'show_programs',
    'quest_programs',
    'animator_characters',
    'agency_partners',
    'agency_cases',
    'reviews',
    'user_activity'
  ]

  for (const table of tables) {
    const records = data[table] || []
    if (records.length === 0) {
      console.log(`⏭️  ${table}: пусто`)
      continue
    }

    console.log(`📊 ${table}: ${records.length} записей...`)
    
    // Очищаем таблицу
    await client.query(`TRUNCATE TABLE ${table} CASCADE`)

    // Вставляем данные
    let inserted = 0
    for (const record of records) {
      try {
        // Убираем колонки которых нет в новой схеме
        const cleanRecord = { ...record }
        delete cleanRecord.metadata
        delete cleanRecord.business_models
        delete cleanRecord.is_primary
        delete cleanRecord.is_included
        delete cleanRecord.working_hours
        if (table === 'master_class_programs' && cleanRecord.photos) {
          cleanRecord.photo = Array.isArray(cleanRecord.photos) ? cleanRecord.photos[0] : cleanRecord.photos
          delete cleanRecord.photos
        }
        
        const columns = Object.keys(cleanRecord).join(', ')
        const values = Object.values(cleanRecord)
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
        
        await client.query(
          `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        )
        inserted++
      } catch (err) {
        // Пропускаем проблемные записи
        if (err.message.includes('does not exist') && err.message.includes('relation')) {
          console.log(`  ⏭️  Таблица ${table} не существует, пропускаем`)
          break
        }
        // console.log(`  ⚠️  ${err.message.split('\n')[0]}`)
      }
    }
    
    console.log(`  ✅ Вставлено: ${inserted}/${records.length}`)
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  
  // Проверка
  console.log('\n📊 Проверка данных:')
  const result = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM profiles) as profiles,
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM reviews) as reviews
  `)
  console.log(result.rows[0])

} catch (err) {
  console.error('❌ Ошибка:', err.message)
} finally {
  await client.end()
}



const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: 'SCNK88tank33',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('📥 Импортирую данные в Managed PostgreSQL...\n')

try {
  await client.connect()
  console.log('✅ Подключено к Managed PostgreSQL\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  // Порядок важен из-за foreign keys
  const tables = [
    'users',
    'profiles',
    'profile_activities',
    'profile_services',
    'profile_locations',
    'master_class_programs',
    'show_programs',
    'quest_programs',
    'animator_characters',
    'agency_partners',
    'agency_cases',
    'reviews',
    'user_activity'
  ]

  for (const table of tables) {
    const records = data[table] || []
    if (records.length === 0) {
      console.log(`⏭️  ${table}: пусто`)
      continue
    }

    console.log(`📊 ${table}: ${records.length} записей...`)
    
    // Очищаем таблицу
    await client.query(`TRUNCATE TABLE ${table} CASCADE`)

    // Вставляем данные
    let inserted = 0
    for (const record of records) {
      try {
        // Убираем колонки которых нет в новой схеме
        const cleanRecord = { ...record }
        delete cleanRecord.metadata
        delete cleanRecord.business_models
        delete cleanRecord.is_primary
        delete cleanRecord.is_included
        delete cleanRecord.working_hours
        if (table === 'master_class_programs' && cleanRecord.photos) {
          cleanRecord.photo = Array.isArray(cleanRecord.photos) ? cleanRecord.photos[0] : cleanRecord.photos
          delete cleanRecord.photos
        }
        
        const columns = Object.keys(cleanRecord).join(', ')
        const values = Object.values(cleanRecord)
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
        
        await client.query(
          `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        )
        inserted++
      } catch (err) {
        // Пропускаем проблемные записи
        if (err.message.includes('does not exist') && err.message.includes('relation')) {
          console.log(`  ⏭️  Таблица ${table} не существует, пропускаем`)
          break
        }
        // console.log(`  ⚠️  ${err.message.split('\n')[0]}`)
      }
    }
    
    console.log(`  ✅ Вставлено: ${inserted}/${records.length}`)
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  
  // Проверка
  console.log('\n📊 Проверка данных:')
  const result = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM profiles) as profiles,
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM reviews) as reviews
  `)
  console.log(result.rows[0])

} catch (err) {
  console.error('❌ Ошибка:', err.message)
} finally {
  await client.end()
}

