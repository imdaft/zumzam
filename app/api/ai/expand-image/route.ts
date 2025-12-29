import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// POST /api/ai/expand-image - расширение изображения AI (для обложек профиля)
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

    const body = await request.json()
    const { image_url, direction, aspect_ratio } = body

    if (!image_url || !direction) {
      return NextResponse.json(
        { error: 'image_url and direction are required' },
        { status: 400 }
      )
    }

    // TODO: Вызов AI для расширения изображения
    // - Google Imagen
    // - DALL-E Outpainting
    // - Stable Diffusion Inpainting
    // const expandedImage = await expandImageWithAI(image_url, direction, aspect_ratio)

    // Временная заглушка
    const expandedImage = {
      url: image_url, // В реальности здесь будет новый URL
      direction,
      original_url: image_url,
      processing_time: 3.5,
      message: 'AI image expansion is in development. Returning original image.'
    }

    return NextResponse.json(expandedImage)
  } catch (error: any) {
    console.error('Error expanding image:', error)
    return NextResponse.json(
      { error: 'Failed to expand image', details: error.message },
      { status: 500 }
    )
  }
}



