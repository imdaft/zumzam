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

console.log('📥 Импортирую оставшиеся таблицы...\n')

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  async function getTableColumns(tableName) {
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [tableName])
    return result.rows.map(r => r.column_name)
  }

  async function getColumnTypes(tableName) {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [tableName])
    const types = {}
    result.rows.forEach(row => {
      types[row.column_name] = row.data_type
    })
    return types
  }

  const tables = ['ad_slots', 'ad_campaigns', 'ad_bookings', 'order_requests', 'category_images']

  for (const table of tables) {
    try {
      const records = data[table]
      if (!records || records.length === 0) {
        console.log(`⏭️  ${table}: пусто`)
        continue
      }

      console.log(`📊 ${table}: ${records.length} записей...`)
      
      const validColumns = await getTableColumns(table)
      if (validColumns.length === 0) {
        console.log(`  ⏭️  Таблица не найдена`)
        continue
      }

      const columnTypes = await getColumnTypes(table)
      
      // Очищаем таблицу
      await client.query(`DELETE FROM ${table}`)

      let inserted = 0
      let skipped = 0
      
      for (const record of records) {
        let filteredRecord = {}
        try {
          for (const col of validColumns) {
            if (col in record) {
              if (col === 'embedding') continue
              
              let value = record[col]
              
              const colType = columnTypes[col]
              if (colType === 'jsonb' || colType === 'json') {
                if (value !== null && value !== undefined && typeof value === 'object') {
                  value = JSON.stringify(value)
                } else if (value === null || value === undefined) {
                  value = null
                }
              }
              
              filteredRecord[col] = value
            }
          }

          const columns = Object.keys(filteredRecord)
          const values = Object.values(filteredRecord)
          
          if (columns.length === 0) {
            skipped++
            continue
          }

          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
          
          await client.query(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          )
          inserted++
        } catch (err) {
          skipped++
          if (skipped === 1) {
            console.log(`  ⚠️  ${err.message}`)
          }
        }
      }
      
      console.log(`  ✅ Вставлено: ${inserted}, пропущено: ${skipped}`)
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message}`)
    }
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  
} catch (err) {
  console.error('❌ Ошибка:', err)
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

console.log('📥 Импортирую оставшиеся таблицы...\n')

try {
  await client.connect()
  console.log('✅ Подключено\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  async function getTableColumns(tableName) {
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [tableName])
    return result.rows.map(r => r.column_name)
  }

  async function getColumnTypes(tableName) {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [tableName])
    const types = {}
    result.rows.forEach(row => {
      types[row.column_name] = row.data_type
    })
    return types
  }

  const tables = ['ad_slots', 'ad_campaigns', 'ad_bookings', 'order_requests', 'category_images']

  for (const table of tables) {
    try {
      const records = data[table]
      if (!records || records.length === 0) {
        console.log(`⏭️  ${table}: пусто`)
        continue
      }

      console.log(`📊 ${table}: ${records.length} записей...`)
      
      const validColumns = await getTableColumns(table)
      if (validColumns.length === 0) {
        console.log(`  ⏭️  Таблица не найдена`)
        continue
      }

      const columnTypes = await getColumnTypes(table)
      
      // Очищаем таблицу
      await client.query(`DELETE FROM ${table}`)

      let inserted = 0
      let skipped = 0
      
      for (const record of records) {
        let filteredRecord = {}
        try {
          for (const col of validColumns) {
            if (col in record) {
              if (col === 'embedding') continue
              
              let value = record[col]
              
              const colType = columnTypes[col]
              if (colType === 'jsonb' || colType === 'json') {
                if (value !== null && value !== undefined && typeof value === 'object') {
                  value = JSON.stringify(value)
                } else if (value === null || value === undefined) {
                  value = null
                }
              }
              
              filteredRecord[col] = value
            }
          }

          const columns = Object.keys(filteredRecord)
          const values = Object.values(filteredRecord)
          
          if (columns.length === 0) {
            skipped++
            continue
          }

          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
          
          await client.query(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          )
          inserted++
        } catch (err) {
          skipped++
          if (skipped === 1) {
            console.log(`  ⚠️  ${err.message}`)
          }
        }
      }
      
      console.log(`  ✅ Вставлено: ${inserted}, пропущено: ${skipped}`)
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message}`)
    }
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  
} catch (err) {
  console.error('❌ Ошибка:', err)
} finally {
  await client.end()
}




