#!/usr/bin/env node
/**
 * Проверка рекламных данных в БД
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🔍 Проверка рекламных данных...\n')

  try {
    // 1. Объявления (advertisements)
    const adsCount = await prisma.advertisements.count()
    console.log(`📢 Объявления (advertisements): ${adsCount}`)
    
    if (adsCount > 0) {
      const ads = await prisma.advertisements.findMany({ take: 3 })
      ads.forEach(ad => {
        console.log(`   - ${ad.title || 'Без названия'} (ID: ${ad.id})`)
        if (ad.image_url) console.log(`     Изображение: ${ad.image_url}`)
      })
    }

    // 2. Рекламные кампании (ad_campaigns)
    const campaignsCount = await prisma.ad_campaigns.count()
    console.log(`\n📊 Рекламные кампании (ad_campaigns): ${campaignsCount}`)
    
    if (campaignsCount > 0) {
      const campaigns = await prisma.ad_campaigns.findMany({ take: 3 })
      campaigns.forEach(c => {
        console.log(`   - ${c.name || 'Без названия'} (ID: ${c.id})`)
      })
    }

    // 3. Картинки категорий (category_images)
    const categoryImagesCount = await prisma.category_images.count()
    console.log(`\n🖼️  Картинки категорий (category_images): ${categoryImagesCount}`)
    
    if (categoryImagesCount > 0) {
      const images = await prisma.category_images.findMany()
      images.forEach(img => {
        console.log(`   - ${img.category}: ${img.image_url}`)
      })
    }

    // 4. Рекламные слоты (advertising_slots)
    const slotsCount = await prisma.advertising_slots.count()
    console.log(`\n🎯 Рекламные слоты (advertising_slots): ${slotsCount}`)

    // 5. Букинги рекламы (advertising_bookings)
    const bookingsCount = await prisma.advertising_bookings.count()
    console.log(`\n📅 Букинги рекламы (advertising_bookings): ${bookingsCount}`)

    console.log('\n✅ Проверка завершена!\n')

  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

