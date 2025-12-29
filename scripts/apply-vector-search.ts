/**
 * Скрипт для применения векторного поиска к базе данных
 * Применяет функцию search_profiles_by_vector и создает индекс
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function applyVectorSearch() {
  console.log('🚀 Применение векторного поиска...\n')

  try {
    // 1. Проверяем расширение vector
    console.log('1️⃣ Проверка расширения pgvector...')
    const extensionCheck = await prisma.$queryRaw<any[]>`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `
    
    if (extensionCheck.length === 0) {
      console.log('   ⚠️  Расширение vector не установлено')
      console.log('   Попытка установки...')
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
        console.log('   ✅ Расширение vector установлено')
      } catch (err) {
        console.error('   ❌ Не удалось установить расширение vector')
        console.error('   Возможно, требуются права суперпользователя')
        console.error('   Обратитесь к администратору базы данных')
        throw err
      }
    } else {
      console.log('   ✅ Расширение vector уже установлено')
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
    try {
      await prisma.$executeRaw`DROP INDEX IF EXISTS idx_profiles_embedding_vector`
      console.log('   ℹ️  Старый индекс удален (если существовал)')
    } catch (err) {
      // Индекс может не существовать - это нормально
    }

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
        COUNT(*) AS total_profiles,
        COUNT(embedding) AS profiles_with_embedding,
        COUNT(*) FILTER (WHERE is_published = true AND embedding IS NOT NULL) AS searchable_profiles
      FROM profiles
    `
    console.log(`   📊 Статистика профилей:`)
    console.log(`      - Всего профилей: ${profileStats[0]?.total_profiles}`)
    console.log(`      - С embedding: ${profileStats[0]?.profiles_with_embedding}`)
    console.log(`      - Доступны для поиска: ${profileStats[0]?.searchable_profiles}`)

    console.log('\n✅ Векторный поиск успешно настроен!')
    console.log('\n💡 Теперь AI-чат может использовать векторный поиск для поиска профилей')

  } catch (error) {
    console.error('\n❌ Ошибка при применении векторного поиска:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск
applyVectorSearch()
  .then(() => {
    console.log('\n🎉 Готово!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error)
    process.exit(1)
  })

