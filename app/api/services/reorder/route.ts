import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { updates, profileId } = await request.json()

    if (!updates || !Array.isArray(updates) || !profileId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Проверяем права доступа
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { user_id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && profile.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Обновляем display_order для каждой услуги
    for (const update of updates) {
      await prisma.services.update({
        where: {
          id: update.id,
          profile_id: profileId
        },
        data: {
          display_order: update.display_order
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error in reorder route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
