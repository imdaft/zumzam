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
    const program = await prisma.master_class_programs.findUnique({
      where: { id },
    })

    if (!program) {
      return NextResponse.json({ error: 'Master class program not found' }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (error: any) {
    logger.error('[Master Class Programs API] GET by ID error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch master class program' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    // Проверяем, что программа принадлежит профилю пользователя
    const existingProgram = await prisma.master_class_programs.findUnique({
      where: { id },
      select: { profile_id: true },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!existingProgram) {
      return NextResponse.json({ error: 'Master class program not found' }, { status: 404 })
    }

    if (!isAdmin && existingProgram.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Access denied: Program does not belong to your profile' }, { status: 403 })
    }

    const body = await request.json()
    const { profile_id, title, description, price, duration_minutes, age_min, age_max, photos, video_url, categories, is_active } = body

    const updatedProgram = await prisma.master_class_programs.update({
      where: { id },
      data: {
        title,
        description,
        price,
        duration_minutes,
        age_min,
        age_max,
        photos: photos || [],
        video_url,
        categories: categories || [],
        active: is_active ?? true,
        updated_at: new Date(),
      },
    })

    logger.info('[Master Class Programs API] Updated:', id)
    return NextResponse.json(updatedProgram)
  } catch (error: any) {
    logger.error('[Master Class Programs API] PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update master class program' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    // Проверяем, что программа принадлежит профилю пользователя
    const existingProgram = await prisma.master_class_programs.findUnique({
      where: { id },
      select: { profile_id: true },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!existingProgram) {
      return NextResponse.json({ error: 'Master class program not found' }, { status: 404 })
    }

    if (!isAdmin && existingProgram.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Access denied: Program does not belong to your profile' }, { status: 403 })
    }

    await prisma.master_class_programs.delete({
      where: { id },
    })

    logger.info('[Master Class Programs API] Deleted:', id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Master Class Programs API] DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete master class program' }, { status: 500 })
  }
}


    // Проверяем, что программа принадлежит профилю пользователя
    const existingProgram = await prisma.master_class_programs.findUnique({
      where: { id },
      select: { profile_id: true },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!existingProgram) {
      return NextResponse.json({ error: 'Master class program not found' }, { status: 404 })
    }

    if (!isAdmin && existingProgram.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Access denied: Program does not belong to your profile' }, { status: 403 })
    }

    await prisma.master_class_programs.delete({
      where: { id },
    })

    logger.info('[Master Class Programs API] Deleted:', id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Master Class Programs API] DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete master class program' }, { status: 500 })
  }
}
