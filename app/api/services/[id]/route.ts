import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { triggerEmbeddingRegeneration } from '@/lib/ai/trigger-embedding-regeneration'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const service = await prisma.services.findUnique({
      where: { id }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error: any) {
    logger.error('[Services API] GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем profile_id перед удалением для регенерации и проверки прав
    const service = await prisma.services.findUnique({
      where: { id },
      select: { 
        profile_id: true,
        profiles: {
          select: { user_id: true }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Проверяем права доступа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && service.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем услугу
    await prisma.services.delete({
      where: { id }
    })

    // Триггерим регенерацию embeddings
    if (service.profile_id) {
      triggerEmbeddingRegeneration(service.profile_id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Services API] DELETE error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа
    const existingService = await prisma.services.findUnique({
      where: { id },
      include: {
        profiles: {
          select: { user_id: true },
        },
      },
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    if (!isAdmin && existingService.profiles.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Поддержка name и title (title для обратной совместимости)
    const serviceName = body.name || body.title

    // Подготавливаем данные для обновления (только поля которые есть в базе)
    const updateData: any = {
      name: serviceName,
      description: body.description,
      price: body.price,
      price_type: body.price_type,
      duration_minutes: body.duration, // Маппинг duration -> duration_minutes
      images: body.images,
      details: body.details,
      service_type: body.service_type,
      is_additional: body.is_additional,
      is_package: body.is_package || false,
    }
    
    // Добавляем is_active только если оно передано
    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }

    // Обновляем услугу
    const service = await prisma.services.update({
      where: { id },
      data: updateData
    })

    // Триггерим регенерацию embeddings для профиля
    if (service.profile_id) {
      triggerEmbeddingRegeneration(service.profile_id)
    }

    return NextResponse.json({ service })
  } catch (error: any) {
    logger.error('[Services API] PATCH error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
