import { NextRequest, NextResponse } from 'next/server'
import { generateProfileEmbedding } from '@/lib/ai/generate-profile-embedding'

/**
 * Webhook для автоматической регенерации embeddings при изменении профиля
 * Вызывается после создания/обновления услуг, пакетов, отзывов
 */
export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json()

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId is required' },
        { status: 400 }
      )
    }

    console.log(`[profile-updated webhook] Regenerating embedding for profile ${profileId}`)
    
    // Генерируем embedding в фоне
    const embedding = await generateProfileEmbedding(profileId)

    if (embedding) {
      return NextResponse.json({ 
        success: true, 
        message: 'Embedding regenerated successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to regenerate embedding' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[profile-updated webhook] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}















