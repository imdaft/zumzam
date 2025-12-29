/**
 * API для получения услуг профиля
 * GET /api/services?profile_id=...
 * POST /api/services - создание новой услуги
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { triggerEmbeddingRegeneration } from '@/lib/ai/trigger-embedding-regeneration'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id') || searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json({ error: 'profile_id or profileId is required' }, { status: 400 })
    }

    const services = await prisma.services.findMany({
      where: {
        profile_id: profileId,
        is_active: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    return NextResponse.json({ services: services || [] })
  } catch (error: any) {
    logger.error('Services API error:', error)
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

    logger.info('[Services API] POST request body:', {
      profile_id: body.profile_id,
      name: body.name || body.title,
      service_type: body.service_type,
      hasImages: body.images?.length || 0,
      hasPackageIncludes: !!body.package_includes
    })

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    if (!body.profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }
    // Поддержка и title и name (title - старое название)
    if (!body.name && !body.title) {
      return NextResponse.json({ error: 'name or title is required' }, { status: 400 })
    }
    
    // Переименовываем title в name если передан title
    if (body.title && !body.name) {
      body.name = body.title
      delete body.title
    }

    // Проверяем владение профилем (если не админ)
    if (!isAdmin) {
      const profile = await prisma.profiles.findUnique({
        where: { id: body.profile_id },
        select: { user_id: true }
      })

      if (!profile || profile.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Убираем поля, которых нет в таблице
    const { package_includes, duration, title, ...cleanBody } = body
    
    // Подготавливаем данные для создания
    const createData: any = {
      ...cleanBody,
      duration_minutes: duration, // Маппинг duration -> duration_minutes
    }
    
    // Если есть package_includes, добавляем его в details
    if (package_includes) {
      createData.details = {
        ...(createData.details || {}),
        package_includes
      }
    }

    const service = await prisma.services.create({
      data: createData
    })

    // Триггерим регенерацию embeddings для профиля
    if (service.profile_id) {
      triggerEmbeddingRegeneration(service.profile_id)
    }

    logger.info('[Services API] Created service:', service.id)
    return NextResponse.json({ service }, { status: 201 })
  } catch (error: any) {
    logger.error('[Services API] POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create service' }, { status: 500 })
  }
}
