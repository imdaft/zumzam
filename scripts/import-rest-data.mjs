import pg from 'pg'
import fs from 'fs'

const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: process.env.DB_PASSWORD || process.env.DATABASE_URL?.match(/:(.*)@/)?.[1] || '',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('📥 Импортирую остальные данные...\n')

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  const tables = [
    'profile_activities',
    'profile_services',
    'profile_locations',
    'master_class_programs',
    'reviews'
  ]

  for (const table of tables) {
    const records = data[table] || []
    if (records.length === 0) {
      console.log(`⏭️  ${table}: пусто`)
      continue
    }

    console.log(`📊 ${table}: ${records.length} записей...`)

    // Получаем существующие колонки из схемы
    const schemaResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [table])
    const validColumns = schemaResult.rows.map(r => r.column_name)

    await client.query(`DELETE FROM ${table}`)

    let inserted = 0
    let skipped = 0

    for (const record of records) {
      try {
        // Фильтруем только существующие колонки
        const filteredRecord = {}
        for (const col of validColumns) {
          if (col in record) {
            filteredRecord[col] = record[col]
          }
        }

        // Специальная обработка для master_class_programs
        if (table === 'master_class_programs') {
          if ('photos' in record && validColumns.includes('photo')) {
            filteredRecord.photo = Array.isArray(record.photos) ? record.photos[0] : record.photos
          }
          if ('duration' in record && validColumns.includes('duration_minutes')) {
            filteredRecord.duration_minutes = record.duration
          }
          if ('is_active' in record && validColumns.includes('active')) {
            filteredRecord.active = record.is_active
          }
        }

        // Reviews: author_id -> user_id
        if (table === 'reviews' && 'author_id' in record && validColumns.includes('user_id')) {
          filteredRecord.user_id = record.author_id
        }

        const columns = Object.keys(filteredRecord)
        if (columns.length === 0) {
          skipped++
          continue
        }

        const values = columns.map(k => filteredRecord[k])
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

        await client.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        )
        inserted++
      } catch (err) {
        skipped++
        if (skipped === 1) {
          console.log(`  ⚠️  ${err.message.split('\n')[0]}`)
        }
      }
    }

    console.log(`  ✅ Вставлено: ${inserted}, пропущено: ${skipped}`)
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  console.log('\n📊 Проверка данных:')
  const result = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM profiles) as profiles,
      (SELECT COUNT(*) FROM reviews) as reviews,
      (SELECT COUNT(*) FROM profile_locations) as locations,
      (SELECT COUNT(*) FROM master_class_programs) as master_class_programs
  `)
  console.log(result.rows[0])

} catch (err) {
  console.error('❌ Ошибка:', err.message)
  console.error(err.stack)
} finally {
  await client.end()
}



const { Client } = pg

const client = new Client({
  host: 'rc1b-ktk7vobktajbv2sd.mdb.yandexcloud.net',
  port: 6432,
  user: 'zumzam_admin',
  password: process.env.DB_PASSWORD || process.env.DATABASE_URL?.match(/:(.*)@/)?.[1] || '',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('📥 Импортирую остальные данные...\n')

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  const tables = [
    'profile_activities',
    'profile_services',
    'profile_locations',
    'master_class_programs',
    'reviews'
  ]

  for (const table of tables) {
    const records = data[table] || []
    if (records.length === 0) {
      console.log(`⏭️  ${table}: пусто`)
      continue
    }

    console.log(`📊 ${table}: ${records.length} записей...`)

    // Получаем существующие колонки из схемы
    const schemaResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [table])
    const validColumns = schemaResult.rows.map(r => r.column_name)

    await client.query(`DELETE FROM ${table}`)

    let inserted = 0
    let skipped = 0

    for (const record of records) {
      try {
        // Фильтруем только существующие колонки
        const filteredRecord = {}
        for (const col of validColumns) {
          if (col in record) {
            filteredRecord[col] = record[col]
          }
        }

        // Специальная обработка для master_class_programs
        if (table === 'master_class_programs') {
          if ('photos' in record && validColumns.includes('photo')) {
            filteredRecord.photo = Array.isArray(record.photos) ? record.photos[0] : record.photos
          }
          if ('duration' in record && validColumns.includes('duration_minutes')) {
            filteredRecord.duration_minutes = record.duration
          }
          if ('is_active' in record && validColumns.includes('active')) {
            filteredRecord.active = record.is_active
          }
        }

        // Reviews: author_id -> user_id
        if (table === 'reviews' && 'author_id' in record && validColumns.includes('user_id')) {
          filteredRecord.user_id = record.author_id
        }

        const columns = Object.keys(filteredRecord)
        if (columns.length === 0) {
          skipped++
          continue
        }

        const values = columns.map(k => filteredRecord[k])
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

        await client.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        )
        inserted++
      } catch (err) {
        skipped++
        if (skipped === 1) {
          console.log(`  ⚠️  ${err.message.split('\n')[0]}`)
        }
      }
    }

    console.log(`  ✅ Вставлено: ${inserted}, пропущено: ${skipped}`)
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  console.log('\n📊 Проверка данных:')
  const result = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM profiles) as profiles,
      (SELECT COUNT(*) FROM reviews) as reviews,
      (SELECT COUNT(*) FROM profile_locations) as locations,
      (SELECT COUNT(*) FROM master_class_programs) as master_class_programs
  `)
  console.log(result.rows[0])

} catch (err) {
  console.error('❌ Ошибка:', err.message)
  console.error(err.stack)
} finally {
  await client.end()
}

