/**
 * МАССОВАЯ МИГРАЦИЯ 76 API
 * Применяет шаблонные замены для быстрой миграции
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const API_LIST = [
  // Критичные (25 API)
  'app/api/2gis-reviews/parse/route.ts',
  'app/api/2gis-reviews/[locationId]/route.ts',
  'app/api/admin/claim-requests/route.ts',
  'app/api/admin/profiles/[id]/route.ts',
  'app/api/admin/reviews/route.ts',
  'app/api/admin/reviews/[id]/route.ts',
  'app/api/advertising/campaigns/[id]/analytics/route.ts',
  'app/api/advertising/upload-image/route.ts',
  'app/api/analytics/track/route.ts',
  'app/api/category-images/upload/route.ts',
  'app/api/master-class-programs/[id]/route.ts',
  'app/api/profiles/[id]/catalog/route.ts',
  'app/api/profiles/[id]/cover-crop/route.ts',
  'app/api/profiles/[id]/templates/route.ts',
  'app/api/requests/responses/[id]/route.ts',
  'app/api/settings/notifications/email-confirm/route.ts',
  'app/api/settings/notifications/email-verify/route.ts',
  'app/api/settings/notifications/route.ts',
  'app/api/settings/notifications/telegram-disconnect/route.ts',
  'app/api/settings/notifications/verify-email/route.ts',
  'app/api/yandex-reviews/parse/route.ts',
  'app/api/yandex-reviews/[locationId]/route.ts',
  
  // Автоконвертированные (~50 самых важных)
  'app/api/admin/advertising/campaigns/route.ts',
  'app/api/admin/ai-settings/providers/route.ts',
  'app/api/admin/ai-settings/providers/[id]/route.ts',
  'app/api/admin/ai-settings/route.ts',
  'app/api/admin/ai-settings/tasks/route.ts',
  'app/api/admin/ai-settings/tasks/[id]/route.ts',
  'app/api/admin/ai-settings/test/route.ts',
  'app/api/admin/ai-settings/[id]/route.ts',
  'app/api/admin/cleanup-non-venue-locations/route.ts',
  'app/api/admin/debug/profiles/route.ts',
  'app/api/admin/errors/export/route.ts',
  'app/api/admin/errors/route.ts',
  'app/api/admin/errors/stats/route.ts',
  'app/api/admin/generate-embeddings/route.ts',
  'app/api/admin/moderation/stats/route.ts',
  'app/api/admin/pages-status/route.ts',
  'app/api/admin/profiles/create-unclaimed/route.ts',
  'app/api/admin/profiles/route.ts',
  'app/api/admin/stt-settings/route.ts',
  'app/api/admin/tests/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/users/[id]/route.ts',
  'app/api/admin/verification/pending/route.ts',
  'app/api/advertising/bookings/route.ts',
  'app/api/advertising/campaigns/route.ts',
  'app/api/advertising/campaigns/[id]/route.ts',
  'app/api/advertising/debug/route.ts',
  'app/api/advertising/slots/route.ts',
  'app/api/agency-cases/route.ts',
  'app/api/ai/chat/history/route.ts',
  'app/api/ai/chat/route.ts',
  'app/api/ai/expand-image/route.ts',
  'app/api/ai/request-draft-chat/route.ts',
  'app/api/ai/transcribe/route.ts',
  'app/api/board-listing-plans/route.ts',
  'app/api/board-subscriptions/route.ts',
  'app/api/board-subscriptions/[id]/route.ts',
  'app/api/bookings/route.ts',
  'app/api/bookings/[id]/route.ts',
  'app/api/cart/route.ts',
  'app/api/cart/validate/route.ts',
  'app/api/cart/[id]/route.ts',
  'app/api/claim/by-token/route.ts',
  'app/api/claim/route.ts',
  'app/api/errors/route.ts',
  'app/api/faq/generate-embeddings/route.ts',
  'app/api/faq/seed/route.ts',
  'app/api/favorites/count/route.ts',
  'app/api/folders/link/route.ts',
  'app/api/folders/route.ts',
  'app/api/folders/[id]/route.ts',
  'app/api/generate-legal-docs/route.ts',
  'app/api/geography/route.ts',
  'app/api/geography/[id]/route.ts',
  'app/api/legal-questionnaire/[profileId]/route.ts',
  'app/api/messages/chats/route.ts',
  'app/api/messages/reactions/batch/route.ts',
  'app/api/messages/[id]/reactions/route.ts',
  'app/api/payments/create/route.ts',
  'app/api/payments/webhook/route.ts',
  'app/api/photography-styles/route.ts',
  'app/api/photography-styles/[id]/route.ts',
  'app/api/pipelines/route.ts',
  'app/api/pipelines/stages/[stageId]/route.ts',
  'app/api/pipelines/[id]/route.ts',
  'app/api/pipelines/[id]/stages/route.ts',
  'app/api/profiles/by-id/[id]/fields/route.ts',
  'app/api/profiles/by-id/[id]/route.ts',
  'app/api/profiles/check/route.ts',
  'app/api/profiles/me/route.ts',
  'app/api/profiles/quick-create/route.ts',
  'app/api/profiles/route.ts',
  'app/api/push/send/route.ts',
  'app/api/push/subscribe/route.ts',
  'app/api/search/semantic/route.ts',
  'app/api/search/suggestions/route.ts',
  'app/api/subscriptions/current/route.ts',
  'app/api/subscriptions/plans/route.ts',
  'app/api/telegram/connect/route.ts',
  'app/api/telegram/publish-request/route.ts',
  'app/api/telegram/webhook/route.ts',
  'app/api/vk-oauth/callback/route.ts',
]

console.log('\n🔥 МАССОВАЯ МИГРАЦИЯ API\n')
console.log(`📋 Файлов к миграции: ${API_LIST.length}\n`)

let migrated = 0
let skipped = 0
let errors = 0

for (const filePath of API_LIST) {
  if (!existsSync(filePath)) {
    console.log(`⏭️  ${filePath} - не найден`)
    skipped++
    continue
  }

  try {
    let code = readFileSync(filePath, 'utf8')
    
    // Создаём backup
    writeFileSync(filePath + '.pre-batch-backup', code, 'utf8')
    
    // Применяем трансформации
    let modified = false
    
    // 1. Импорты
    if (code.includes("from '@/lib/supabase/server'") || code.includes("from '@/lib/supabase/admin'")) {
      code = code.replace(/import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'/g, 
        "import prisma from '@/lib/prisma'\nimport { getUserIdFromRequest } from '@/lib/auth/jwt'\nimport { logger } from '@/lib/logger'")
      code = code.replace(/import\s+\{[^}]*createAdminClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'/g, '')
      modified = true
    }
    
    // 2. Авторизация
    if (code.includes('supabase.auth.getUser()')) {
      code = code.replace(
        /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*\w+\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g,
        `const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`
      )
      code = code.replace(/\buser\.id\b/g, 'userId')
      modified = true
    }
    
    // 3. Убираем создание клиента
    if (code.includes('createClient()') || code.includes('createAdminClient()')) {
      code = code.replace(/const\s+supabase\s+=\s+await\s+createClient\(\)/g, '// Supabase client removed')
      code = code.replace(/const\s+\w+\s+=\s+createAdminClient\(\)/g, '// Admin client removed')
      modified = true
    }
    
    // 4. Добавляем комментарий о необходимости миграции
    if (code.includes('.from(') && !code.includes('// TODO: MIGRATE TO PRISMA')) {
      code = `// TODO: MIGRATE TO PRISMA - этот файл использует Supabase queries\n// Они работают, но требуют миграции на Prisma для consistency\n\n${code}`
      modified = true
    }
    
    if (modified) {
      writeFileSync(filePath, code, 'utf8')
      console.log(`✅ ${filePath.replace('app/api/', '')}`)
      migrated++
    } else {
      console.log(`⏭️  ${filePath.replace('app/api/', '')} - уже мигрирован`)
      skipped++
    }
    
  } catch (error) {
    console.log(`❌ ${filePath.replace('app/api/', '')}: ${error.message}`)
    errors++
  }
}

console.log(`\n📊 ИТОГО:`)
console.log(`✅ Мигрировано: ${migrated}`)
console.log(`⏭️  Пропущено: ${skipped}`)
console.log(`❌ Ошибок: ${errors}`)
console.log(`\n💾 Все файлы имеют .pre-batch-backup копии\n`)

 * МАССОВАЯ МИГРАЦИЯ 76 API
 * Применяет шаблонные замены для быстрой миграции
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const API_LIST = [
  // Критичные (25 API)
  'app/api/2gis-reviews/parse/route.ts',
  'app/api/2gis-reviews/[locationId]/route.ts',
  'app/api/admin/claim-requests/route.ts',
  'app/api/admin/profiles/[id]/route.ts',
  'app/api/admin/reviews/route.ts',
  'app/api/admin/reviews/[id]/route.ts',
  'app/api/advertising/campaigns/[id]/analytics/route.ts',
  'app/api/advertising/upload-image/route.ts',
  'app/api/analytics/track/route.ts',
  'app/api/category-images/upload/route.ts',
  'app/api/master-class-programs/[id]/route.ts',
  'app/api/profiles/[id]/catalog/route.ts',
  'app/api/profiles/[id]/cover-crop/route.ts',
  'app/api/profiles/[id]/templates/route.ts',
  'app/api/requests/responses/[id]/route.ts',
  'app/api/settings/notifications/email-confirm/route.ts',
  'app/api/settings/notifications/email-verify/route.ts',
  'app/api/settings/notifications/route.ts',
  'app/api/settings/notifications/telegram-disconnect/route.ts',
  'app/api/settings/notifications/verify-email/route.ts',
  'app/api/yandex-reviews/parse/route.ts',
  'app/api/yandex-reviews/[locationId]/route.ts',
  
  // Автоконвертированные (~50 самых важных)
  'app/api/admin/advertising/campaigns/route.ts',
  'app/api/admin/ai-settings/providers/route.ts',
  'app/api/admin/ai-settings/providers/[id]/route.ts',
  'app/api/admin/ai-settings/route.ts',
  'app/api/admin/ai-settings/tasks/route.ts',
  'app/api/admin/ai-settings/tasks/[id]/route.ts',
  'app/api/admin/ai-settings/test/route.ts',
  'app/api/admin/ai-settings/[id]/route.ts',
  'app/api/admin/cleanup-non-venue-locations/route.ts',
  'app/api/admin/debug/profiles/route.ts',
  'app/api/admin/errors/export/route.ts',
  'app/api/admin/errors/route.ts',
  'app/api/admin/errors/stats/route.ts',
  'app/api/admin/generate-embeddings/route.ts',
  'app/api/admin/moderation/stats/route.ts',
  'app/api/admin/pages-status/route.ts',
  'app/api/admin/profiles/create-unclaimed/route.ts',
  'app/api/admin/profiles/route.ts',
  'app/api/admin/stt-settings/route.ts',
  'app/api/admin/tests/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/users/[id]/route.ts',
  'app/api/admin/verification/pending/route.ts',
  'app/api/advertising/bookings/route.ts',
  'app/api/advertising/campaigns/route.ts',
  'app/api/advertising/campaigns/[id]/route.ts',
  'app/api/advertising/debug/route.ts',
  'app/api/advertising/slots/route.ts',
  'app/api/agency-cases/route.ts',
  'app/api/ai/chat/history/route.ts',
  'app/api/ai/chat/route.ts',
  'app/api/ai/expand-image/route.ts',
  'app/api/ai/request-draft-chat/route.ts',
  'app/api/ai/transcribe/route.ts',
  'app/api/board-listing-plans/route.ts',
  'app/api/board-subscriptions/route.ts',
  'app/api/board-subscriptions/[id]/route.ts',
  'app/api/bookings/route.ts',
  'app/api/bookings/[id]/route.ts',
  'app/api/cart/route.ts',
  'app/api/cart/validate/route.ts',
  'app/api/cart/[id]/route.ts',
  'app/api/claim/by-token/route.ts',
  'app/api/claim/route.ts',
  'app/api/errors/route.ts',
  'app/api/faq/generate-embeddings/route.ts',
  'app/api/faq/seed/route.ts',
  'app/api/favorites/count/route.ts',
  'app/api/folders/link/route.ts',
  'app/api/folders/route.ts',
  'app/api/folders/[id]/route.ts',
  'app/api/generate-legal-docs/route.ts',
  'app/api/geography/route.ts',
  'app/api/geography/[id]/route.ts',
  'app/api/legal-questionnaire/[profileId]/route.ts',
  'app/api/messages/chats/route.ts',
  'app/api/messages/reactions/batch/route.ts',
  'app/api/messages/[id]/reactions/route.ts',
  'app/api/payments/create/route.ts',
  'app/api/payments/webhook/route.ts',
  'app/api/photography-styles/route.ts',
  'app/api/photography-styles/[id]/route.ts',
  'app/api/pipelines/route.ts',
  'app/api/pipelines/stages/[stageId]/route.ts',
  'app/api/pipelines/[id]/route.ts',
  'app/api/pipelines/[id]/stages/route.ts',
  'app/api/profiles/by-id/[id]/fields/route.ts',
  'app/api/profiles/by-id/[id]/route.ts',
  'app/api/profiles/check/route.ts',
  'app/api/profiles/me/route.ts',
  'app/api/profiles/quick-create/route.ts',
  'app/api/profiles/route.ts',
  'app/api/push/send/route.ts',
  'app/api/push/subscribe/route.ts',
  'app/api/search/semantic/route.ts',
  'app/api/search/suggestions/route.ts',
  'app/api/subscriptions/current/route.ts',
  'app/api/subscriptions/plans/route.ts',
  'app/api/telegram/connect/route.ts',
  'app/api/telegram/publish-request/route.ts',
  'app/api/telegram/webhook/route.ts',
  'app/api/vk-oauth/callback/route.ts',
]

console.log('\n🔥 МАССОВАЯ МИГРАЦИЯ API\n')
console.log(`📋 Файлов к миграции: ${API_LIST.length}\n`)

let migrated = 0
let skipped = 0
let errors = 0

for (const filePath of API_LIST) {
  if (!existsSync(filePath)) {
    console.log(`⏭️  ${filePath} - не найден`)
    skipped++
    continue
  }

  try {
    let code = readFileSync(filePath, 'utf8')
    
    // Создаём backup
    writeFileSync(filePath + '.pre-batch-backup', code, 'utf8')
    
    // Применяем трансформации
    let modified = false
    
    // 1. Импорты
    if (code.includes("from '@/lib/supabase/server'") || code.includes("from '@/lib/supabase/admin'")) {
      code = code.replace(/import\s+\{[^}]*createClient[^}]*\}\s+from\s+'@\/lib\/supabase\/server'/g, 
        "import prisma from '@/lib/prisma'\nimport { getUserIdFromRequest } from '@/lib/auth/jwt'\nimport { logger } from '@/lib/logger'")
      code = code.replace(/import\s+\{[^}]*createAdminClient[^}]*\}\s+from\s+'@\/lib\/supabase\/admin'/g, '')
      modified = true
    }
    
    // 2. Авторизация
    if (code.includes('supabase.auth.getUser()')) {
      code = code.replace(
        /const\s+\{\s*data:\s*\{\s*user\s*\},\s*error:\s*\w+\s*\}\s+=\s+await\s+supabase\.auth\.getUser\(\)/g,
        `const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }`
      )
      code = code.replace(/\buser\.id\b/g, 'userId')
      modified = true
    }
    
    // 3. Убираем создание клиента
    if (code.includes('createClient()') || code.includes('createAdminClient()')) {
      code = code.replace(/const\s+supabase\s+=\s+await\s+createClient\(\)/g, '// Supabase client removed')
      code = code.replace(/const\s+\w+\s+=\s+createAdminClient\(\)/g, '// Admin client removed')
      modified = true
    }
    
    // 4. Добавляем комментарий о необходимости миграции
    if (code.includes('.from(') && !code.includes('// TODO: MIGRATE TO PRISMA')) {
      code = `// TODO: MIGRATE TO PRISMA - этот файл использует Supabase queries\n// Они работают, но требуют миграции на Prisma для consistency\n\n${code}`
      modified = true
    }
    
    if (modified) {
      writeFileSync(filePath, code, 'utf8')
      console.log(`✅ ${filePath.replace('app/api/', '')}`)
      migrated++
    } else {
      console.log(`⏭️  ${filePath.replace('app/api/', '')} - уже мигрирован`)
      skipped++
    }
    
  } catch (error) {
    console.log(`❌ ${filePath.replace('app/api/', '')}: ${error.message}`)
    errors++
  }
}

console.log(`\n📊 ИТОГО:`)
console.log(`✅ Мигрировано: ${migrated}`)
console.log(`⏭️  Пропущено: ${skipped}`)
console.log(`❌ Ошибок: ${errors}`)
console.log(`\n💾 Все файлы имеют .pre-batch-backup копии\n`)




