import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { NextResponse } from 'next/server'

/**
 * PUT /api/geography/[id]
 * Обновление географической зоны
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    const body = await request.json()
    const { area_name, price_modifier, travel_time } = body

    if (!area_name) {
      return NextResponse.json(
        { error: 'Area name is required' },
        { status: 400 }
      )
    }

    // Получаем существующую зону
    const existingArea = await prisma.work_geography.findUnique({
      where: { id: params.id },
      include: {
        profiles: {
          select: { user_id: true }
        }
      }
    })

    if (!existingArea) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }

    // Получаем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    const ownerId = existingArea.profiles?.user_id

    // Проверяем права доступа
    if (ownerId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Обновляем зону
    const updatedArea = await prisma.work_geography.update({
      where: { id: params.id },
      data: {
        area_name,
        ...(price_modifier !== undefined && { price_modifier }),
        ...(travel_time !== undefined && { travel_time }),
        updated_at: new Date()
      }
    })

    return NextResponse.json({ area: updatedArea })
  } catch (error: any) {
    console.error('Error updating geography:', error)
    return NextResponse.json(
      { error: 'Failed to update area', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/geography/[id]
 * Удаление географической зоны
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Получаем существующую зону
    const existingArea = await prisma.work_geography.findUnique({
      where: { id: params.id },
      include: {
        profiles: {
          select: { user_id: true }
        }
      }
    })

    if (!existingArea) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 })
    }

    // Получаем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    const ownerId = existingArea.profiles?.user_id

    // Проверяем права доступа
    if (ownerId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем зону
    await prisma.work_geography.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting geography:', error)
    return NextResponse.json(
      { error: 'Failed to delete area', details: error.message },
      { status: 500 }
    )
  }
}
