import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

// Проверка прав админа
async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return { ok: false as const, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return { ok: false as const, response: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) }
  }

  const user = await prisma.users.findUnique({
    where: { id: payload.sub },
    select: { role: true }
  })

  if (!user || user.role !== 'admin') {
    return { ok: false as const, response: NextResponse.json({ message: 'Access denied' }, { status: 403 }) }
  }

  return { ok: true as const }
}

// GET /api/admin/ai-settings/providers - получить все провайдеры
export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdmin(request)
    if (!admin.ok) return admin.response

    const providers = await prisma.ai_settings.findMany({
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ providers })
  } catch (error: any) {
    console.error('[AI Settings] Error fetching providers:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/ai-settings/providers - добавить нового провайдера
export async function POST(request: NextRequest) {
  try {
    const admin = await assertAdmin(request)
    if (!admin.ok) return admin.response

    const body = await request.json()
    const { provider, model_name, api_key, base_url, model_type, description, is_active } = body

    if (!provider || !model_name) {
      return NextResponse.json({ message: 'Provider and model_name are required' }, { status: 400 })
    }

    // Для Ollama base_url обязателен
    if (provider === 'ollama' && !base_url) {
      return NextResponse.json({ message: 'Base URL is required for Ollama' }, { status: 400 })
    }

    // Для облачных провайдеров api_key обязателен
    if (provider !== 'ollama' && !api_key) {
      return NextResponse.json({ message: 'API key is required for cloud providers' }, { status: 400 })
    }

    // Только одна модель может быть активной одновременно
    if (is_active === true) {
      await prisma.ai_settings.updateMany({
        where: { is_active: true },
        data: { is_active: false }
      })
    }

    const newProvider = await prisma.ai_settings.create({
      data: {
        provider,
        model_name,
        api_key: api_key || null,
        base_url: base_url || null,
        model_type: model_type || 'chat',
        description: description || null,
        is_active: is_active ?? true,
        settings: {}
      }
    })

    return NextResponse.json({ provider: newProvider })
  } catch (error: any) {
    console.error('[AI Settings] Error creating provider:', error)
    
    // Проверка на уникальный индекс активной модели
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Уже есть активная модель. Снимите флаг "активная" или замените активную модель.' },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Failed to create provider', 
      details: error.message 
    }, { status: 500 })
  }
}
