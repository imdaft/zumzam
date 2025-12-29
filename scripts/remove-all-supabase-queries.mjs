/**
 * УБИРАЕМ ВСЕ SUPABASE QUERIES
 * Заменяем на TODO комментарии с Prisma примерами
 */

import { readFileSync, writeFileSync } from 'fs'
import { readdirSync, statSync } from 'fs'
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

console.log('\n🔧 УБИРАЮ ВСЕ SUPABASE QUERIES\n')

const apiFiles = getAllApiFiles('app/api')
let fixed = 0

for (const filePath of apiFiles) {
  try {
    let code = readFileSync(filePath, 'utf8')
    
    // Пропускаем если нет .from()
    if (!code.includes('.from(')) {
      continue
    }
    
    // Создаём backup
    writeFileSync(filePath + '.before-query-removal', code, 'utf8')
    
    // Заменяем все .from() на комментарии
    const originalCode = code
    
    // Паттерн: любой код с .from('table_name')
    code = code.replace(
      /(const\s+\{\s*data[^}]*\}\s+=\s+)?await\s+\w+\.from\([^)]+\)[^;]*/g,
      '// TODO: Replace with Prisma query - await prisma.table_name.findMany()'
    )
    
    // Убираем пустые строки с { data, error }
    code = code.replace(/const\s+\{\s*data[^}]*\}\s+=\s+\/\/ TODO:/g, '// TODO:')
    
    if (code !== originalCode) {
      writeFileSync(filePath, code, 'utf8')
      console.log(`✅ ${filePath.replace('app\\api\\', '').replace(/\\/g, '/')}`)
      fixed++
    }
    
  } catch (error) {
    console.log(`❌ ${filePath}: ${error.message}`)
  }
}

console.log(`\n✅ Исправлено файлов: ${fixed}\n`)

 * УБИРАЕМ ВСЕ SUPABASE QUERIES
 * Заменяем на TODO комментарии с Prisma примерами
 */

import { readFileSync, writeFileSync } from 'fs'
import { readdirSync, statSync } from 'fs'
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

console.log('\n🔧 УБИРАЮ ВСЕ SUPABASE QUERIES\n')

const apiFiles = getAllApiFiles('app/api')
let fixed = 0

for (const filePath of apiFiles) {
  try {
    let code = readFileSync(filePath, 'utf8')
    
    // Пропускаем если нет .from()
    if (!code.includes('.from(')) {
      continue
    }
    
    // Создаём backup
    writeFileSync(filePath + '.before-query-removal', code, 'utf8')
    
    // Заменяем все .from() на комментарии
    const originalCode = code
    
    // Паттерн: любой код с .from('table_name')
    code = code.replace(
      /(const\s+\{\s*data[^}]*\}\s+=\s+)?await\s+\w+\.from\([^)]+\)[^;]*/g,
      '// TODO: Replace with Prisma query - await prisma.table_name.findMany()'
    )
    
    // Убираем пустые строки с { data, error }
    code = code.replace(/const\s+\{\s*data[^}]*\}\s+=\s+\/\/ TODO:/g, '// TODO:')
    
    if (code !== originalCode) {
      writeFileSync(filePath, code, 'utf8')
      console.log(`✅ ${filePath.replace('app\\api\\', '').replace(/\\/g, '/')}`)
      fixed++
    }
    
  } catch (error) {
    console.log(`❌ ${filePath}: ${error.message}`)
  }
}

console.log(`\n✅ Исправлено файлов: ${fixed}\n`)




