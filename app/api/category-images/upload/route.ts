import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/category-images/upload - загрузка изображения категории
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

    const formData = await request.formData()
    const category_id = formData.get('category_id') as string
    const file = formData.get('image') as File
    const device = formData.get('device') as string // 'desktop' | 'mobile' | 'original'

    if (!category_id || !file || !device) {
      return NextResponse.json(
        { error: 'category_id, image file, and device are required' },
        { status: 400 }
      )
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max size is 10MB' },
        { status: 400 }
      )
    }

    // TODO: Реализовать загрузку файлов (Cloudflare R2, AWS S3, или локальное хранилище)
    // Временная заглушка
    const filename = `${category_id}/${device}-${Date.now()}.jpg`
    const imageUrl = `/uploads/category-images/${filename}`

    // Обновить запись в БД
    const updateData: any = {}
    if (device === 'desktop') {
      updateData.desktop_image_url = imageUrl
    } else if (device === 'mobile') {
      updateData.mobile_image_url = imageUrl
    } else if (device === 'original') {
      updateData.original_image_url = imageUrl
    }
    updateData.updated_at = new Date()

    await prisma.category_images.upsert({
      where: { category_id },
      update: updateData,
      create: {
        category_id,
        ...updateData
      }
    })

    return NextResponse.json({
      url: imageUrl,
      device,
      category_id,
      message: 'File upload is in development. Need to implement storage solution.'
    })
  } catch (error: any) {
    console.error('Error uploading category image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    )
  }
}

