import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id') || searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    const locations = await prisma.profile_locations.findMany({
      where: {
        profile_id: profileId,
        active: true
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ locations })
  } catch (error: any) {
    logger.error('[Profile Locations API] GET error:', error)
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

    if (!body.profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    // Проверяем права доступа
    const profile = await prisma.profiles.findUnique({
      where: { id: body.profile_id },
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

    const location = await prisma.profile_locations.create({
      data: body
    })

    logger.info('[Profile Locations API] Created:', location.id)
    return NextResponse.json({ location }, { status: 201 })
  } catch (error: any) {
    logger.error('[Profile Locations API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
