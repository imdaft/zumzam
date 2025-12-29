import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

// DELETE /api/folders/[id] — удалить папку
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем что папка принадлежит пользователю
    const folder = await prisma.folders.findUnique({
      where: { id },
      select: { user_id: true },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Папка не найдена' }, { status: 404 })
    }

    if (folder.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем папку (связи удалятся каскадно благодаря FK)
    await prisma.folders.delete({
      where: { id },
    })

    logger.info('[API Folders] Deleted:', id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[API Folders] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
