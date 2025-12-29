/**
 * Скрипт для обновления embeddings у существующих профилей и услуг
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/ai/embeddings'
import { Database } from '../types/supabase'
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Ошибка: NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть определены в .env.local')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateProfileEmbeddings() {
  console.log('\n🔄 Обновление embeddings для профилей...\n')
  
  // Получаем все профили без embeddings или с устаревшими
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, description, bio, city, category')
    .or('embedding.is.null,updated_at.gt.2025-11-27')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Ошибка загрузки профилей:', error)
    return
  }
  
  console.log(`📦 Найдено профилей для обновления: ${profiles?.length || 0}`)
  
  for (const profile of profiles || []) {
    try {
      // Формируем текст для embedding
      const text = `
        ${profile.display_name}
        ${profile.bio || ''}
        ${profile.description || ''}
        Категория: ${profile.category}
        Город: ${profile.city}
      `.trim()
      
      console.log(`   🔄 Генерация embedding для "${profile.display_name}"...`)
      const embedding = await generateEmbedding(text)
      
      if (embedding) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ embedding })
          .eq('id', profile.id)
        
        if (updateError) {
          console.error(`   ❌ Ошибка обновления "${profile.display_name}":`, updateError.message)
        } else {
          console.log(`   ✅ Обновлён: "${profile.display_name}"`)
        }
      } else {
        console.error(`   ❌ Не удалось сгенерировать embedding для "${profile.display_name}"`)
      }
      
      // Пауза между запросами к API
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error: any) {
      console.error(`   ❌ Ошибка обработки "${profile.display_name}":`, error?.message || error)
    }
  }
}

async function updateServiceEmbeddings() {
  console.log('\n🔄 Обновление embeddings для услуг...\n')
  
  // Получаем услуги без embeddings
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      id,
      title,
      description,
      profile_id,
      profiles (display_name, category, city)
    `)
    .is('embedding', null)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Ошибка загрузки услуг:', error)
    return
  }
  
  console.log(`📦 Найдено услуг для обновления: ${services?.length || 0}`)
  
  for (const service of services || []) {
    try {
      const profile = (service as any).profiles
      
      // Формируем текст для embedding
      const text = `
        ${service.title}
        ${service.description}
        Профиль: ${profile?.display_name || ''}
        Категория: ${profile?.category || ''}
        Город: ${profile?.city || ''}
      `.trim()
      
      console.log(`   🔄 Генерация embedding для "${service.title}"...`)
      const embedding = await generateEmbedding(text)
      
      if (embedding) {
        const { error: updateError } = await supabase
          .from('services')
          .update({ embedding })
          .eq('id', service.id)
        
        if (updateError) {
          console.error(`   ❌ Ошибка обновления "${service.title}":`, updateError.message)
        } else {
          console.log(`   ✅ Обновлён: "${service.title}"`)
        }
      } else {
        console.error(`   ❌ Не удалось сгенерировать embedding для "${service.title}"`)
      }
      
      // Пауза между запросами к API
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error: any) {
      console.error(`   ❌ Ошибка обработки "${service.title}":`, error?.message || error)
    }
  }
}

async function main() {
  console.log('🚀 Начинаем обновление embeddings...')
  
  try {
    await updateProfileEmbeddings()
    await updateServiceEmbeddings()
    
    console.log('\n✅ Обновление embeddings завершено!')
    
  } catch (error: any) {
    console.error('\n❌ Критическая ошибка:', error?.message || error)
    process.exit(1)
  }
}

main()

