import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  'https://dijcyhkmzohyvngaioiu.supabase.co',
  'sb_secret_icLrAjyNII1Kp8jUY_jLqQ_oNUNrdWD' // service_role key для экспорта
)

console.log('📥 Экспортирую данные из старого Supabase (США)...\n')

const tables = [
  'profiles',
  'users',
  'services', // Основные услуги
  'package_tiers', // ← ПАКЕТНЫЕ ПРЕДЛОЖЕНИЯ!
  'turnkey_packages', // ← ПРАЗДНИКИ ПОД КЛЮЧ!
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
  'user_activity',
  'advertisements',
  'ad_slots',
  'category_images',
  'ad_campaigns',
  'ad_bookings',
  'order_requests'
]

const exportData = {}

for (const table of tables) {
  try {
    console.log(`📊 ${table}...`)
    const { data, error } = await supabase.from(table).select('*')
    
    if (error) {
      console.log(`  ⚠️  Ошибка: ${error.message}`)
      exportData[table] = []
    } else {
      console.log(`  ✅ ${data.length} записей`)
      exportData[table] = data
    }
  } catch (err) {
    console.log(`  ❌ ${err.message}`)
    exportData[table] = []
  }
}

// Сохраняем JSON
const jsonFile = 'old_supabase_data.json'
fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2))
console.log(`\n✅ Данные экспортированы в ${jsonFile}`)

// Статистика
console.log('\n📊 Статистика:')
for (const [table, data] of Object.entries(exportData)) {
  if (data.length > 0) {
    console.log(`  ${table}: ${data.length} записей`)
  }
}
