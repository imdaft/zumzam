/**
 * Финальная настройка векторного поиска
 * pgvector уже установлено, создаем функцию и индекс
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupVectorSearch() {
  console.log('🚀 Настройка векторного поиска (pgvector 0.8.0)...\n')

  try {
    // 1. Проверяем расширение pgvector
    console.log('1️⃣ Проверка расширения pgvector...')
    const extension = await prisma.$queryRaw<any[]>`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'pgvector'
    `
    
    if (extension.length > 0) {
      console.log(`   ✅ pgvector установлено (версия ${extension[0].extversion})`)
    } else {
      throw new Error('pgvector не найдено!')
    }

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

    // Создаем новый индекс (HNSW для pgvector 0.8.0 - быстрее чем ivfflat)
    console.log('   📦 Создание HNSW индекса (оптимальный для pgvector 0.8.0)...')
    await prisma.$executeRaw`
      CREATE INDEX idx_profiles_embedding_vector 
      ON profiles 
      USING hnsw (embedding vector_cosine_ops)
    `
    console.log('   ✅ HNSW индекс создан (быстрее и точнее чем IVFFlat)')

    // 4. Добавляем комментарии
    console.log('\n4️⃣ Добавление комментариев...')
    await prisma.$executeRaw`
      COMMENT ON FUNCTION search_profiles_by_vector IS 
      'Векторный поиск профилей по embedding с использованием косинусного расстояния. 
      Используется для AI-ассистента и семантического поиска.
      Параметры:
      - query_embedding: вектор запроса (768 размерность от Gemini text-embedding-004)
      - match_threshold: минимальная схожесть (0.0-1.0, по умолчанию 0.3)
      - match_count: максимальное количество результатов (по умолчанию 8)
      - filter_category: фильтр по категории (опционально)
      - filter_city: фильтр по городу (опционально)'
    `

    await prisma.$executeRaw`
      COMMENT ON INDEX idx_profiles_embedding_vector IS 
      'HNSW индекс для ускорения векторного поиска через косинусное расстояние'
    `
    console.log('   ✅ Комментарии добавлены')

    // 5. Проверка
    console.log('\n5️⃣ Проверка результатов...')
    
    const functionCheck = await prisma.$queryRaw<any[]>`
      SELECT proname AS function_name
      FROM pg_proc 
      WHERE proname = 'search_profiles_by_vector'
    `
    console.log(`   ✅ Функция: ${functionCheck[0]?.function_name}`)

    const indexCheck = await prisma.$queryRaw<any[]>`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE indexname = 'idx_profiles_embedding_vector'
    `
    console.log(`   ✅ Индекс: ${indexCheck[0]?.indexname}`)

    const profileStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*)::int AS total_profiles,
        COUNT(embedding)::int AS profiles_with_embedding,
        COUNT(*) FILTER (WHERE is_published = true AND embedding IS NOT NULL)::int AS searchable_profiles
      FROM profiles
    `
    console.log(`\n   📊 Статистика профилей:`)
    console.log(`      - Всего: ${profileStats[0]?.total_profiles}`)
    console.log(`      - С embeddings: ${profileStats[0]?.profiles_with_embedding}`)
    console.log(`      - Доступны для поиска: ${profileStats[0]?.searchable_profiles}`)

    console.log('\n✅ Векторный поиск успешно настроен!')
    
    if (profileStats[0]?.profiles_with_embedding === 0) {
      console.log('\n⚠️  ВНИМАНИЕ: У профилей нет embeddings!')
      console.log('\n📝 Следующий шаг:')
      console.log('   npx tsx scripts/update-embeddings.ts')
      console.log('\n   Это сгенерирует векторы для всех 48 профилей (~5-10 минут)')
    } else {
      console.log('\n🎉 Всё готово! AI чат может использовать векторный поиск!')
      console.log('\n📝 Для активации векторного поиска в AI чате:')
      console.log('   Откройте app/api/ai/chat/route.ts')
      console.log('   Замените текстовый поиск на векторный (см. комментарии в коде)')
    }

    return true

  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message)
    console.error(error)
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

