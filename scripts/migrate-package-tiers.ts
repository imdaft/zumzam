/**
 * Скрипт миграции существующих пакетов из старого формата в новый
 * 
 * Старый формат: 1 запись с details.tier_packages = [{name, price, ...}, ...]
 * Новый формат: 3 записи с package_group_id + tier_name
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Migration] Error: Missing SUPABASE environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migratePackages() {
  console.log('[Migration] Starting package tiers migration...')

  // 1. Находим все старые пакеты (с tier_packages в details)
  const { data: oldPackages, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_package', true)
    .is('package_group_id', null) // Только старые пакеты

  if (error) {
    console.error('[Migration] Error fetching packages:', error)
    return
  }

  console.log(`[Migration] Found ${oldPackages?.length || 0} packages to migrate`)

  for (const pkg of oldPackages || []) {
    const tierPackages = pkg.details?.tier_packages
    
    if (!tierPackages || !Array.isArray(tierPackages) || tierPackages.length === 0) {
      console.log(`[Migration] Skipping ${pkg.title} - no tier_packages found`)
      continue
    }

    console.log(`[Migration] Migrating "${pkg.title}" (${tierPackages.length} tiers)`)

    // Генерируем package_group_id для этой группы
    const packageGroupId = crypto.randomUUID()

    // Создаем отдельную запись для каждого тарифа
    for (let i = 0; i < tierPackages.length; i++) {
      const tier = tierPackages[i]
      
      const newService = {
        profile_id: pkg.profile_id,
        title: `${pkg.title} - ${tier.name}`,
        description: tier.description || pkg.description,
        price: tier.price || 0,
        price_from: null,
        duration: tier.duration || pkg.duration,
        age_from: tier.participants_min || pkg.age_from,
        age_to: tier.participants_max || pkg.age_to,
        images: pkg.images || [],
        details: {
          includes: tier.includes || [],
          description: tier.description,
          participants_min: tier.participants_min,
          participants_max: tier.participants_max,
          original_package_title: pkg.title
        },
        is_active: pkg.is_active,
        is_package: true,
        package_group_id: packageGroupId,
        tier_name: tier.name,
        tier_order: i,
        display_order: pkg.display_order + i
      }

      const { error: insertError } = await supabase
        .from('services')
        .insert(newService)

      if (insertError) {
        console.error(`[Migration] Error creating tier ${tier.name}:`, insertError)
      } else {
        console.log(`[Migration] ✅ Created: ${newService.title}`)
      }
    }

    // Помечаем старый пакет как мигрированный (или удаляем)
    const { error: updateError } = await supabase
      .from('services')
      .update({ 
        is_active: false,
        title: `[MIGRATED] ${pkg.title}`
      })
      .eq('id', pkg.id)

    if (updateError) {
      console.error(`[Migration] Error updating old package:`, updateError)
    } else {
      console.log(`[Migration] ✅ Marked old package as migrated`)
    }

    console.log(`[Migration] ---`)
  }

  console.log('[Migration] ✅ Migration complete!')
}

// Запуск
migratePackages()
  .then(() => {
    console.log('[Migration] Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[Migration] Fatal error:', error)
    process.exit(1)
  })

