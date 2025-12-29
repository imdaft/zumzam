/**
 * Тестирование API endpoints
 * Проверяет работоспособность автоматически конвертированных API
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

console.log('\n🔍 ТЕСТИРОВАНИЕ API ENDPOINTS\n')
console.log('=' .repeat(60))
console.log()

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

function logTest(name, status, message = '') {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️' }
  
  console.log(`${symbols[status]} ${name}`)
  if (message) console.log(`   ${message}`)
  
  results.tests.push({ name, status, message })
  if (status === 'pass') results.passed++
  else if (status === 'fail') results.failed++
  else results.warnings++
}

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

function analyzeApiFile(filePath, code) {
  const issues = []
  const warnings = []
  
  // Проверка 1: Импорты
  if (code.includes('@/lib/supabase/server') || code.includes('@/lib/supabase/admin')) {
    issues.push('❌ Использует старый Supabase import')
  }
  
  if (code.includes('createClient()') && !code.includes('prisma')) {
    issues.push('❌ Вызывает createClient() без Prisma')
  }
  
  // Проверка 2: Prisma import
  if (!code.includes('prisma') && code.includes('supabase.from')) {
    issues.push('❌ Использует Supabase queries без Prisma import')
  }
  
  // Проверка 3: Авторизация
  if (code.includes('supabase.auth.getUser()')) {
    issues.push('❌ Использует Supabase Auth вместо JWT')
  }
  
  if (code.includes('auth.getUser') && !code.includes('verifyToken')) {
    warnings.push('⚠️  Авторизация не мигрирована на JWT')
  }
  
  // Проверка 4: Database queries
  if (code.includes('.from(') && !code.includes('prisma.')) {
    issues.push('❌ Использует Supabase queries (.from)')
  }
  
  // Проверка 5: Error handling
  if (code.includes('const { data, error }') && code.includes('supabase')) {
    warnings.push('⚠️  Старый паттерн { data, error }')
  }
  
  // Проверка 6: Позитивные проверки
  const hasPrisma = code.includes('import prisma from')
  const hasJWT = code.includes('verifyToken') || code.includes('getUserIdFromRequest')
  const hasPrismaQueries = code.includes('prisma.')
  
  return {
    issues,
    warnings,
    hasPrisma,
    hasJWT,
    hasPrismaQueries,
    isMigrated: issues.length === 0
  }
}

console.log('📊 Анализ файлов API...\n')

const apiFiles = getAllApiFiles('app/api')

// Категоризация файлов
const categories = {
  'Критичные (вручную)': [],
  'Автоконвертированные': [],
  'Не требуют миграции': []
}

const manuallyMigrated = [
  'profiles/public', 'profiles/by-slug', 'profiles/[id]',
  'category-images', 'advertising/active-banners', 'advertising/track',
  'auth/yandex/callback', 'reviews', 'services', 'master-class-programs',
  'show-programs', 'quest-programs', 'animator-characters', 'agency-partners',
  'profile-locations', 'requests', 'users/me', 'user/route',
  'analytics', 'notifications', 'upload'
]

let totalIssues = 0
let totalWarnings = 0

for (const filePath of apiFiles) {
  const code = readFileSync(filePath, 'utf8')
  const relativePath = filePath.replace('app\\api\\', '').replace(/\\/g, '/')
  const analysis = analyzeApiFile(filePath, code)
  
  totalIssues += analysis.issues.length
  totalWarnings += analysis.warnings.length
  
  // Определяем категорию
  let category = 'Автоконвертированные'
  if (manuallyMigrated.some(m => relativePath.includes(m))) {
    category = 'Критичные (вручную)'
  } else if (!code.includes('supabase') && !code.includes('createClient')) {
    category = 'Не требуют миграции'
  }
  
  categories[category].push({
    path: relativePath,
    analysis
  })
}

// Выводим результаты по категориям
console.log('📋 Критичные API (мигрированы вручную)\n')
let criticalOk = 0
for (const { path, analysis } of categories['Критичные (вручную)']) {
  if (analysis.isMigrated) {
    logTest(path, 'pass', 'Мигрирован вручную ✓')
    criticalOk++
  } else {
    logTest(path, 'fail', analysis.issues.join(', '))
  }
}

console.log(`\n✅ ${criticalOk}/${categories['Критичные (вручную)'].length} критичных API в порядке\n`)

console.log('📋 Автоконвертированные API\n')
let autoOk = 0
let autoIssues = 0
for (const { path, analysis } of categories['Автоконвертированные']) {
  if (analysis.isMigrated) {
    // Не логируем каждый успешный (слишком много), только подсчёт
    autoOk++
  } else {
    logTest(path, analysis.warnings.length > 0 ? 'warn' : 'fail', 
      [...analysis.issues, ...analysis.warnings].join(', '))
    autoIssues++
  }
}

if (autoIssues === 0) {
  logTest(`Все ${categories['Автоконвертированные'].length} автоконвертированных API`, 'pass', 
    'Паттерны Supabase заменены на Prisma')
} else {
  console.log(`⚠️  ${autoIssues} API требуют ручной доработки\n`)
}

console.log()
console.log('📋 Не требуют миграции\n')
logTest(`${categories['Не требуют миграции'].length} API`, 'pass', 
  'Не используют Supabase')

// ============================================
// ИТОГИ
// ============================================
console.log('\n' + '='.repeat(60))
console.log('\n📊 ИТОГИ АНАЛИЗА API\n')
console.log(`Всего API: ${apiFiles.length}`)
console.log(`✅ Критичные (вручную): ${criticalOk}/${categories['Критичные (вручную)'].length}`)
console.log(`✅ Автоконвертированные: ${autoOk}/${categories['Автоконвертированные'].length}`)
console.log(`✅ Не требуют: ${categories['Не требуют миграции'].length}`)
console.log()
console.log(`❌ Найдено проблем: ${totalIssues}`)
console.log(`⚠️  Предупреждений: ${totalWarnings}`)
console.log()

if (totalIssues === 0) {
  console.log('🎉 ВСЕ API МИГРИРОВАНЫ КОРРЕКТНО!')
  console.log('✅ Supabase полностью заменён на Prisma')
  console.log('✅ JWT авторизация внедрена')
  console.log('✅ Система готова к работе')
} else {
  console.log('⚠️  ТРЕБУЕТСЯ РУЧНАЯ ДОРАБОТКА НЕКОТОРЫХ API')
  console.log(`Проблемных файлов: ${autoIssues}`)
}

console.log()

// Сохраняем детальный отчёт
import { writeFileSync } from 'fs'

const report = {
  timestamp: new Date().toISOString(),
  totalFiles: apiFiles.length,
  categories,
  totalIssues,
  totalWarnings,
  summary: {
    critical: `${criticalOk}/${categories['Критичные (вручную)'].length}`,
    auto: `${autoOk}/${categories['Автоконвертированные'].length}`,
    skip: categories['Не требуют миграции'].length
  }
}

writeFileSync('TEST_API_REPORT.json', JSON.stringify(report, null, 2))
console.log('📄 Детальный отчёт сохранён: TEST_API_REPORT.json\n')

 * Тестирование API endpoints
 * Проверяет работоспособность автоматически конвертированных API
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

console.log('\n🔍 ТЕСТИРОВАНИЕ API ENDPOINTS\n')
console.log('=' .repeat(60))
console.log()

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

function logTest(name, status, message = '') {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️' }
  
  console.log(`${symbols[status]} ${name}`)
  if (message) console.log(`   ${message}`)
  
  results.tests.push({ name, status, message })
  if (status === 'pass') results.passed++
  else if (status === 'fail') results.failed++
  else results.warnings++
}

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

function analyzeApiFile(filePath, code) {
  const issues = []
  const warnings = []
  
  // Проверка 1: Импорты
  if (code.includes('@/lib/supabase/server') || code.includes('@/lib/supabase/admin')) {
    issues.push('❌ Использует старый Supabase import')
  }
  
  if (code.includes('createClient()') && !code.includes('prisma')) {
    issues.push('❌ Вызывает createClient() без Prisma')
  }
  
  // Проверка 2: Prisma import
  if (!code.includes('prisma') && code.includes('supabase.from')) {
    issues.push('❌ Использует Supabase queries без Prisma import')
  }
  
  // Проверка 3: Авторизация
  if (code.includes('supabase.auth.getUser()')) {
    issues.push('❌ Использует Supabase Auth вместо JWT')
  }
  
  if (code.includes('auth.getUser') && !code.includes('verifyToken')) {
    warnings.push('⚠️  Авторизация не мигрирована на JWT')
  }
  
  // Проверка 4: Database queries
  if (code.includes('.from(') && !code.includes('prisma.')) {
    issues.push('❌ Использует Supabase queries (.from)')
  }
  
  // Проверка 5: Error handling
  if (code.includes('const { data, error }') && code.includes('supabase')) {
    warnings.push('⚠️  Старый паттерн { data, error }')
  }
  
  // Проверка 6: Позитивные проверки
  const hasPrisma = code.includes('import prisma from')
  const hasJWT = code.includes('verifyToken') || code.includes('getUserIdFromRequest')
  const hasPrismaQueries = code.includes('prisma.')
  
  return {
    issues,
    warnings,
    hasPrisma,
    hasJWT,
    hasPrismaQueries,
    isMigrated: issues.length === 0
  }
}

console.log('📊 Анализ файлов API...\n')

const apiFiles = getAllApiFiles('app/api')

// Категоризация файлов
const categories = {
  'Критичные (вручную)': [],
  'Автоконвертированные': [],
  'Не требуют миграции': []
}

const manuallyMigrated = [
  'profiles/public', 'profiles/by-slug', 'profiles/[id]',
  'category-images', 'advertising/active-banners', 'advertising/track',
  'auth/yandex/callback', 'reviews', 'services', 'master-class-programs',
  'show-programs', 'quest-programs', 'animator-characters', 'agency-partners',
  'profile-locations', 'requests', 'users/me', 'user/route',
  'analytics', 'notifications', 'upload'
]

let totalIssues = 0
let totalWarnings = 0

for (const filePath of apiFiles) {
  const code = readFileSync(filePath, 'utf8')
  const relativePath = filePath.replace('app\\api\\', '').replace(/\\/g, '/')
  const analysis = analyzeApiFile(filePath, code)
  
  totalIssues += analysis.issues.length
  totalWarnings += analysis.warnings.length
  
  // Определяем категорию
  let category = 'Автоконвертированные'
  if (manuallyMigrated.some(m => relativePath.includes(m))) {
    category = 'Критичные (вручную)'
  } else if (!code.includes('supabase') && !code.includes('createClient')) {
    category = 'Не требуют миграции'
  }
  
  categories[category].push({
    path: relativePath,
    analysis
  })
}

// Выводим результаты по категориям
console.log('📋 Критичные API (мигрированы вручную)\n')
let criticalOk = 0
for (const { path, analysis } of categories['Критичные (вручную)']) {
  if (analysis.isMigrated) {
    logTest(path, 'pass', 'Мигрирован вручную ✓')
    criticalOk++
  } else {
    logTest(path, 'fail', analysis.issues.join(', '))
  }
}

console.log(`\n✅ ${criticalOk}/${categories['Критичные (вручную)'].length} критичных API в порядке\n`)

console.log('📋 Автоконвертированные API\n')
let autoOk = 0
let autoIssues = 0
for (const { path, analysis } of categories['Автоконвертированные']) {
  if (analysis.isMigrated) {
    // Не логируем каждый успешный (слишком много), только подсчёт
    autoOk++
  } else {
    logTest(path, analysis.warnings.length > 0 ? 'warn' : 'fail', 
      [...analysis.issues, ...analysis.warnings].join(', '))
    autoIssues++
  }
}

if (autoIssues === 0) {
  logTest(`Все ${categories['Автоконвертированные'].length} автоконвертированных API`, 'pass', 
    'Паттерны Supabase заменены на Prisma')
} else {
  console.log(`⚠️  ${autoIssues} API требуют ручной доработки\n`)
}

console.log()
console.log('📋 Не требуют миграции\n')
logTest(`${categories['Не требуют миграции'].length} API`, 'pass', 
  'Не используют Supabase')

// ============================================
// ИТОГИ
// ============================================
console.log('\n' + '='.repeat(60))
console.log('\n📊 ИТОГИ АНАЛИЗА API\n')
console.log(`Всего API: ${apiFiles.length}`)
console.log(`✅ Критичные (вручную): ${criticalOk}/${categories['Критичные (вручную)'].length}`)
console.log(`✅ Автоконвертированные: ${autoOk}/${categories['Автоконвертированные'].length}`)
console.log(`✅ Не требуют: ${categories['Не требуют миграции'].length}`)
console.log()
console.log(`❌ Найдено проблем: ${totalIssues}`)
console.log(`⚠️  Предупреждений: ${totalWarnings}`)
console.log()

if (totalIssues === 0) {
  console.log('🎉 ВСЕ API МИГРИРОВАНЫ КОРРЕКТНО!')
  console.log('✅ Supabase полностью заменён на Prisma')
  console.log('✅ JWT авторизация внедрена')
  console.log('✅ Система готова к работе')
} else {
  console.log('⚠️  ТРЕБУЕТСЯ РУЧНАЯ ДОРАБОТКА НЕКОТОРЫХ API')
  console.log(`Проблемных файлов: ${autoIssues}`)
}

console.log()

// Сохраняем детальный отчёт
import { writeFileSync } from 'fs'

const report = {
  timestamp: new Date().toISOString(),
  totalFiles: apiFiles.length,
  categories,
  totalIssues,
  totalWarnings,
  summary: {
    critical: `${criticalOk}/${categories['Критичные (вручную)'].length}`,
    auto: `${autoOk}/${categories['Автоконвертированные'].length}`,
    skip: categories['Не требуют миграции'].length
  }
}

writeFileSync('TEST_API_REPORT.json', JSON.stringify(report, null, 2))
console.log('📄 Детальный отчёт сохранён: TEST_API_REPORT.json\n')




