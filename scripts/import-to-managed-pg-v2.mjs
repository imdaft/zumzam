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

console.log('📥 Импортирую данные в Managed PostgreSQL V2...\n')

try {
  await client.connect()
  console.log('✅ Подключено к Managed PostgreSQL\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  // Получаем схему для каждой таблицы
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
    
    try {
      // Получаем список колонок из схемы
      const validColumns = await getTableColumns(table)
      if (validColumns.length === 0) {
        console.log(`  ⏭️  Таблица ${table} не найдена`)
        continue
      }

      // Очищаем таблицу
      await client.query(`DELETE FROM ${table}`)

      // Получаем типы колонок
      const columnTypes = await getColumnTypes(table)
      
      // Вставляем данные
      let inserted = 0
      let skipped = 0
      
      for (const record of records) {
        let columns = []
        let filteredRecord = {}
        try {
          // Фильтруем только существующие колонки
          for (const col of validColumns) {
            if (col in record) {
              // Пропускаем embedding - он особенный
              if (col === 'embedding') continue
              
              let value = record[col]
              
              // Сериализуем jsonb поля
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

          // Специальная обработка для master_class_programs
          if (table === 'master_class_programs') {
            if ('photos' in record && validColumns.includes('photo')) {
              filteredRecord.photo = Array.isArray(record.photos) ? record.photos[0] : record.photos
            }
            delete filteredRecord.photos
          }

          columns = Object.keys(filteredRecord)
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
            // Логируем первую ошибку полностью
            console.log(`  ⚠️  ${err.message}`)
            console.log(`  🔍 Всего колонок: ${columns.length}`)
            if (columns.length > 0) {
              console.log(`  🔍 Первые 15: ${columns.slice(0, 15).join(', ')}`)
              // Попробуем найти проблемное значение
              const values = Object.values(filteredRecord)
              for (let i = 0; i < Math.min(5, values.length); i++) {
                const val = values[i]
                console.log(`  🔍 [${i}] ${columns[i]}: ${typeof val} (${val === null ? 'null' : String(val).slice(0, 50)})`)
              }
            }
          }
        }
      }
      
      console.log(`  ✅ Вставлено: ${inserted}, пропущено: ${skipped}`)
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message}`)
    }
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  
  // Проверка
  console.log('\n📊 Проверка данных:')
  const result = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM profiles) as profiles,
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM reviews) as reviews,
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
  password: 'SCNK88tank33',
  database: 'zumzam',
  ssl: { rejectUnauthorized: false }
})

console.log('📥 Импортирую данные в Managed PostgreSQL V2...\n')

try {
  await client.connect()
  console.log('✅ Подключено к Managed PostgreSQL\n')

  const data = JSON.parse(fs.readFileSync('old_supabase_data.json', 'utf8'))

  // Получаем схему для каждой таблицы
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
    
    try {
      // Получаем список колонок из схемы
      const validColumns = await getTableColumns(table)
      if (validColumns.length === 0) {
        console.log(`  ⏭️  Таблица ${table} не найдена`)
        continue
      }

      // Очищаем таблицу
      await client.query(`DELETE FROM ${table}`)

      // Получаем типы колонок
      const columnTypes = await getColumnTypes(table)
      
      // Вставляем данные
      let inserted = 0
      let skipped = 0
      
      for (const record of records) {
        let columns = []
        let filteredRecord = {}
        try {
          // Фильтруем только существующие колонки
          for (const col of validColumns) {
            if (col in record) {
              // Пропускаем embedding - он особенный
              if (col === 'embedding') continue
              
              let value = record[col]
              
              // Сериализуем jsonb поля
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

          // Специальная обработка для master_class_programs
          if (table === 'master_class_programs') {
            if ('photos' in record && validColumns.includes('photo')) {
              filteredRecord.photo = Array.isArray(record.photos) ? record.photos[0] : record.photos
            }
            delete filteredRecord.photos
          }

          columns = Object.keys(filteredRecord)
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
            // Логируем первую ошибку полностью
            console.log(`  ⚠️  ${err.message}`)
            console.log(`  🔍 Всего колонок: ${columns.length}`)
            if (columns.length > 0) {
              console.log(`  🔍 Первые 15: ${columns.slice(0, 15).join(', ')}`)
              // Попробуем найти проблемное значение
              const values = Object.values(filteredRecord)
              for (let i = 0; i < Math.min(5, values.length); i++) {
                const val = values[i]
                console.log(`  🔍 [${i}] ${columns[i]}: ${typeof val} (${val === null ? 'null' : String(val).slice(0, 50)})`)
              }
            }
          }
        }
      }
      
      console.log(`  ✅ Вставлено: ${inserted}, пропущено: ${skipped}`)
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message}`)
    }
  }

  console.log('\n✅ ИМПОРТ ЗАВЕРШЁН!')
  
  // Проверка
  console.log('\n📊 Проверка данных:')
  const result = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM profiles) as profiles,
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM reviews) as reviews,
      (SELECT COUNT(*) FROM master_class_programs) as master_class_programs
  `)
  console.log(result.rows[0])

} catch (err) {
  console.error('❌ Ошибка:', err.message)
  console.error(err.stack)
} finally {
  await client.end()
}

