import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

// GET /api/folders — получить все папки пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем папки пользователя
    const folders = await prisma.folders.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    return NextResponse.json({ folders: folders || [] })
  } catch (error: any) {
    logger.error('[API Folders] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// POST /api/folders — создать папку
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, icon } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название папки обязательно' }, { status: 400 })
    }

    const folder = await prisma.folders.create({
      data: {
        user_id: userId,
        name: name.trim(),
        color: color || null,
        icon: icon || null,
      },
    })

    logger.info('[API Folders] Created:', folder.id)
    return NextResponse.json({ folder })
  } catch (error: any) {
    logger.error('[API Folders] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
