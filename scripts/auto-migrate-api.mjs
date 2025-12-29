/**
 * Автоматический конвертер API с Supabase на Prisma
 * 
 * Использование:
 * node scripts/auto-migrate-api.mjs <путь-к-api-файлу>
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const filePath = process.argv[2]

if (!filePath) {
  console.error('❌ Укажите путь к файлу API')
  console.log('Использование: node scripts/auto-migrate-api.mjs app/api/example/route.ts')
  process.exit(1)
}

const fullPath = resolve(filePath)
console.log(`\n🔄 Мигрирую: ${filePath}\n`)

try {
  let content = readFileSync(fullPath, 'utf8')
  let changes = []

  // 1. Заменяем импорты
  if (content.includes("from '@/lib/supabase/server'")) {
    content = content.replace(
      /import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'/g,
      "import prisma from '@/lib/prisma'\nimport { verifyToken } from '@/lib/auth/jwt'"
    )
    changes.push('✅ Импорты обновлены')
  }

  if (content.includes("from '@/lib/supabase/admin'")) {
    content = content.replace(
      /import\s+\{[^}]*createAdminClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'/g,
      ''
    )
    changes.push('✅ Admin client удалён')
  }

  // 2. Заменяем авторизацию
  const authPattern = /const\s+supabase\s+=\s+await\s+createClient\(\)\s*\n\s*const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*authError\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g
  if (authPattern.test(content)) {
    content = content.replace(
      authPattern,
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
    changes.push('✅ Авторизация через JWT')
  }

  // 3. Заменяем простые запросы
  // .from('table').select()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.select\([^)]*\)/g,
    (match, table) => `await prisma.${table}.findMany()`
  )

  // .from('table').insert()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.insert\(([^)]+)\)/g,
    (match, table, data) => `await prisma.${table}.create({ data: ${data} })`
  )

  // .from('table').update()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.update\(([^)]+)\)\.eq\('id',\s*(\w+)\)/g,
    (match, table, data, id) => `await prisma.${table}.update({ where: { id: ${id} }, data: ${data} })`
  )

  // .from('table').delete()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.delete\(\)\.eq\('id',\s*(\w+)\)/g,
    (match, table, id) => `await prisma.${table}.delete({ where: { id: ${id} } })`
  )

  // 4. Удаляем неиспользуемые переменные
  content = content.replace(/const\s+supabase\s+=\s+await\s+createClient\(\)\s*\n/g, '')
  content = content.replace(/const\s+\{\s*data,\s*error\s*\}\s+=\s+/g, 'const data = ')

  // 5. Заменяем user.id на userId
  content = content.replace(/user\.id/g, 'userId')

  // Сохраняем
  writeFileSync(fullPath, content, 'utf8')

  console.log('📊 Изменения:')
  changes.forEach(change => console.log(`  ${change}`))
  console.log(`\n✅ Файл обновлён: ${filePath}\n`)

} catch (error) {
  console.error('❌ Ошибка:', error.message)
  process.exit(1)
}

 * Автоматический конвертер API с Supabase на Prisma
 * 
 * Использование:
 * node scripts/auto-migrate-api.mjs <путь-к-api-файлу>
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const filePath = process.argv[2]

if (!filePath) {
  console.error('❌ Укажите путь к файлу API')
  console.log('Использование: node scripts/auto-migrate-api.mjs app/api/example/route.ts')
  process.exit(1)
}

const fullPath = resolve(filePath)
console.log(`\n🔄 Мигрирую: ${filePath}\n`)

try {
  let content = readFileSync(fullPath, 'utf8')
  let changes = []

  // 1. Заменяем импорты
  if (content.includes("from '@/lib/supabase/server'")) {
    content = content.replace(
      /import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'/g,
      "import prisma from '@/lib/prisma'\nimport { verifyToken } from '@/lib/auth/jwt'"
    )
    changes.push('✅ Импорты обновлены')
  }

  if (content.includes("from '@/lib/supabase/admin'")) {
    content = content.replace(
      /import\s+\{[^}]*createAdminClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'/g,
      ''
    )
    changes.push('✅ Admin client удалён')
  }

  // 2. Заменяем авторизацию
  const authPattern = /const\s+supabase\s+=\s+await\s+createClient\(\)\s*\n\s*const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*authError\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g
  if (authPattern.test(content)) {
    content = content.replace(
      authPattern,
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
    changes.push('✅ Авторизация через JWT')
  }

  // 3. Заменяем простые запросы
  // .from('table').select()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.select\([^)]*\)/g,
    (match, table) => `await prisma.${table}.findMany()`
  )

  // .from('table').insert()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.insert\(([^)]+)\)/g,
    (match, table, data) => `await prisma.${table}.create({ data: ${data} })`
  )

  // .from('table').update()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.update\(([^)]+)\)\.eq\('id',\s*(\w+)\)/g,
    (match, table, data, id) => `await prisma.${table}.update({ where: { id: ${id} }, data: ${data} })`
  )

  // .from('table').delete()
  content = content.replace(
    /await\s+supabase\s*\.from\('(\w+)'\)\.delete\(\)\.eq\('id',\s*(\w+)\)/g,
    (match, table, id) => `await prisma.${table}.delete({ where: { id: ${id} } })`
  )

  // 4. Удаляем неиспользуемые переменные
  content = content.replace(/const\s+supabase\s+=\s+await\s+createClient\(\)\s*\n/g, '')
  content = content.replace(/const\s+\{\s*data,\s*error\s*\}\s+=\s+/g, 'const data = ')

  // 5. Заменяем user.id на userId
  content = content.replace(/user\.id/g, 'userId')

  // Сохраняем
  writeFileSync(fullPath, content, 'utf8')

  console.log('📊 Изменения:')
  changes.forEach(change => console.log(`  ${change}`))
  console.log(`\n✅ Файл обновлён: ${filePath}\n`)

} catch (error) {
  console.error('❌ Ошибка:', error.message)
  process.exit(1)
}




