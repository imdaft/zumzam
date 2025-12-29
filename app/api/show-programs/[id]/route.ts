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
    const program = await prisma.show_programs.findUnique({
      where: { id },
    })

    if (!program) {
      return NextResponse.json({ error: 'Show program not found' }, { status: 404 })
    }

    return NextResponse.json({ program })
  } catch (error: any) {
    logger.error('[Show Programs API] GET error:', error)
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
    const program = await prisma.show_programs.findUnique({
      where: { id },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!program) {
      return NextResponse.json({ error: 'Show program not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && program.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updatedProgram = await prisma.show_programs.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ program: updatedProgram })
  } catch (error: any) {
    logger.error('[Show Programs API] PATCH error:', error)
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
    const program = await prisma.show_programs.findUnique({
      where: { id },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!program) {
      return NextResponse.json({ error: 'Show program not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && program.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.show_programs.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Show Programs API] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
