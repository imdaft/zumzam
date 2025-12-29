import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    
    if (!profileId) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    const styles = await prisma.photography_styles.findMany({
      where: {
        profile_id: profileId,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json(styles || [])
  } catch (error: any) {
    logger.error('[Photography Styles API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profile_id, ...styleData } = body

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    const isAdmin = user?.role === 'admin'

    // Проверяем, что профиль существует и принадлежит пользователю
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { user_id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем права доступа (владелец или админ)
    if (!isAdmin && profile.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Создаём стиль
    const data = await prisma.photography_styles.create({
      data: {
        profile_id,
        ...styleData,
        is_active: true,
      },
    })

    logger.info('[Photography Styles API] Created:', data.id)
    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('[Photography Styles API] POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}




