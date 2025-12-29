import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const location = await prisma.profile_locations.findUnique({
      where: { id },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({ location })
  } catch (error: any) {
    logger.error('[Profile Locations API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа через профиль
    const location = await prisma.profile_locations.findUnique({
      where: { id },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && location.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updatedLocation = await prisma.profile_locations.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ location: updatedLocation })
  } catch (error: any) {
    logger.error('[Profile Locations API] PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа
    const location = await prisma.profile_locations.findUnique({
      where: { id },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && location.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.profile_locations.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Profile Locations API] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
