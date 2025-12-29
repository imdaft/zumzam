import { Client } from 'pg'
import { readFileSync } from 'fs'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const data = JSON.parse(readFileSync('old_supabase_data.json', 'utf8'))

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
})

async function importData() {
  console.log('\n📥 Импортирую category_images и ad_slots...\n')
  await client.connect()
  console.log('✅ Подключено')

  // 1. category_images
  const categoryImages = data.category_images || []
  console.log(`\n📊 category_images: ${categoryImages.length} записей...`)
  let insertedImages = 0
  for (const img of categoryImages) {
    try {
      await client.query(
        `INSERT INTO public.category_images (id, category, image_url, created_at) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, image_url = EXCLUDED.image_url;`,
        [img.id, img.category, img.image_url, img.created_at || new Date()]
      )
      insertedImages++
    } catch (error) {
      console.error(`  ⚠️  Ошибка в category_images (${img.category}):`, error.message)
    }
  }
  console.log(`  ✅ Вставлено: ${insertedImages}`)

  // 2. ad_slots
  const adSlots = data.ad_slots || []
  console.log(`\n📊 ad_slots: ${adSlots.length} записей...`)
  let insertedSlots = 0
  for (const slot of adSlots) {
    try {
      await client.query(
        `INSERT INTO public.ad_slots (id, name, description, created_at) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [slot.id, slot.name, slot.description, slot.created_at || new Date()]
      )
      insertedSlots++
    } catch (error) {
      console.error(`  ⚠️  Ошибка в ad_slots (${slot.name}):`, error.message)
    }
  }
  console.log(`  ✅ Вставлено: ${insertedSlots}`)

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!\n')

  // Проверка
  const { rows } = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM category_images) as category_images,
      (SELECT COUNT(*) FROM ad_slots) as ad_slots;
  `)
  console.log('📊 Проверка данных:', rows[0])

  await client.end()
}

importData()

import { readFileSync } from 'fs'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const data = JSON.parse(readFileSync('old_supabase_data.json', 'utf8'))

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
})

async function importData() {
  console.log('\n📥 Импортирую category_images и ad_slots...\n')
  await client.connect()
  console.log('✅ Подключено')

  // 1. category_images
  const categoryImages = data.category_images || []
  console.log(`\n📊 category_images: ${categoryImages.length} записей...`)
  let insertedImages = 0
  for (const img of categoryImages) {
    try {
      await client.query(
        `INSERT INTO public.category_images (id, category, image_url, created_at) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, image_url = EXCLUDED.image_url;`,
        [img.id, img.category, img.image_url, img.created_at || new Date()]
      )
      insertedImages++
    } catch (error) {
      console.error(`  ⚠️  Ошибка в category_images (${img.category}):`, error.message)
    }
  }
  console.log(`  ✅ Вставлено: ${insertedImages}`)

  // 2. ad_slots
  const adSlots = data.ad_slots || []
  console.log(`\n📊 ad_slots: ${adSlots.length} записей...`)
  let insertedSlots = 0
  for (const slot of adSlots) {
    try {
      await client.query(
        `INSERT INTO public.ad_slots (id, name, description, created_at) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [slot.id, slot.name, slot.description, slot.created_at || new Date()]
      )
      insertedSlots++
    } catch (error) {
      console.error(`  ⚠️  Ошибка в ad_slots (${slot.name}):`, error.message)
    }
  }
  console.log(`  ✅ Вставлено: ${insertedSlots}`)

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!\n')

  // Проверка
  const { rows } = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM category_images) as category_images,
      (SELECT COUNT(*) FROM ad_slots) as ad_slots;
  `)
  console.log('📊 Проверка данных:', rows[0])

  await client.end()
}

importData()




