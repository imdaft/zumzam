/**
 * Скрипт для установки расширения pgvector
 * Требует прав администратора базы данных
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function installPgVector() {
  console.log('🔧 Попытка установки pgvector...\n')

  try {
    // 1. Проверяем текущий статус
    console.log('1️⃣ Проверка текущего статуса...')
    const extensionCheck = await prisma.$queryRaw<any[]>`
      SELECT * FROM pg_available_extensions WHERE name = 'vector'
    `
    
    if (extensionCheck.length > 0) {
      console.log('   ✅ Расширение vector доступно:', extensionCheck[0])
      
      const installed = await prisma.$queryRaw<any[]>`
        SELECT * FROM pg_extension WHERE extname = 'vector'
      `
      
      if (installed.length > 0) {
        console.log('   ✅ Расширение vector уже установлено!')
        console.log('   Версия:', installed[0].extversion)
        return true
      }
    } else {
      console.log('   ⚠️  Расширение vector не найдено в pg_available_extensions')
    }

    // 2. Попытка установки
    console.log('\n2️⃣ Установка расширения...')
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
      console.log('   ✅ Расширение vector успешно установлено!')
      
      // Проверяем версию
      const version = await prisma.$queryRaw<any[]>`
        SELECT extversion FROM pg_extension WHERE extname = 'vector'
      `
      console.log('   Версия:', version[0]?.extversion)
      
      return true
    } catch (installError: any) {
      console.error('   ❌ Ошибка установки:', installError.message)
      
      if (installError.message.includes('not available')) {
        console.log('\n💡 Расширение pgvector не установлено на сервере!')
        console.log('   Требуется установка на уровне сервера PostgreSQL.')
        console.log('\n📋 Инструкция для администратора Yandex Cloud:')
        console.log('   1. Откройте консоль Yandex Cloud')
        console.log('   2. Перейдите в Managed Service for PostgreSQL')
        console.log('   3. Выберите ваш кластер')
        console.log('   4. Перейдите в раздел "Расширения"')
        console.log('   5. Включите расширение "vector"')
        console.log('   6. Примените изменения')
        console.log('\n🔗 Документация:')
        console.log('   https://cloud.yandex.ru/docs/managed-postgresql/operations/extensions/cluster-extensions')
        
        return false
      } else if (installError.message.includes('permission denied')) {
        console.log('\n⚠️  Недостаточно прав для установки расширения!')
        console.log('   Требуются права суперпользователя PostgreSQL.')
        console.log('\n💡 Обратитесь к администратору базы данных.')
        
        return false
      }
      
      throw installError
    }

  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск
installPgVector()
  .then((success) => {
    if (success) {
      console.log('\n🎉 pgvector готов к использованию!')
      console.log('\n📝 Следующие шаги:')
      console.log('   1. Применить миграцию: npx tsx scripts/apply-vector-search.ts')
      console.log('   2. Сгенерировать embeddings: npx tsx scripts/update-embeddings.ts')
      process.exit(0)
    } else {
      console.log('\n⚠️  pgvector не установлен')
      console.log('   AI чат продолжит работать с текстовым поиском')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error)
    process.exit(1)
  })

