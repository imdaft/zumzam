/**
 * Простой скрипт для установки роли admin
 * Использование: node scripts/set-admin-role.js
 */

const { createClient } = require('@supabase/supabase-js')

async function main() {
  console.log('\n🔧 Установка роли администратора...\n')

  // Загружаем переменные окружения
  require('dotenv').config({ path: '.env.local' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Ошибка: Не найдены переменные окружения')
    console.error('Убедитесь, что в .env.local есть:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY\n')
    console.log('📋 Альтернативный способ:')
    console.log('1. Откройте Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Перейдите в SQL Editor')
    console.log('3. Выполните:')
    console.log(`
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'vanekseleznev@yandex.ru'
);
    `)
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Находим пользователя по email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) throw listError

    const adminUser = users.find(u => u.email === 'vanekseleznev@yandex.ru')
    
    if (!adminUser) {
      console.error('❌ Пользователь vanekseleznev@yandex.ru не найден')
      process.exit(1)
    }

    console.log('✓ Пользователь найден:', adminUser.email)
    console.log('  ID:', adminUser.id)

    // Обновляем роль
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminUser.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('\n✅ Роль admin успешно установлена!')
    console.log('   Профиль:', data.full_name || 'Без имени')
    console.log('   Роль:', data.role)
    console.log('\n📱 Следующие шаги:')
    console.log('1. Перезагрузите страницу: http://localhost:4000')
    console.log('2. Попробуйте загрузить изображение через ⚙️\n')

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message)
    console.log('\n📋 Выполните SQL вручную:')
    console.log('1. Откройте Supabase Dashboard')
    console.log('2. SQL Editor → New Query')
    console.log('3. Выполните:\n')
    console.log(`UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'vanekseleznev@yandex.ru');`)
    console.log()
  }
}

main()










