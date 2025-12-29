/**
 * API для управления конкретной воронкой
 * GET - получить воронку
 * PATCH - обновить воронку
 * DELETE - удалить воронку
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const pipeline = await prisma.pipelines.findUnique({
      where: { id },
      include: {
        pipeline_stages: {
          orderBy: { position: 'asc' }
        },
        profiles: {
          select: {
            id: true,
            display_name: true
          }
        }
      }
    })

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 })
    }

    // Форматируем ответ для совместимости с фронтендом
    const formattedPipeline = {
      ...pipeline,
      stages: pipeline.pipeline_stages,
      profile: pipeline.profiles
    }

    return NextResponse.json({ pipeline: formattedPipeline })
  } catch (error: any) {
    console.error('Pipeline GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, card_settings } = body

    const updateData: any = {
      updated_at: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (card_settings !== undefined) updateData.card_settings = card_settings

    const pipeline = await prisma.pipelines.update({
      where: { id },
      data: updateData,
      include: {
        pipeline_stages: {
          orderBy: { position: 'asc' }
        }
      }
    })

    // Форматируем ответ для совместимости с фронтендом
    const formattedPipeline = {
      ...pipeline,
      stages: pipeline.pipeline_stages
    }

    return NextResponse.json({ pipeline: formattedPipeline })
  } catch (error: any) {
    console.error('Pipeline PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем, не является ли воронка дефолтной
    const pipeline = await prisma.pipelines.findUnique({
      where: { id },
      select: { is_default: true }
    })

    if (pipeline?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default pipeline' },
        { status: 400 }
      )
    }

    await prisma.pipelines.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Pipeline DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
