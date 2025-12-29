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

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))
  const p = data.profiles[0]

  console.log('📊 Тест 1: только обязательные поля')
  try {
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city) VALUES ($1, $2, $3, $4)',
      [p.id, p.slug, p.display_name, p.city]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

  console.log('\n📊 Тест 2: + bio, description')
  try {
    await client.query('DELETE FROM profiles WHERE id = $1', [p.id])
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city, bio, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [p.id, p.slug, p.display_name, p.city, p.bio, p.description]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

  console.log('\n📊 Тест 3: + social_links (JSONB)')
  try {
    await client.query('DELETE FROM profiles WHERE id = $1', [p.id])
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city, social_links) VALUES ($1, $2, $3, $4, $5)',
      [p.id, p.slug, p.display_name, p.city, JSON.stringify(p.social_links)]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

  console.log('\n📊 Тест 4: + details (JSONB)')
  try {
    await client.query('DELETE FROM profiles WHERE id = $1', [p.id])
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city, social_links, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [p.id, p.slug, p.display_name, p.city, JSON.stringify(p.social_links), JSON.stringify(p.details)]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

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

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))
  const p = data.profiles[0]

  console.log('📊 Тест 1: только обязательные поля')
  try {
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city) VALUES ($1, $2, $3, $4)',
      [p.id, p.slug, p.display_name, p.city]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

  console.log('\n📊 Тест 2: + bio, description')
  try {
    await client.query('DELETE FROM profiles WHERE id = $1', [p.id])
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city, bio, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [p.id, p.slug, p.display_name, p.city, p.bio, p.description]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

  console.log('\n📊 Тест 3: + social_links (JSONB)')
  try {
    await client.query('DELETE FROM profiles WHERE id = $1', [p.id])
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city, social_links) VALUES ($1, $2, $3, $4, $5)',
      [p.id, p.slug, p.display_name, p.city, JSON.stringify(p.social_links)]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

  console.log('\n📊 Тест 4: + details (JSONB)')
  try {
    await client.query('DELETE FROM profiles WHERE id = $1', [p.id])
    await client.query(
      'INSERT INTO profiles (id, slug, display_name, city, social_links, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [p.id, p.slug, p.display_name, p.city, JSON.stringify(p.social_links), JSON.stringify(p.details)]
    )
    console.log('  ✅ Успешно!')
  } catch (err) {
    console.log('  ❌', err.message)
  }

} catch (err) {
  console.error('❌ Ошибка:', err.message)
} finally {
  await client.end()
}




