import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://dijcyhkmzohyvngaioiu.supabase.co',
  'sb_secret_icLrAjyNII1Kp8jUY_jLqQ_oNUNrdWD'
)

console.log('\n📊 АУДИТ СТАРОГО SUPABASE (США)\n')

const tables = [
  'profiles', 'users', 'profile_activities', 'profile_services', 'profile_locations',
  'master_class_programs', 'show_programs', 'quest_programs', 'animator_characters',
  'agency_partners', 'agency_cases', 'reviews', 'user_activity',
  'advertisements', 'ad_slots', 'ad_bookings', 'ad_campaigns', 'ad_impressions',
  'order_requests', 'category_images'
]

const results = {}

for (const table of tables) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      results[table] = 'ОШИБКА: ' + error.message
    } else {
      results[table] = count || 0
    }
  } catch (e) {
    results[table] = 'НЕТ ТАБЛИЦЫ'
  }
}

console.log('📋 РЕЗУЛЬТАТЫ:\n')
for (const [table, count] of Object.entries(results)) {
  const status = typeof count === 'number' 
    ? count > 0 ? '✅' : '⚠️ '
    : '❌'
  console.log(`${status} ${table}: ${count}`)
}

console.log('\n✅ АУДИТ ЗАВЕРШЁН\n')


const supabase = createClient(
  'https://dijcyhkmzohyvngaioiu.supabase.co',
  'sb_secret_icLrAjyNII1Kp8jUY_jLqQ_oNUNrdWD'
)

console.log('\n📊 АУДИТ СТАРОГО SUPABASE (США)\n')

const tables = [
  'profiles', 'users', 'profile_activities', 'profile_services', 'profile_locations',
  'master_class_programs', 'show_programs', 'quest_programs', 'animator_characters',
  'agency_partners', 'agency_cases', 'reviews', 'user_activity',
  'advertisements', 'ad_slots', 'ad_bookings', 'ad_campaigns', 'ad_impressions',
  'order_requests', 'category_images'
]

const results = {}

for (const table of tables) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      results[table] = 'ОШИБКА: ' + error.message
    } else {
      results[table] = count || 0
    }
  } catch (e) {
    results[table] = 'НЕТ ТАБЛИЦЫ'
  }
}

console.log('📋 РЕЗУЛЬТАТЫ:\n')
for (const [table, count] of Object.entries(results)) {
  const status = typeof count === 'number' 
    ? count > 0 ? '✅' : '⚠️ '
    : '❌'
  console.log(`${status} ${table}: ${count}`)
}

console.log('\n✅ АУДИТ ЗАВЕРШЁН\n')




