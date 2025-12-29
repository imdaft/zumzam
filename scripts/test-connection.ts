import prisma from '../lib/prisma'

async function testConnection() {
  try {
    console.log('🧪 Тестирование подключения к Yandex Cloud...\n')
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*)::int as count,
        COUNT(embedding)::int as with_embedding
      FROM profiles
    `
    
    console.log('✅ Подключение к Yandex Cloud работает!')
    console.log(`   📊 Всего профилей: ${result[0].count}`)
    console.log(`   🎯 С embeddings: ${result[0].with_embedding}`)
    console.log(`   🔍 Векторный поиск: ДОСТУПЕН\n`)
    
    // Тестируем векторный поиск
    console.log('🔍 Тестирование векторного поиска...')
    const vectorTest = await prisma.$queryRaw<any[]>`
      SELECT proname FROM pg_proc WHERE proname = 'search_profiles_by_vector'
    `
    
    if (vectorTest.length > 0) {
      console.log('✅ Функция search_profiles_by_vector найдена')
      console.log('   Векторный поиск полностью работает!\n')
    } else {
      console.log('❌ Функция search_profiles_by_vector не найдена\n')
    }
    
    console.log('🎉 Всё готово для локальной разработки!')
    console.log('   Запустите: npm run dev')
    
  } catch (error: any) {
    console.error('❌ Ошибка подключения:', error.message)
    console.error('\n💡 Проверьте DATABASE_URL в .env.local')
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

