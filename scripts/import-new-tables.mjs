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

async function getTableColumns(tableName) {
  const res = await client.query(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1;`,
    [tableName]
  )
  return res.rows.map(row => ({ name: row.column_name, type: row.data_type, udt_name: row.udt_name }))
}

async function importTable(tableName) {
  const records = data[tableName] || []
  if (records.length === 0) {
    console.log(`⏭️  ${tableName}: пусто`)
    return
  }

  console.log(`\n📊 ${tableName}: ${records.length} записей...`)
  
  const dbColumns = await getTableColumns(tableName)
  
  let insertedCount = 0
  let skippedCount = 0

  for (const record of records) {
    const recordColumns = []
    const recordValues = []
    const placeholders = []

    for (const dbCol of dbColumns) {
      const colName = dbCol.name
      if (record.hasOwnProperty(colName)) {
        let value = record[colName]

        // Handle JSONB types
        if (dbCol.udt_name === 'jsonb') {
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value)
          } else if (value === null || value === undefined) {
            value = null
          } else {
            try {
              value = JSON.stringify(JSON.parse(value))
            } catch {
              value = JSON.stringify({})
            }
          }
        }
        // Handle array types
        else if (dbCol.udt_name.startsWith('_') && Array.isArray(value)) {
          value = `{${value.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')}}`
        }
        // Handle UUIDs
        else if (dbCol.type === 'uuid' && value === '') {
          value = null
        }
        // Skip vector types
        else if (colName === 'embedding' || colName === 'search_vector') {
          continue
        }

        recordColumns.push(colName)
        recordValues.push(value)
        placeholders.push(`$${recordValues.length}`)
      }
    }

    if (recordColumns.length > 0) {
      try {
        const query = `INSERT INTO public.${tableName} (${recordColumns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${recordColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ')};`
        await client.query(query, recordValues)
        insertedCount++
      } catch (error) {
        console.error(`  ⚠️  Ошибка в записи ${tableName} (ID: ${record.id || 'N/A'}):`, error.message)
        skippedCount++
      }
    } else {
      skippedCount++
    }
  }
  console.log(`  ✅ Вставлено: ${insertedCount}, пропущено: ${skippedCount}`)
}

async function importData() {
  console.log('\n📥 Импортирую НОВЫЕ таблицы...\n')
  await client.connect()
  console.log('✅ Подключено')

  // Импортируем новые таблицы
  await importTable('ad_campaigns')
  await importTable('ad_bookings')
  await importTable('order_requests')
  await importTable('show_programs')
  await importTable('animator_characters')

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!\n')

  // Проверка
  const { rows } = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM ad_campaigns) as ad_campaigns,
      (SELECT COUNT(*) FROM ad_bookings) as ad_bookings,
      (SELECT COUNT(*) FROM order_requests) as order_requests,
      (SELECT COUNT(*) FROM show_programs) as show_programs,
      (SELECT COUNT(*) FROM animator_characters) as animator_characters;
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

async function getTableColumns(tableName) {
  const res = await client.query(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1;`,
    [tableName]
  )
  return res.rows.map(row => ({ name: row.column_name, type: row.data_type, udt_name: row.udt_name }))
}

async function importTable(tableName) {
  const records = data[tableName] || []
  if (records.length === 0) {
    console.log(`⏭️  ${tableName}: пусто`)
    return
  }

  console.log(`\n📊 ${tableName}: ${records.length} записей...`)
  
  const dbColumns = await getTableColumns(tableName)
  
  let insertedCount = 0
  let skippedCount = 0

  for (const record of records) {
    const recordColumns = []
    const recordValues = []
    const placeholders = []

    for (const dbCol of dbColumns) {
      const colName = dbCol.name
      if (record.hasOwnProperty(colName)) {
        let value = record[colName]

        // Handle JSONB types
        if (dbCol.udt_name === 'jsonb') {
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value)
          } else if (value === null || value === undefined) {
            value = null
          } else {
            try {
              value = JSON.stringify(JSON.parse(value))
            } catch {
              value = JSON.stringify({})
            }
          }
        }
        // Handle array types
        else if (dbCol.udt_name.startsWith('_') && Array.isArray(value)) {
          value = `{${value.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')}}`
        }
        // Handle UUIDs
        else if (dbCol.type === 'uuid' && value === '') {
          value = null
        }
        // Skip vector types
        else if (colName === 'embedding' || colName === 'search_vector') {
          continue
        }

        recordColumns.push(colName)
        recordValues.push(value)
        placeholders.push(`$${recordValues.length}`)
      }
    }

    if (recordColumns.length > 0) {
      try {
        const query = `INSERT INTO public.${tableName} (${recordColumns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${recordColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ')};`
        await client.query(query, recordValues)
        insertedCount++
      } catch (error) {
        console.error(`  ⚠️  Ошибка в записи ${tableName} (ID: ${record.id || 'N/A'}):`, error.message)
        skippedCount++
      }
    } else {
      skippedCount++
    }
  }
  console.log(`  ✅ Вставлено: ${insertedCount}, пропущено: ${skippedCount}`)
}

async function importData() {
  console.log('\n📥 Импортирую НОВЫЕ таблицы...\n')
  await client.connect()
  console.log('✅ Подключено')

  // Импортируем новые таблицы
  await importTable('ad_campaigns')
  await importTable('ad_bookings')
  await importTable('order_requests')
  await importTable('show_programs')
  await importTable('animator_characters')

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!\n')

  // Проверка
  const { rows } = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM ad_campaigns) as ad_campaigns,
      (SELECT COUNT(*) FROM ad_bookings) as ad_bookings,
      (SELECT COUNT(*) FROM order_requests) as order_requests,
      (SELECT COUNT(*) FROM show_programs) as show_programs,
      (SELECT COUNT(*) FROM animator_characters) as animator_characters;
  `)
  console.log('📊 Проверка данных:', rows[0])

  await client.end()
}

importData()




