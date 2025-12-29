/**
 * Полная настройка векторного поиска
 * 1. Создает расширение vector
 * 2. Создает функцию поиска
 * 3. Создает индекс
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupVectorSearch() {
  console.log('🚀 Настройка векторного поиска...\n')

  try {
    // 1. Создаем расширение vector
    console.log('1️⃣ Создание расширения vector...')
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
      console.log('   ✅ Расширение vector создано')
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        console.log('   ✅ Расширение vector уже существует')
      } else {
        throw err
      }
    }

    // Проверяем версию
    const version = await prisma.$queryRaw<any[]>`
      SELECT extversion FROM pg_extension WHERE extname = 'vector'
    `
    console.log('   📦 Версия pgvector:', version[0]?.extversion || 'unknown')

    // 2. Создаем функцию векторного поиска
    console.log('\n2️⃣ Создание функции search_profiles_by_vector...')
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION search_profiles_by_vector(
        query_embedding vector(768),
        match_threshold float DEFAULT 0.3,
        match_count int DEFAULT 8,
        filter_category text DEFAULT NULL,
        filter_city text DEFAULT NULL
      )
      RETURNS TABLE (
        id uuid,
        slug text,
        display_name text,
        bio text,
        description text,
        category text,
        city text,
        rating numeric,
        reviews_count int,
        price_range text,
        cover_photo text,
        photos text[],
        videos text[],
        details jsonb,
        similarity float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          p.id,
          p.slug,
          p.display_name,
          p.bio,
          p.description,
          p.category::text,
          p.city,
          p.rating,
          p.reviews_count,
          p.price_range,
          p.cover_photo,
          p.photos,
          p.videos,
          p.details,
          (1 - (p.embedding <=> query_embedding))::float AS similarity
        FROM profiles p
        WHERE 
          p.is_published = true
          AND p.embedding IS NOT NULL
          AND (1 - (p.embedding <=> query_embedding)) >= match_threshold
          AND (filter_category IS NULL OR p.category::text = filter_category)
          AND (filter_city IS NULL OR p.city = filter_city)
        ORDER BY p.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$
    `
    console.log('   ✅ Функция создана')

    // 3. Создаем индекс для векторного поиска
    console.log('\n3️⃣ Создание индекса для векторного поиска...')
    
    // Удаляем старый индекс если есть
    try {
      await prisma.$executeRaw`DROP INDEX IF EXISTS idx_profiles_embedding_vector`
      console.log('   ℹ️  Старый индекс удален (если существовал)')
    } catch (err) {
      // Игнорируем ошибку
    }

    // Создаем новый индекс
    await prisma.$executeRaw`
      CREATE INDEX idx_profiles_embedding_vector 
      ON profiles 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `
    console.log('   ✅ Индекс создан')

    // 4. Проверка
    console.log('\n4️⃣ Проверка результатов...')
    
    const functionCheck = await prisma.$queryRaw<any[]>`
      SELECT proname AS function_name
      FROM pg_proc 
      WHERE proname = 'search_profiles_by_vector'
    `
    console.log(`   ✅ Функция найдена: ${functionCheck[0]?.function_name}`)

    const indexCheck = await prisma.$queryRaw<any[]>`
      SELECT indexname
      FROM pg_indexes 
      WHERE indexname = 'idx_profiles_embedding_vector'
    `
    console.log(`   ✅ Индекс найден: ${indexCheck[0]?.indexname}`)

    const profileStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*)::int AS total_profiles,
        COUNT(embedding)::int AS profiles_with_embedding,
        COUNT(*) FILTER (WHERE is_published = true AND embedding IS NOT NULL)::int AS searchable_profiles
      FROM profiles
    `
    console.log(`   📊 Статистика профилей:`)
    console.log(`      - Всего профилей: ${profileStats[0]?.total_profiles}`)
    console.log(`      - С embedding: ${profileStats[0]?.profiles_with_embedding}`)
    console.log(`      - Доступны для поиска: ${profileStats[0]?.searchable_profiles}`)

    console.log('\n✅ Векторный поиск успешно настроен!')
    
    if (profileStats[0]?.profiles_with_embedding === 0) {
      console.log('\n⚠️  У профилей нет embeddings!')
      console.log('📝 Следующий шаг: Сгенерировать embeddings')
      console.log('   Команда: npx tsx scripts/update-embeddings.ts')
    } else {
      console.log('\n🎉 Всё готово! AI чат может использовать векторный поиск')
    }

    return true

  } catch (error: any) {
    console.error('\n❌ Ошибка при настройке:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск
setupVectorSearch()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error)
    process.exit(1)
  })

