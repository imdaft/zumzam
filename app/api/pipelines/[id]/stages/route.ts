/**
 * API для управления этапами воронки
 * POST - создать новый этап
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pipelineId } = await params
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color = 'blue', position } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Если position не указан, ставим между "Входящие" (0) и "Забронировано" (50)
    let stagePosition = position
    if (stagePosition === undefined) {
      const stages = await prisma.pipeline_stages.findMany({
        where: {
          pipeline_id: pipelineId,
          position: {
            gt: 0,
            lt: 50
          }
        },
        orderBy: {
          position: 'desc'
        },
        take: 1
      })

      if (stages.length > 0) {
        // Есть кастомные этапы - ставим после последнего
        stagePosition = Math.floor((stages[0].position! + 50) / 2)
      } else {
        // Нет кастомных - ставим в середину между 0 и 50
        stagePosition = 25
      }
    }

    const stage = await prisma.pipeline_stages.create({
      data: {
        pipeline_id: pipelineId,
        name: name.trim(),
        color,
        position: stagePosition,
        is_system: false
      }
    })

    return NextResponse.json({ stage }, { status: 201 })
  } catch (error: any) {
    console.error('Stage POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
