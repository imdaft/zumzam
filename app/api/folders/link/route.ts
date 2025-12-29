import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

// POST /api/folders/link — добавить/удалить диалог из папки
// action: 'add' | 'remove'
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { folderId, conversationId, action } = body

    if (!folderId || !conversationId || !action) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 })
    }

    // Проверяем что папка принадлежит пользователю
    const folder = await prisma.folders.findUnique({
      where: { id: folderId },
      select: { user_id: true },
    })

    if (!folder || folder.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'add') {
      // Добавляем связь (используем upsert для избежания дубликатов)
      try {
        await prisma.folder_items.upsert({
          where: {
            folder_id_conversation_id: {
              folder_id: folderId,
              conversation_id: conversationId,
            },
          },
          update: {}, // Если уже есть, не обновляем
          create: {
            folder_id: folderId,
            conversation_id: conversationId,
          },
        })
      } catch (error: any) {
        // Если уже существует, игнорируем
        if (error.code === 'P2002') {
          return NextResponse.json({ success: true, message: 'Already exists' })
        }
        throw error
      }
    } else if (action === 'remove') {
      // Удаляем связь
      await prisma.folder_items.deleteMany({
        where: {
          folder_id: folderId,
          conversation_id: conversationId,
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[API Folders Link] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
