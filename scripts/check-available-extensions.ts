/**
 * Проверка доступных расширений PostgreSQL
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkExtensions() {
  console.log('🔍 Проверка расширений PostgreSQL...\n')

  try {
    // 1. Проверяем установленные расширения
    console.log('1️⃣ Установленные расширения:')
    const installedExtensions = await prisma.$queryRaw<any[]>`
      SELECT 
        extname as name,
        extversion as version,
        extrelocatable as relocatable
      FROM pg_extension
      ORDER BY extname
    `
    
    if (installedExtensions.length > 0) {
      installedExtensions.forEach(ext => {
        console.log(`   ✅ ${ext.name} (версия ${ext.version})`)
      })
    } else {
      console.log('   ⚠️  Нет установленных расширений')
    }

    // 2. Проверяем доступные расширения
    console.log('\n2️⃣ Доступные для установки расширения:')
    const availableExtensions = await prisma.$queryRaw<any[]>`
      SELECT 
        name,
        default_version,
        installed_version,
        comment
      FROM pg_available_extensions
      WHERE name LIKE '%vector%' OR name LIKE '%trgm%' OR name LIKE '%gis%'
      ORDER BY name
    `
    
    if (availableExtensions.length > 0) {
      availableExtensions.forEach(ext => {
        const status = ext.installed_version ? '✅ установлено' : '⚠️  доступно'
        console.log(`   ${status} ${ext.name} (версия ${ext.default_version || ext.installed_version})`)
        if (ext.comment) {
          console.log(`      ${ext.comment}`)
        }
      })
    } else {
      console.log('   ⚠️  Расширения vector/trgm/gis не найдены в pg_available_extensions')
    }

    // 3. Проверяем все доступные расширения (для полноты)
    console.log('\n3️⃣ Все доступные расширения (полный список):')
    const allExtensions = await prisma.$queryRaw<any[]>`
      SELECT 
        name,
        default_version,
        installed_version
      FROM pg_available_extensions
      ORDER BY name
    `
    
    console.log(`   Всего доступно: ${allExtensions.length} расширений`)
    allExtensions.forEach(ext => {
      const status = ext.installed_version ? '✅' : '⚪'
      console.log(`   ${status} ${ext.name}`)
    })

    // 4. Проверяем версию PostgreSQL
    console.log('\n4️⃣ Информация о PostgreSQL:')
    const versionInfo = await prisma.$queryRaw<any[]>`
      SELECT version()
    `
    console.log(`   ${versionInfo[0].version}`)

  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkExtensions()

