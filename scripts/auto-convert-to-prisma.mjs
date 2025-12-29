/**
 * Автоматический конвертер Supabase API → Prisma API
 * Анализирует код и конвертирует паттерны
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
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

function convertToPrisma(code, filePath) {
  let converted = code

  // 1. Импорты
  converted = converted.replace(
    /import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'/g,
    "import prisma from '@/lib/prisma'\nimport { verifyToken } from '@/lib/auth/jwt'"
  )
  
  converted = converted.replace(
    /import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'/g,
    ''
  )

  // 2. Авторизация - убираем старый код
  converted = converted.replace(
    /const\s+supabase\s+=\s+await\s+createClient\(\)/g,
    '// Supabase client removed'
  )

  // Заменяем auth.getUser() на JWT
  converted = converted.replace(
    /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*(\w+)\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g,
    `const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub`
  )

  // Заменяем проверки authError
  converted = converted.replace(
    /if\s+\((\w+)\s+\|\|\s+!user\)\s+\{[^}]*return[^}]*\}/g,
    '// Auth check done above'
  )

  // 3. Заменяем user.id на userId
  converted = converted.replace(/\buser\.id\b/g, 'userId')

  // 4. Простые запросы Supabase → Prisma
  
  // Убираем упоминания "supabase" из кода (заменяем на комментарий)
  converted = converted.replace(
    /const\s+(\w+)\s+=\s+await\s+supabase\.from\(/g,
    '// TODO: Migrate to Prisma\n  const $1 = await prisma.'
  )
  
  // Заменяем .from('table') на prisma.table
  converted = converted.replace(
    /supabase\.from\('(\w+)'\)/g,
    'prisma.$1'
  )

  // 5. Убираем обработку { data, error }
  converted = converted.replace(
    /const\s+\{\s*data:\s*(\w+),\s*error:\s*(\w+)\s*\}\s+=\s+(await\s+prisma\.[^;]+)/g,
    'const $1 = $3'
  )

  converted = converted.replace(
    /const\s+\{\s*data,\s*error:\s*(\w+)\s*\}\s+=\s+(await\s+prisma\.[^;]+)/g,
    'const data = $2'
  )

  converted = converted.replace(
    /const\s+\{\s*error:\s*(\w+)\s*\}\s+=\s+(await\s+prisma\.[^;]+)/g,
    '$2'
  )

  // 6. Убираем проверки error
  converted = converted.replace(
    /if\s+\((\w+Error|\w+_error)\)\s+\{[^}]*console\.error[^}]*return[^}]*\}/gs,
    '// Error handling removed (Prisma throws exceptions)'
  )

  return converted
}

console.log('\n🔄 АВТОМАТИЧЕСКАЯ КОНВЕРТАЦИЯ API...\n')

const apiDir = 'app/api'
const apiFiles = getAllApiFiles(apiDir)

// Файлы которые УЖЕ мигрированы вручную (не трогаем)
const skipFiles = [
  'profiles\\public\\route.ts',
  'profiles\\by-slug\\[slug]\\route.ts',
  'profiles\\[id]\\route.ts',
  'category-images\\route.ts',
  'advertising\\active-banners\\route.ts',
  'advertising\\track\\route.ts',
  'auth\\yandex\\callback\\route.ts',
  'reviews\\route.ts',
  'reviews\\[id]\\route.ts',
  'services\\route.ts',
  'services\\[id]\\route.ts',
  'services\\reorder\\route.ts',
  'master-class-programs\\route.ts',
  'master-class-programs\\[id]\\route.ts',
  'show-programs\\route.ts',
  'show-programs\\[id]\\route.ts',
  'quest-programs\\route.ts',
  'quest-programs\\[id]\\route.ts',
  'animator-characters\\route.ts',
  'animator-characters\\[id]\\route.ts',
  'agency-partners\\[id]\\route.ts',
  'profile-locations\\route.ts',
  'profile-locations\\[id]\\route.ts',
  'requests\\route.ts',
  'requests\\[id]\\route.ts',
  'requests\\[id]\\respond\\route.ts',
  'users\\me\\route.ts',
  'user\\route.ts',
  'user\\counts\\route.ts',
  'user\\views\\route.ts',
  'analytics\\track\\route.ts',
  'analytics\\source\\route.ts',
  'analytics\\interest\\route.ts',
  'analytics\\provider\\route.ts',
  'analytics\\provider\\breakdowns\\route.ts',
  'notifications\\route.ts',
  'notifications\\[id]\\route.ts',
  'notifications\\[id]\\read\\route.ts',
  'upload\\route.ts'
]

let converted = 0
let skipped = 0

for (const filePath of apiFiles) {
  const relativePath = filePath.replace('app\\api\\', '').replace(/\//g, '\\')
  
  // Проверяем, не мигрирован ли уже
  if (skipFiles.some(skip => relativePath.includes(skip))) {
    skipped++
    continue
  }

  try {
    const code = readFileSync(filePath, 'utf8')
    
    // Проверяем, использует ли Supabase
    if (!code.includes('createClient') && !code.includes('@/lib/supabase')) {
      skipped++
      continue
    }

    const convertedCode = convertToPrisma(code, filePath)
    writeFileSync(filePath, convertedCode, 'utf8')
    
    console.log(`✅ Converted: ${relativePath}`)
    converted++
  } catch (error) {
    console.log(`⚠️  Error converting ${relativePath}: ${error.message}`)
  }
}

console.log(`\n✅ Конвертировано: ${converted} API`)
console.log(`⏭️  Пропущено: ${skipped} API (уже мигрированы или не требуют)\n`)


 * Анализирует код и конвертирует паттерны
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
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

function convertToPrisma(code, filePath) {
  let converted = code

  // 1. Импорты
  converted = converted.replace(
    /import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'/g,
    "import prisma from '@/lib/prisma'\nimport { verifyToken } from '@/lib/auth/jwt'"
  )
  
  converted = converted.replace(
    /import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'/g,
    ''
  )

  // 2. Авторизация - убираем старый код
  converted = converted.replace(
    /const\s+supabase\s+=\s+await\s+createClient\(\)/g,
    '// Supabase client removed'
  )

  // Заменяем auth.getUser() на JWT
  converted = converted.replace(
    /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*(\w+)\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g,
    `const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub`
  )

  // Заменяем проверки authError
  converted = converted.replace(
    /if\s+\((\w+)\s+\|\|\s+!user\)\s+\{[^}]*return[^}]*\}/g,
    '// Auth check done above'
  )

  // 3. Заменяем user.id на userId
  converted = converted.replace(/\buser\.id\b/g, 'userId')

  // 4. Простые запросы Supabase → Prisma
  
  // Убираем упоминания "supabase" из кода (заменяем на комментарий)
  converted = converted.replace(
    /const\s+(\w+)\s+=\s+await\s+supabase\.from\(/g,
    '// TODO: Migrate to Prisma\n  const $1 = await prisma.'
  )
  
  // Заменяем .from('table') на prisma.table
  converted = converted.replace(
    /supabase\.from\('(\w+)'\)/g,
    'prisma.$1'
  )

  // 5. Убираем обработку { data, error }
  converted = converted.replace(
    /const\s+\{\s*data:\s*(\w+),\s*error:\s*(\w+)\s*\}\s+=\s+(await\s+prisma\.[^;]+)/g,
    'const $1 = $3'
  )

  converted = converted.replace(
    /const\s+\{\s*data,\s*error:\s*(\w+)\s*\}\s+=\s+(await\s+prisma\.[^;]+)/g,
    'const data = $2'
  )

  converted = converted.replace(
    /const\s+\{\s*error:\s*(\w+)\s*\}\s+=\s+(await\s+prisma\.[^;]+)/g,
    '$2'
  )

  // 6. Убираем проверки error
  converted = converted.replace(
    /if\s+\((\w+Error|\w+_error)\)\s+\{[^}]*console\.error[^}]*return[^}]*\}/gs,
    '// Error handling removed (Prisma throws exceptions)'
  )

  return converted
}

console.log('\n🔄 АВТОМАТИЧЕСКАЯ КОНВЕРТАЦИЯ API...\n')

const apiDir = 'app/api'
const apiFiles = getAllApiFiles(apiDir)

// Файлы которые УЖЕ мигрированы вручную (не трогаем)
const skipFiles = [
  'profiles\\public\\route.ts',
  'profiles\\by-slug\\[slug]\\route.ts',
  'profiles\\[id]\\route.ts',
  'category-images\\route.ts',
  'advertising\\active-banners\\route.ts',
  'advertising\\track\\route.ts',
  'auth\\yandex\\callback\\route.ts',
  'reviews\\route.ts',
  'reviews\\[id]\\route.ts',
  'services\\route.ts',
  'services\\[id]\\route.ts',
  'services\\reorder\\route.ts',
  'master-class-programs\\route.ts',
  'master-class-programs\\[id]\\route.ts',
  'show-programs\\route.ts',
  'show-programs\\[id]\\route.ts',
  'quest-programs\\route.ts',
  'quest-programs\\[id]\\route.ts',
  'animator-characters\\route.ts',
  'animator-characters\\[id]\\route.ts',
  'agency-partners\\[id]\\route.ts',
  'profile-locations\\route.ts',
  'profile-locations\\[id]\\route.ts',
  'requests\\route.ts',
  'requests\\[id]\\route.ts',
  'requests\\[id]\\respond\\route.ts',
  'users\\me\\route.ts',
  'user\\route.ts',
  'user\\counts\\route.ts',
  'user\\views\\route.ts',
  'analytics\\track\\route.ts',
  'analytics\\source\\route.ts',
  'analytics\\interest\\route.ts',
  'analytics\\provider\\route.ts',
  'analytics\\provider\\breakdowns\\route.ts',
  'notifications\\route.ts',
  'notifications\\[id]\\route.ts',
  'notifications\\[id]\\read\\route.ts',
  'upload\\route.ts'
]

let converted = 0
let skipped = 0

for (const filePath of apiFiles) {
  const relativePath = filePath.replace('app\\api\\', '').replace(/\//g, '\\')
  
  // Проверяем, не мигрирован ли уже
  if (skipFiles.some(skip => relativePath.includes(skip))) {
    skipped++
    continue
  }

  try {
    const code = readFileSync(filePath, 'utf8')
    
    // Проверяем, использует ли Supabase
    if (!code.includes('createClient') && !code.includes('@/lib/supabase')) {
      skipped++
      continue
    }

    const convertedCode = convertToPrisma(code, filePath)
    writeFileSync(filePath, convertedCode, 'utf8')
    
    console.log(`✅ Converted: ${relativePath}`)
    converted++
  } catch (error) {
    console.log(`⚠️  Error converting ${relativePath}: ${error.message}`)
  }
}

console.log(`\n✅ Конвертировано: ${converted} API`)
console.log(`⏭️  Пропущено: ${skipped} API (уже мигрированы или не требуют)\n`)

