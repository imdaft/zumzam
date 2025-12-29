#!/usr/bin/env node
/**
 * Скрипт для замены хардкодных паролей на переменные окружения
 * Запуск: node scripts/fix-secrets.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

const filesToFix = [
  'scripts/test-insert-one.mjs',
  'scripts/test-all-migrations.mjs',
  'scripts/import-to-managed-pg.mjs',
  'scripts/import-to-managed-pg-v2.mjs',
  'scripts/import-remaining-tables.mjs',
  'scripts/import-rest-data.mjs',
  'scripts/import-profiles-only.mjs',
  'scripts/apply-migration.mjs',
]

const oldPassword = 'SCNK88tank33'

function fixFile(filePath) {
  const fullPath = path.join(rootDir, filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Файл не найден: ${filePath}`)
    return false
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  let changed = false

  // Заменяем хардкодный пароль на переменную окружения
  if (content.includes(oldPassword)) {
    // Паттерн 1: password: 'SCNK88tank33'
    const pattern1 = /password:\s*['"]SCNK88tank33['"]/g
    if (pattern1.test(content)) {
      content = content.replace(
        pattern1,
        "password: process.env.DB_PASSWORD || process.env.DATABASE_URL?.match(/:(.*)@/)?.[1] || ''"
      )
      changed = true
    }

    // Паттерн 2: password: "SCNK88tank33"
    const pattern2 = /password:\s*["']SCNK88tank33["']/g
    if (pattern2.test(content)) {
      content = content.replace(
        pattern2,
        "password: process.env.DB_PASSWORD || process.env.DATABASE_URL?.match(/:(.*)@/)?.[1] || ''"
      )
      changed = true
    }

    // Паттерн 3: В строке подключения
    const pattern3 = /postgresql:\/\/zumzam_admin:SCNK88tank33@/g
    if (pattern3.test(content)) {
      content = content.replace(
        pattern3,
        "postgresql://zumzam_admin:${process.env.DB_PASSWORD || 'YOUR_PASSWORD'}@"
      )
      changed = true
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`✅ Исправлен: ${filePath}`)
    return true
  } else {
    console.log(`⏭️  Пропущен (нет пароля): ${filePath}`)
    return false
  }
}

console.log('🔒 Исправление утечек секретов...\n')

let fixedCount = 0
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++
  }
}

console.log(`\n✅ Исправлено файлов: ${fixedCount}`)
console.log('\n⚠️  ВАЖНО:')
console.log('1. Смените пароль в базе данных Яндекс.Облако')
console.log('2. Обновите DATABASE_URL в Vercel')
console.log('3. Обновите .env.local локально')
console.log('4. Удалите секреты из истории Git (см. SECURITY_FIX.md)')

