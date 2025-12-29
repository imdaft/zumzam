import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/admin/generate-embeddings - генерация векторных эмбеддингов
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { target } = body // 'profiles' | 'services' | 'reviews' | 'faq'

    if (!target) {
      return NextResponse.json({ error: 'target is required' }, { status: 400 })
    }

    // Получение AI модели для эмбеддингов
    const embeddingTask = await prisma.ai_task_models.findFirst({
      where: {
        task_key: 'embeddings',
        is_enabled: true
      },
      include: {
        ai_settings_ai_task_models_ai_setting_idToai_settings: true
      }
    })

    if (!embeddingTask || !embeddingTask.ai_settings_ai_task_models_ai_setting_idToai_settings) {
      return NextResponse.json(
        { error: 'Embedding model not configured' },
        { status: 500 }
      )
    }

    let processed = 0

    switch (target) {
      case 'profiles':
        // TODO: Генерация эмбеддингов для профилей
        const profiles = await prisma.profiles.findMany({
          where: { embedding: null },
          take: 100
        })
        processed = profiles.length
        break

      case 'faq':
        // TODO: Генерация эмбеддингов для FAQ
        const faqItems = await prisma.faq_items.findMany({
          where: { embedding: null },
          take: 100
        })
        processed = faqItems.length
        break

      case 'services':
        // TODO: Генерация эмбеддингов для услуг
        const services = await prisma.services.findMany({
          where: { embedding: null },
          take: 100
        })
        processed = services.length
        break

      case 'reviews':
        // TODO: Генерация эмбеддингов для отзывов
        const reviews = await prisma.reviews.findMany({
          where: { embedding: null },
          take: 100
        })
        processed = reviews.length
        break

      default:
        return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      target,
      processed,
      message: `Embedding generation for ${target} is in development. Found ${processed} items.`
    })
  } catch (error: any) {
    console.error('Error generating embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to generate embeddings', details: error.message },
      { status: 500 }
    )
  }
}



