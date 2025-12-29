import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

/**
 * POST /api/upload - Загрузка файлов
 * Временное решение: сохраняем в public/uploads
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

    const userId = payload.sub

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'services'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Генерируем имя файла
    const fileExt = file.name.split('.').pop()
    const randomName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Путь для сохранения
    const uploadDir = join(process.cwd(), 'public', 'uploads', bucket)
    const filePath = join(uploadDir, randomName)
    
    // Создаём директорию если не существует
    await mkdir(uploadDir, { recursive: true })
    
    // Конвертируем File в Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Сохраняем файл
    await writeFile(filePath, buffer)
    
    // URL для доступа к файлу
    const publicUrl = `/uploads/${bucket}/${randomName}`

    console.log('[Upload API] ✅ Файл сохранён локально:', publicUrl)

    return NextResponse.json({ 
      url: publicUrl,
      filename: file.name,
      size: file.size
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
