import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/ai/expand-category-image - расширение изображений категорий AI
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

    // Проверка прав администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { category_id, original_image_url } = body

    if (!category_id || !original_image_url) {
      return NextResponse.json(
        { error: 'category_id and original_image_url are required' },
        { status: 400 }
      )
    }

    // TODO: Генерация desktop (16:9) и mobile (1:1) версий через AI
    // const desktopImage = await expandImageWithAI(original_image_url, 'horizontal', 16/9)
    // const mobileImage = await expandImageWithAI(original_image_url, 'square', 1)

    // Временная заглушка
    const result = {
      desktop_image_url: original_image_url,
      mobile_image_url: original_image_url,
      desktop_crop: { x: 0, y: 0, zoom: 1 },
      mobile_crop: { x: 0, y: 0, zoom: 1 },
      message: 'AI expansion is in development. Using original image for both versions.'
    }

    // Обновление в БД
    await prisma.category_images.upsert({
      where: { category_id },
      update: {
        desktop_image_url: result.desktop_image_url,
        mobile_image_url: result.mobile_image_url,
        original_image_url,
        desktop_crop: result.desktop_crop as any,
        mobile_crop: result.mobile_crop as any,
        updated_at: new Date()
      },
      create: {
        category_id,
        desktop_image_url: result.desktop_image_url,
        mobile_image_url: result.mobile_image_url,
        original_image_url,
        desktop_crop: result.desktop_crop as any,
        mobile_crop: result.mobile_crop as any
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error expanding category image:', error)
    return NextResponse.json(
      { error: 'Failed to expand category image', details: error.message },
      { status: 500 }
    )
  }
}



