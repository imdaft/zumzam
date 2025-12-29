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

console.log('📥 Импортирую ТОЛЬКО profiles с безопасными полями...\n')

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))
  const profiles = data.profiles || []

  console.log(`📊 Найдено profiles: ${profiles.length}`)

  await client.query('DELETE FROM profiles')

  let inserted = 0
  let skipped = 0

  // Безопасные поля которые точно работают
  const safeFields = [
    'id', 'slug', 'display_name', 'city',
    'bio', 'description', 'address',
    'rating', 'reviews_count', 'bookings_completed',
    'price_range', 'cover_photo', 'portfolio_url',
    'verified', 'verification_date',
    'email', 'phone', 'website',
    'created_at', 'updated_at', 'category',
    'main_photo', 'is_published', 'user_id',
    'photos', 'videos', // массивы
    'social_links', 'details' // jsonb
  ]

  for (const record of profiles) {
    try {
      const filteredRecord = {}
      for (const field of safeFields) {
        if (field in record) {
          filteredRecord[field] = record[field]
        }
      }

      const columns = Object.keys(filteredRecord)
      const values = Object.values(filteredRecord)
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

      await client.query(
        `INSERT INTO profiles (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      )
      inserted++
    } catch (err) {
      skipped++
      if (skipped === 1) {
        console.log(`⚠️  Первая ошибка: ${err.message}`)
      }
    }
  }

  console.log(`\n✅ Вставлено: ${inserted}, пропущено: ${skipped}`)

  const result = await client.query('SELECT COUNT(*) FROM profiles')
  console.log(`📊 Profiles в БД: ${result.rows[0].count}`)

} catch (err) {
  console.error('❌ Ошибка:', err.message)
} finally {
  await client.end()
}

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

console.log('📥 Импортирую ТОЛЬКО profiles с безопасными полями...\n')

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))
  const profiles = data.profiles || []

  console.log(`📊 Найдено profiles: ${profiles.length}`)

  await client.query('DELETE FROM profiles')

  let inserted = 0
  let skipped = 0

  // Безопасные поля которые точно работают
  const safeFields = [
    'id', 'slug', 'display_name', 'city',
    'bio', 'description', 'address',
    'rating', 'reviews_count', 'bookings_completed',
    'price_range', 'cover_photo', 'portfolio_url',
    'verified', 'verification_date',
    'email', 'phone', 'website',
    'created_at', 'updated_at', 'category',
    'main_photo', 'is_published', 'user_id',
    'photos', 'videos', // массивы
    'social_links', 'details' // jsonb
  ]

  for (const record of profiles) {
    try {
      const filteredRecord = {}
      for (const field of safeFields) {
        if (field in record) {
          filteredRecord[field] = record[field]
        }
      }

      const columns = Object.keys(filteredRecord)
      const values = Object.values(filteredRecord)
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

      await client.query(
        `INSERT INTO profiles (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      )
      inserted++
    } catch (err) {
      skipped++
      if (skipped === 1) {
        console.log(`⚠️  Первая ошибка: ${err.message}`)
      }
    }
  }

  console.log(`\n✅ Вставлено: ${inserted}, пропущено: ${skipped}`)

  const result = await client.query('SELECT COUNT(*) FROM profiles')
  console.log(`📊 Profiles в БД: ${result.rows[0].count}`)

} catch (err) {
  console.error('❌ Ошибка:', err.message)
} finally {
  await client.end()
}




