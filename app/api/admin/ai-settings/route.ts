import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * GET /api/admin/ai-settings
 * Получить все настройки AI
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем все настройки AI
    const settings = await prisma.ai_settings.findMany({
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ settings }, { status: 200 })
  } catch (error: any) {
    console.error('[AI Settings GET] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch AI settings' }, { status: 500 })
  }
}

/**
 * POST /api/admin/ai-settings
 * Создать новую настройку AI
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { provider, model_name, api_key, settings, description, is_active } = body

    if (!provider || !model_name) {
      return NextResponse.json({ error: 'Provider and model_name are required' }, { status: 400 })
    }

    // Если создаём активную настройку, деактивируем остальные
    if (is_active) {
      await prisma.ai_settings.updateMany({
        where: { is_active: true },
        data: { is_active: false }
      })
    }

    // Создаём новую настройку
    const newSetting = await prisma.ai_settings.create({
      data: {
        provider,
        model_name,
        api_key,
        settings: settings || {},
        description,
        is_active: is_active ?? false
      }
    })

    return NextResponse.json({ setting: newSetting }, { status: 201 })
  } catch (error: any) {
    console.error('[AI Settings POST] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create AI setting' }, { status: 500 })
  }
}
