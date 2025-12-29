import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

// POST /api/user/views - отметить раздел как просмотренный
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
    }

    const body = await request.json()
    const { section } = body

    if (!section) {
      return NextResponse.json({ error: 'Укажите раздел' }, { status: 400 })
    }

    // Upsert просмотра раздела
    await prisma.user_section_views.upsert({
      where: {
        user_id_section: {
          user_id: userId,
          section,
        },
      },
      update: {
        last_viewed_at: new Date(),
      },
      create: {
        user_id: userId,
        section,
        last_viewed_at: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[API Views] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// GET /api/user/views - получить время последних просмотров
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
    }

    const views = await prisma.user_section_views.findMany({
      where: {
        user_id: userId,
      },
      select: {
        section: true,
        last_viewed_at: true,
      },
    })

    // Преобразуем в объект
    const viewsMap: Record<string, string> = {}
    views.forEach((view) => {
      if (view.last_viewed_at) {
        viewsMap[view.section] = view.last_viewed_at.toISOString()
      }
    })

    return NextResponse.json(viewsMap)
  } catch (error: any) {
    logger.error('[API Views GET] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
