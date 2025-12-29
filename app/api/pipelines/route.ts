/**
 * API для управления воронками продаж
 * GET - получить все воронки профиля
 * POST - создать новую воронку
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

const REQUIRED_SYSTEM_STAGES: Array<{
  system_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
  name: string
  color: string
  position: number
}> = [
  { system_status: 'pending', name: 'Входящие', color: 'orange', position: 0 },
  { system_status: 'confirmed', name: 'Забронировано', color: 'blue', position: 50 },
  { system_status: 'in_progress', name: 'В работе', color: 'yellow', position: 60 },
  { system_status: 'completed', name: 'Завершено', color: 'green', position: 100 },
  { system_status: 'cancelled', name: 'Отменено', color: 'gray', position: 101 },
  { system_status: 'rejected', name: 'Отклонено', color: 'red', position: 102 },
]

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Получаем все профили пользователя
    let profiles = await prisma.profiles.findMany({
      where: { user_id: userId },
      select: { id: true }
    })

    // Если профиль найден, но роль = 'client' → обновляем на 'provider'
    if (profiles.length > 0 && user.role === 'client') {
      await prisma.users.update({
        where: { id: userId },
        data: { role: 'provider' }
      })
    }

    // Если профиль не найден
    if (profiles.length === 0) {
      if (user.role === 'admin') {
        profiles = await prisma.profiles.findMany({
          where: { user_id: userId },
          select: { id: true },
          take: 50
        })
        
        if (profiles.length === 0) {
          return NextResponse.json({ error: 'No profiles found. Please create a profile first.' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
    }

    const profileIds = profiles.map(p => p.id)

    // Гарантируем, что у каждого профиля есть хотя бы одна воронка
    for (const profileId of profileIds) {
      const existingPipeline = await prisma.pipelines.findFirst({
        where: { profile_id: profileId }
      })

      if (existingPipeline) continue

      // Создаём дефолтную воронку
      const newPipeline = await prisma.pipelines.create({
        data: {
          profile_id: profileId,
          name: 'Основная воронка',
          description: 'Стандартная воронка для управления сделками',
          is_default: true,
        }
      })

      // Создаём дефолтные этапы
      const defaultStages = [
        { name: 'Входящие', color: 'orange', position: 0, is_system: true, system_status: 'pending' },
        { name: 'Забронировано', color: 'blue', position: 50, is_system: true, system_status: 'confirmed' },
        { name: 'В работе', color: 'yellow', position: 60, is_system: true, system_status: 'in_progress' },
        { name: 'Завершено', color: 'green', position: 100, is_system: true, system_status: 'completed' },
        { name: 'Отменено', color: 'gray', position: 101, is_system: true, system_status: 'cancelled' },
        { name: 'Отклонено', color: 'red', position: 102, is_system: true, system_status: 'rejected' },
      ]

      await prisma.pipeline_stages.createMany({
        data: defaultStages.map(stage => ({
          pipeline_id: newPipeline.id,
          ...stage,
        }))
      })
    }

    // Получаем все воронки с этапами
    const pipelines = await prisma.pipelines.findMany({
      where: {
        profile_id: { in: profileIds }
      },
      include: {
        profiles: {
          select: {
            id: true,
            display_name: true
          }
        },
        pipeline_stages: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: [
        { profile_id: 'asc' },
        { position: 'asc' }
      ]
    })

    // Гарантируем наличие всех системных этапов в каждой воронке
    for (const pipeline of pipelines) {
      const stages = pipeline.pipeline_stages || []
      const systemByStatus = new Map<string, any>()
      for (const s of stages) {
        if (s.system_status) systemByStatus.set(s.system_status, s)
      }

      // Конвертируем старый кастомный этап "В работе" → системный in_progress
      if (!systemByStatus.has('in_progress')) {
        const legacyInProgress = stages.find(
          s => !s.is_system && 
               s.name?.trim().toLowerCase() === 'в работе'
        )
        
        if (legacyInProgress) {
          await prisma.pipeline_stages.update({
            where: { id: legacyInProgress.id },
            data: {
              is_system: true,
              system_status: 'in_progress',
              position: 60,
              color: legacyInProgress.color || 'yellow',
            }
          })
          
          legacyInProgress.is_system = true
          legacyInProgress.system_status = 'in_progress'
          legacyInProgress.position = 60
        }
      }

      // Вставляем отсутствующие системные этапы
      const missing = REQUIRED_SYSTEM_STAGES.filter(req => !systemByStatus.has(req.system_status))
      if (missing.length > 0) {
        const inserted = await prisma.pipeline_stages.createManyAndReturn({
          data: missing.map(s => ({
            pipeline_id: pipeline.id,
            name: s.name,
            color: s.color,
            position: s.position,
            is_system: true,
            system_status: s.system_status,
          }))
        })

        pipeline.pipeline_stages = [...stages, ...inserted]
      }
    }

    // Форматируем ответ для совместимости с фронтендом
    const formattedPipelines = pipelines.map(pipeline => ({
      ...pipeline,
      profile: pipeline.profiles,
      stages: pipeline.pipeline_stages.sort((a, b) => a.position - b.position)
    }))

    return NextResponse.json({ pipelines: formattedPipelines })
  } catch (error: any) {
    console.error('Pipelines GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    const body = await request.json()
    const { name, description, profile_id: requestedProfileId } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    let profileId = requestedProfileId || null

    if (!profileId) {
      const profile = await prisma.profiles.findFirst({
        where: { user_id: userId },
        select: { id: true }
      })

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      profileId = profile.id
    }

    // Проверяем, что профиль принадлежит пользователю
    const ownership = await prisma.profiles.findFirst({
      where: {
        id: profileId,
        user_id: userId
      }
    })

    if (!ownership) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Создаём воронку
    const pipeline = await prisma.pipelines.create({
      data: {
        profile_id: profileId,
        name: name.trim(),
        description: description || null,
        is_default: false,
      }
    })

    // Создаём базовые этапы
    const defaultStages = [
      { name: 'Входящие', color: 'orange', position: 0, is_system: true, system_status: 'pending' },
      { name: 'Забронировано', color: 'blue', position: 50, is_system: true, system_status: 'confirmed' },
      { name: 'В работе', color: 'yellow', position: 60, is_system: true, system_status: 'in_progress' },
      { name: 'Завершено', color: 'green', position: 100, is_system: true, system_status: 'completed' },
      { name: 'Отменено', color: 'gray', position: 101, is_system: true, system_status: 'cancelled' },
      { name: 'Отклонено', color: 'red', position: 102, is_system: true, system_status: 'rejected' },
    ]

    await prisma.pipeline_stages.createMany({
      data: defaultStages.map(stage => ({
        pipeline_id: pipeline.id,
        ...stage
      }))
    })

    // Получаем полную воронку с этапами
    const fullPipeline = await prisma.pipelines.findUnique({
      where: { id: pipeline.id },
      include: {
        pipeline_stages: {
          orderBy: { position: 'asc' }
        }
      }
    })

    return NextResponse.json({ 
      pipeline: {
        ...fullPipeline,
        stages: fullPipeline?.pipeline_stages
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Pipelines POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



