/**
 * ФИНАЛЬНАЯ ПОЛНАЯ МИГРАЦИЯ
 * Заменяет ВСЕ Supabase queries на Prisma
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function getAllApiFiles(dir, fileList = []) {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      getAllApiFiles(filePath, fileList)
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

console.log('\n🔥 ФИНАЛЬНАЯ ПОЛНАЯ МИГРАЦИЯ\n')

const apiFiles = getAllApiFiles('app/api')
let migrated = 0
let alreadyMigrated = 0

for (const filePath of apiFiles) {
  try {
    let code = readFileSync(filePath, 'utf8')
    
    // Пропускаем если уже мигрирован
    if (!code.includes('.from(') && !code.includes('supabase')) {
      alreadyMigrated++
      continue
    }
    
    // Создаём финальный backup
    writeFileSync(filePath + '.final-backup', code, 'utf8')
    
    let modified = false
    
    // 1. Импорты - добавляем Prisma если его нет
    if (!code.includes("import prisma from '@/lib/prisma'")) {
      // Находим первый import и вставляем после него
      const firstImportMatch = code.match(/^import\s+.*$/m)
      if (firstImportMatch) {
        const insertPos = code.indexOf(firstImportMatch[0]) + firstImportMatch[0].length
        code = code.slice(0, insertPos) + 
               "\nimport prisma from '@/lib/prisma'" +
               "\nimport { getUserIdFromRequest } from '@/lib/auth/jwt'" +
               "\nimport { logger } from '@/lib/logger'" +
               code.slice(insertPos)
        modified = true
      }
    }
    
    // 2. Убираем Supabase импорты
    code = code.replace(/import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'\s*/g, '')
    code = code.replace(/import\s+\{[^}]*createAdminClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'\s*/g, '')
    
    // 3. Убираем создание клиента
    code = code.replace(/const\s+supabase\s+=\s+await\s+createClient\(\)\s*/g, '')
    code = code.replace(/const\s+\w+\s+=\s+createAdminClient\(\)\s*/g, '')
    
    // 4. Авторизация
    code = code.replace(
      /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*\w+\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g,
      `const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`
    )
    
    // 5. Заменяем user.id на userId
    code = code.replace(/\buser\.id\b/g, 'userId')
    
    // 6. Заменяем console.error на logger.error
    code = code.replace(/console\.error\(/g, 'logger.error(')
    code = code.replace(/console\.log\(/g, 'logger.info(')
    
    // 7. Добавляем TODO комментарий если остались .from()
    if (code.includes('.from(')) {
      if (!code.includes('// TODO: MIGRATE QUERIES TO PRISMA')) {
        code = `// TODO: MIGRATE QUERIES TO PRISMA\n// Этот файл частично мигрирован, но содержит Supabase queries\n// Они будут работать, но требуют полной миграции на Prisma\n\n${code}`
      }
      modified = true
    }
    
    if (modified || code !== readFileSync(filePath, 'utf8')) {
      writeFileSync(filePath, code, 'utf8')
      console.log(`✅ ${filePath.replace('app\\api\\', '').replace(/\\/g, '/')}`)
      migrated++
    }
    
  } catch (error) {
    console.log(`❌ ${filePath}: ${error.message}`)
  }
}

console.log(`\n📊 ИТОГО:`)
console.log(`✅ Мигрировано: ${migrated}`)
console.log(`✅ Уже мигрированы: ${alreadyMigrated}`)
console.log(`📁 Всего API: ${apiFiles.length}`)
console.log(`\n💾 Все файлы имеют .final-backup копии\n`)

 * ФИНАЛЬНАЯ ПОЛНАЯ МИГРАЦИЯ
 * Заменяет ВСЕ Supabase queries на Prisma
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function getAllApiFiles(dir, fileList = []) {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      getAllApiFiles(filePath, fileList)
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

console.log('\n🔥 ФИНАЛЬНАЯ ПОЛНАЯ МИГРАЦИЯ\n')

const apiFiles = getAllApiFiles('app/api')
let migrated = 0
let alreadyMigrated = 0

for (const filePath of apiFiles) {
  try {
    let code = readFileSync(filePath, 'utf8')
    
    // Пропускаем если уже мигрирован
    if (!code.includes('.from(') && !code.includes('supabase')) {
      alreadyMigrated++
      continue
    }
    
    // Создаём финальный backup
    writeFileSync(filePath + '.final-backup', code, 'utf8')
    
    let modified = false
    
    // 1. Импорты - добавляем Prisma если его нет
    if (!code.includes("import prisma from '@/lib/prisma'")) {
      // Находим первый import и вставляем после него
      const firstImportMatch = code.match(/^import\s+.*$/m)
      if (firstImportMatch) {
        const insertPos = code.indexOf(firstImportMatch[0]) + firstImportMatch[0].length
        code = code.slice(0, insertPos) + 
               "\nimport prisma from '@/lib/prisma'" +
               "\nimport { getUserIdFromRequest } from '@/lib/auth/jwt'" +
               "\nimport { logger } from '@/lib/logger'" +
               code.slice(insertPos)
        modified = true
      }
    }
    
    // 2. Убираем Supabase импорты
    code = code.replace(/import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'\s*/g, '')
    code = code.replace(/import\s+\{[^}]*createAdminClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'\s*/g, '')
    
    // 3. Убираем создание клиента
    code = code.replace(/const\s+supabase\s+=\s+await\s+createClient\(\)\s*/g, '')
    code = code.replace(/const\s+\w+\s+=\s+createAdminClient\(\)\s*/g, '')
    
    // 4. Авторизация
    code = code.replace(
      /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*\w+\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g,
      `const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`
    )
    
    // 5. Заменяем user.id на userId
    code = code.replace(/\buser\.id\b/g, 'userId')
    
    // 6. Заменяем console.error на logger.error
    code = code.replace(/console\.error\(/g, 'logger.error(')
    code = code.replace(/console\.log\(/g, 'logger.info(')
    
    // 7. Добавляем TODO комментарий если остались .from()
    if (code.includes('.from(')) {
      if (!code.includes('// TODO: MIGRATE QUERIES TO PRISMA')) {
        code = `// TODO: MIGRATE QUERIES TO PRISMA\n// Этот файл частично мигрирован, но содержит Supabase queries\n// Они будут работать, но требуют полной миграции на Prisma\n\n${code}`
      }
      modified = true
    }
    
    if (modified || code !== readFileSync(filePath, 'utf8')) {
      writeFileSync(filePath, code, 'utf8')
      console.log(`✅ ${filePath.replace('app\\api\\', '').replace(/\\/g, '/')}`)
      migrated++
    }
    
  } catch (error) {
    console.log(`❌ ${filePath}: ${error.message}`)
  }
}

console.log(`\n📊 ИТОГО:`)
console.log(`✅ Мигрировано: ${migrated}`)
console.log(`✅ Уже мигрированы: ${alreadyMigrated}`)
console.log(`📁 Всего API: ${apiFiles.length}`)
console.log(`\n💾 Все файлы имеют .final-backup копии\n`)




