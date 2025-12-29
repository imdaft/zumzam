import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// POST /api/advertising/upload-image - загрузка изображения для рекламы
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

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max size is 5MB' },
        { status: 400 }
      )
    }

    // TODO: Реализовать загрузку файлов (Cloudflare R2, AWS S3, или локальное хранилище)
    // Временная заглушка
    const filename = `${randomUUID()}-${file.name}`
    const url = `/uploads/advertising/${filename}`

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
      message: 'File upload is in development. Need to implement storage solution.'
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    )
  }
}

