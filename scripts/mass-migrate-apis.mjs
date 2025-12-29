/**
 * Массовая миграция API с Supabase на Prisma
 * Создаёт упрощённые версии для API с отсутствующими таблицами
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Список API для миграции (упрощённые версии с TODO)
const apisToStub = [
  // Conversations (4 API)
  'app/api/conversations/route.ts',
  'app/api/conversations/[id]/messages/route.ts',
  'app/api/conversations/[id]/mark-read/route.ts',
  'app/api/conversations/ensure-for-order/route.ts',
  
  // Orders (5 API)
  'app/api/orders/route.ts',
  'app/api/orders/[id]/route.ts',
  'app/api/orders/[id]/messages/route.ts',
  'app/api/orders/[id]/messages/read/route.ts',
  'app/api/orders/[id]/attachments/route.ts',
]

const stubTemplate = `import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * TODO: MIGRATION PENDING
 * This API requires tables that are not yet migrated to Prisma
 * Returning stub response for now
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning empty data')
  return NextResponse.json({ data: [] })
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning success')
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning success')
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning success')
  return NextResponse.json({ success: true })
}
`

let migratedCount = 0

for (const apiPath of apisToStub) {
  const fullPath = resolve(process.cwd(), apiPath)
  
  if (!existsSync(fullPath)) {
    console.log(`⏭️  Skip (not found): ${apiPath}`)
    continue
  }

  // Создаём резервную копию
  const backupPath = fullPath + '.backup'
  if (!existsSync(backupPath)) {
    const original = readFileSync(fullPath, 'utf8')
    writeFileSync(backupPath, original, 'utf8')
  }

  // Пишем заглушку
  writeFileSync(fullPath, stubTemplate, 'utf8')
  console.log(`✅ Migrated (stub): ${apiPath}`)
  migratedCount++
}

console.log(`\n✅ Мигрировано (заглушки): ${migratedCount} API\n`)

 * Массовая миграция API с Supabase на Prisma
 * Создаёт упрощённые версии для API с отсутствующими таблицами
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Список API для миграции (упрощённые версии с TODO)
const apisToStub = [
  // Conversations (4 API)
  'app/api/conversations/route.ts',
  'app/api/conversations/[id]/messages/route.ts',
  'app/api/conversations/[id]/mark-read/route.ts',
  'app/api/conversations/ensure-for-order/route.ts',
  
  // Orders (5 API)
  'app/api/orders/route.ts',
  'app/api/orders/[id]/route.ts',
  'app/api/orders/[id]/messages/route.ts',
  'app/api/orders/[id]/messages/read/route.ts',
  'app/api/orders/[id]/attachments/route.ts',
]

const stubTemplate = `import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * TODO: MIGRATION PENDING
 * This API requires tables that are not yet migrated to Prisma
 * Returning stub response for now
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning empty data')
  return NextResponse.json({ data: [] })
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning success')
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning success')
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.warn('[STUB API] Migration pending, returning success')
  return NextResponse.json({ success: true })
}
`

let migratedCount = 0

for (const apiPath of apisToStub) {
  const fullPath = resolve(process.cwd(), apiPath)
  
  if (!existsSync(fullPath)) {
    console.log(`⏭️  Skip (not found): ${apiPath}`)
    continue
  }

  // Создаём резервную копию
  const backupPath = fullPath + '.backup'
  if (!existsSync(backupPath)) {
    const original = readFileSync(fullPath, 'utf8')
    writeFileSync(backupPath, original, 'utf8')
  }

  // Пишем заглушку
  writeFileSync(fullPath, stubTemplate, 'utf8')
  console.log(`✅ Migrated (stub): ${apiPath}`)
  migratedCount++
}

console.log(`\n✅ Мигрировано (заглушки): ${migratedCount} API\n`)




