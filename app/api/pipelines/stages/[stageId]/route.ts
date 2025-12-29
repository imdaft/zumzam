/**
 * API для управления конкретным этапом
 * PATCH - обновить этап
 * DELETE - удалить этап
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  try {
    const { stageId } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, position } = body

    // Проверяем, не системный ли этап
    const currentStage = await prisma.pipeline_stages.findUnique({
      where: { id: stageId },
      select: { is_system: true, name: true }
    })

    if (currentStage?.is_system && name && name !== currentStage.name) {
      return NextResponse.json(
        { error: 'Cannot rename system stage' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (color !== undefined) updateData.color = color
    if (position !== undefined) updateData.position = position

    const stage = await prisma.pipeline_stages.update({
      where: { id: stageId },
      data: updateData
    })

    return NextResponse.json({ stage })
  } catch (error: any) {
    console.error('Stage PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  try {
    const { stageId } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем, не системный ли этап
    const stage = await prisma.pipeline_stages.findUnique({
      where: { id: stageId },
      select: { is_system: true }
    })

    if (stage?.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system stage' },
        { status: 400 }
      )
    }

    await prisma.pipeline_stages.delete({
      where: { id: stageId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Stage DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
