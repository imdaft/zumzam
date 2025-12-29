/**
 * Исправление типа колонки embedding
 * Изменяем тип с просто vector на vector(768)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixEmbeddingColumn() {
  console.log('🔧 Исправление типа колонки embedding...\n')

  try {
    // 1. Проверяем текущий тип
    console.log('1️⃣ Проверка текущего типа колонки...')
    const columnInfo = await prisma.$queryRaw<any[]>`
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'embedding'
    `
    
    console.log('   Текущий тип:', columnInfo[0])

    // 2. Изменяем тип колонки на vector(768)
    console.log('\n2️⃣ Изменение типа колонки на vector(768)...')
    await prisma.$executeRaw`
      ALTER TABLE profiles 
      ALTER COLUMN embedding TYPE vector(768) USING embedding::vector(768)
    `
    console.log('   ✅ Тип изменен на vector(768)')

    // 3. Проверяем новый тип
    console.log('\n3️⃣ Проверка нового типа...')
    const newColumnInfo = await prisma.$queryRaw<any[]>`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'embedding'
    `
    
    console.log('   Новый тип:', newColumnInfo[0])

    // 4. Проверяем количество профилей
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(embedding)::int AS with_embedding
      FROM profiles
    `
    console.log(`\n   📊 Профили:`)
    console.log(`      - Всего: ${stats[0]?.total}`)
    console.log(`      - С embedding: ${stats[0]?.with_embedding}`)

    console.log('\n✅ Колонка исправлена! Теперь можно создавать индекс.')
    console.log('\n📝 Следующий шаг:')
    console.log('   npx tsx scripts/setup-vector-search-final.ts')

    return true

  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск
fixEmbeddingColumn()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error)
    process.exit(1)
  })

