import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/faq/generate-embeddings - генерация эмбеддингов для FAQ
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

    // Получение FAQ без эмбеддингов
    const faqItems = await prisma.faq_items.findMany({
      where: { embedding: null }
    })

    if (faqItems.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'All FAQ items already have embeddings'
      })
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

    // TODO: Генерация эмбеддингов через AI
    // const aiSettings = embeddingTask.ai_settings_ai_task_models_ai_setting_idToai_settings
    // for (const item of faqItems) {
    //   const text = `${item.question} ${item.answer}`
    //   const embedding = await generateEmbedding(text, aiSettings)
    //   await prisma.faq_items.update({
    //     where: { id: item.id },
    //     data: { embedding }
    //   })
    // }

    return NextResponse.json({
      success: true,
      processed: faqItems.length,
      message: `Embedding generation for ${faqItems.length} FAQ items is in development`
    })
  } catch (error: any) {
    console.error('Error generating FAQ embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to generate embeddings', details: error.message },
      { status: 500 }
    )
  }
}



