/**
 * Генерация embeddings для всех профилей
 * Использует Gemini text-embedding-004 (768 размерность)
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { generateEmbedding } from '../lib/ai/embeddings'
import * as fs from 'fs'
import * as path from 'path'

// Читаем .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const prisma = new PrismaClient()

async function generateProfileEmbeddings() {
  console.log('🚀 Генерация embeddings для профилей...\n')

  try {
    // 1. Получаем все опубликованные профили
    const profiles = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        slug,
        display_name,
        bio,
        description,
        category,
        city,
        tags,
        CASE WHEN embedding IS NOT NULL THEN true ELSE false END as has_embedding
      FROM profiles
      WHERE is_published = true
    `

    console.log(`📊 Найдено профилей: ${profiles.length}`)
    console.log(`   - С embeddings: ${profiles.filter(p => p.has_embedding).length}`)
    console.log(`   - Без embeddings: ${profiles.filter(p => !p.has_embedding).length}\n`)

    // 2. Генерируем embeddings
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i]
      const progress = `[${i + 1}/${profiles.length}]`

      try {
        // Пропускаем если уже есть embedding
        if (profile.has_embedding) {
          console.log(`${progress} ⏭️  ${profile.display_name} - пропущен (уже есть embedding)`)
          skippedCount++
          continue
        }

        // Формируем текст для embedding
        const textParts: string[] = []
        
        textParts.push(`Название: ${profile.display_name}`)
        
        if (profile.category) {
          textParts.push(`Категория: ${profile.category}`)
        }
        
        textParts.push(`Город: ${profile.city}`)
        
        if (profile.bio) {
          textParts.push(`Краткое описание: ${profile.bio}`)
        }
        
        if (profile.description) {
          textParts.push(`Описание: ${profile.description}`)
        }
        
        if (profile.tags && profile.tags.length > 0) {
          textParts.push(`Теги: ${profile.tags.join(', ')}`)
        }

        const textForEmbedding = textParts.join('\n')

        // Генерируем embedding
        console.log(`${progress} 🔄 ${profile.display_name}...`)
        const embedding = await generateEmbedding(textForEmbedding)

        if (!embedding) {
          throw new Error('Failed to generate embedding')
        }

        // Сохраняем в базу
        await prisma.$executeRawUnsafe(
          `UPDATE profiles SET embedding = $1::vector(768) WHERE id = $2::uuid`,
          `[${embedding.join(',')}]`,
          profile.id
        )

        console.log(`${progress} ✅ ${profile.display_name} - готово`)
        successCount++

        // Задержка чтобы не превысить rate limit API
        if (i < profiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

      } catch (error: any) {
        console.error(`${progress} ❌ ${profile.display_name} - ошибка:`, error.message)
        errorCount++
        
        // Продолжаем со следующим профилем
        continue
      }
    }

    // 3. Итоговая статистика
    console.log('\n📊 Итоговая статистика:')
    console.log(`   ✅ Успешно: ${successCount}`)
    console.log(`   ⏭️  Пропущено: ${skippedCount}`)
    console.log(`   ❌ Ошибок: ${errorCount}`)
    console.log(`   📝 Всего: ${profiles.length}`)

    // 4. Проверяем результат
    console.log('\n🔍 Проверка результата...')
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(embedding)::int AS with_embedding,
        COUNT(*) FILTER (WHERE is_published = true AND embedding IS NOT NULL)::int AS searchable
      FROM profiles
    `

    console.log(`   - Всего профилей: ${stats[0]?.total}`)
    console.log(`   - С embeddings: ${stats[0]?.with_embedding}`)
    console.log(`   - Доступны для поиска: ${stats[0]?.searchable}`)

    if (stats[0]?.searchable > 0) {
      console.log('\n✅ Векторный поиск готов к использованию!')
      console.log('\n📝 Следующий шаг: Активировать векторный поиск в AI чате')
      console.log('   Откройте: app/api/ai/chat/route.ts')
      console.log('   Замените текстовый поиск на векторный (см. комментарии)')
    } else {
      console.log('\n⚠️  Embeddings не созданы. Проверьте ошибки выше.')
    }

  } catch (error: any) {
    console.error('\n❌ Критическая ошибка:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск
console.log('🔑 Проверка API ключа Gemini...')
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY не найден в переменных окружения!')
  console.error('   Проверьте файл .env.local')
  process.exit(1)
}
console.log('✅ API ключ найден\n')

generateProfileEmbeddings()
  .then(() => {
    console.log('\n🎉 Готово!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error)
    process.exit(1)
  })

