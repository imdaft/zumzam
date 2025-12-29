/**
 * Автоматический фоновый парсинг отзывов с Яндекс.Карт
 * Запускается периодически и обновляет данные в БД
 */

import { createClient } from '@supabase/supabase-js'
import { parseYandexReviewsWithPuppeteer } from './lib/puppeteer-parser'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Location {
  id: string
  yandex_url: string
  profile_id: string
}

/**
 * Парсит отзывы для всех локаций, у которых есть yandex_url
 */
async function parseAllLocations() {
  console.log('🚀 [AutoParser] Starting automatic review parsing...')
  console.log('📅 Time:', new Date().toISOString())
  console.log('')

  try {
    // Получаем все локации с yandex_url
    const { data: locations, error } = await supabase
      .from('profile_locations')
      .select('id, yandex_url, profile_id')
      .not('yandex_url', 'is', null)
      .eq('active', true)

    if (error) {
      console.error('❌ Error fetching locations:', error)
      return
    }

    if (!locations || locations.length === 0) {
      console.log('ℹ️ No locations with yandex_url found')
      return
    }

    console.log(`📍 Found ${locations.length} locations to parse`)
    console.log('')

    // Парсим каждую локацию по очереди
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i]
      console.log(`[${i + 1}/${locations.length}] Processing location ${location.id}`)
      console.log(`URL: ${location.yandex_url}`)

      try {
        // Парсим отзывы
        const result = await parseYandexReviewsWithPuppeteer(location.yandex_url)
        
        console.log(`✅ Parsed ${result.reviews.length} reviews`)
        console.log(`⭐ Rating: ${result.rating}`)

        // Извлекаем OID из URL
        const oid = extractOidFromUrl(location.yandex_url)

        // Вычисляем средний рейтинг
        const rating = result.rating || (result.reviews.length > 0
          ? result.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / result.reviews.length
          : null)

        // Сохраняем в кеш
        const { error: upsertError } = await supabase
          .from('yandex_reviews_cache')
          .upsert({
            profile_location_id: location.id,
            yandex_oid: oid,
            reviews: result.reviews,
            rating: rating ? parseFloat(rating.toFixed(1)) : null,
            review_count: result.reviewCount || result.reviews.length,
            last_parsed_at: new Date().toISOString(),
          }, {
            onConflict: 'profile_location_id'
          })

        if (upsertError) {
          console.error('❌ Error saving to cache:', upsertError)
        } else {
          console.log('💾 Saved to database')
        }

        console.log('')

        // Задержка между запросами (чтобы не нагружать Яндекс)
        if (i < locations.length - 1) {
          console.log('⏱️ Waiting 10 seconds before next location...')
          await new Promise(resolve => setTimeout(resolve, 10000))
          console.log('')
        }

      } catch (parseError: any) {
        console.error(`❌ Error parsing location ${location.id}:`, parseError.message)
        console.log('')
        // Продолжаем со следующей локацией
      }
    }

    console.log('✅ [AutoParser] Parsing completed!')
    console.log('')

  } catch (error: any) {
    console.error('❌ [AutoParser] Fatal error:', error.message)
  }
}

function extractOidFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const oidParam = urlObj.searchParams.get('oid')
    if (oidParam) return oidParam
    
    const orgMatch = url.match(/\/org\/[^\/]*\/(\d{9,})/)
    if (orgMatch) return orgMatch[1]
    
    const numMatch = url.match(/\/(\d{9,})/)
    if (numMatch) return numMatch[1]
    
    return null
  } catch {
    return null
  }
}

// Запускаем парсер
parseAllLocations()
  .then(() => {
    console.log('🏁 Process finished')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })


