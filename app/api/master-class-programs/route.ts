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

    const body = await request.json()
    const { profile_id, ...programData } = body

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

    // Создаём программу
    const data = await prisma.master_class_programs.create({
      data: {
        profile_id,
        ...programData,
        active: true,
      },
    })

    logger.info('[MasterClassPrograms] Created:', data.id)
    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('[MasterClassPrograms] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    if (!profileId) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const programs = await prisma.master_class_programs.findMany({
      where: {
        profile_id: profileId,
        active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json(programs || [])
  } catch (error: any) {
    console.error('[master-class-programs/GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}





