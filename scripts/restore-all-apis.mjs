/**
 * Скрипт для восстановления всех API из backup'ов
 * Это быстрее чем писать каждый с нуля
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

function getAllBackupFiles(dir, fileList = []) {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      getAllBackupFiles(filePath, fileList)
    } else if (file.endsWith('.supabase-backup')) {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

console.log('\n🔄 ВОССТАНАВЛИВАЮ ВСЕ API ИЗ BACKUP...\n')

const apiDir = 'app/api'
const backupFiles = getAllBackupFiles(apiDir)

let restored = 0

for (const backupPath of backupFiles) {
  const originalPath = backupPath.replace('.supabase-backup', '')
  
  // Восстанавливаем оригинал
  const backup = readFileSync(backupPath, 'utf8')
  writeFileSync(originalPath, backup, 'utf8')
  
  const relativePath = originalPath.replace('app\\api\\', '').replace(/\\/g, '/')
  console.log(`✅ Restored: ${relativePath}`)
  restored++
}

console.log(`\n✅ Восстановлено: ${restored} API из backup\n`)
console.log('📝 Теперь буду мигрировать каждый на Prisma...\n')

 * Скрипт для восстановления всех API из backup'ов
 * Это быстрее чем писать каждый с нуля
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

function getAllBackupFiles(dir, fileList = []) {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      getAllBackupFiles(filePath, fileList)
    } else if (file.endsWith('.supabase-backup')) {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

console.log('\n🔄 ВОССТАНАВЛИВАЮ ВСЕ API ИЗ BACKUP...\n')

const apiDir = 'app/api'
const backupFiles = getAllBackupFiles(apiDir)

let restored = 0

for (const backupPath of backupFiles) {
  const originalPath = backupPath.replace('.supabase-backup', '')
  
  // Восстанавливаем оригинал
  const backup = readFileSync(backupPath, 'utf8')
  writeFileSync(originalPath, backup, 'utf8')
  
  const relativePath = originalPath.replace('app\\api\\', '').replace(/\\/g, '/')
  console.log(`✅ Restored: ${relativePath}`)
  restored++
}

console.log(`\n✅ Восстановлено: ${restored} API из backup\n`)
console.log('📝 Теперь буду мигрировать каждый на Prisma...\n')




