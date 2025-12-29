import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

// GET /api/requests/[id] - получить объявление
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const data = await prisma.order_requests.findUnique({
      where: { id },
      include: {
        order_responses: {
          include: {
            profiles: {
              select: {
                id: true,
                display_name: true,
                logo: true,
                category: true,
              }
            }
          }
        }
      }
    })

    if (!data) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('[API Request GET] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// PATCH /api/requests/[id] - обновить объявление
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
    }

    const existingRequest = await prisma.order_requests.findUnique({
      where: { id }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
    }

    // Проверяем владельца
    if (existingRequest.client_id !== userId) {
      return NextResponse.json({ error: 'Нет доступа к этому объявлению' }, { status: 403 })
    }

    const body = await request.json()

    // Разрешённые поля для обновления
    const allowedFields = [
      'title',
      'description',
      'event_date',
      'event_time',
      'city',
      'district',
      'budget',
      'children_count',
      'children_age_from',
      'children_age_to',
      'is_urgent',
      'status',
      'venue_type',
      'contact_name',
      'contact_phone',
      'contact_method',
      'payment_type',
    ]

    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    const updatedRequest = await prisma.order_requests.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedRequest)
  } catch (error: any) {
    logger.error('[API Request PATCH] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/requests/[id] - удалить объявление
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
    }

    const existingRequest = await prisma.order_requests.findUnique({
      where: { id },
      select: { client_id: true }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
    }

    // Проверяем, является ли пользователь админом
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    // Проверяем владельца или админа
    if (existingRequest.client_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Нет доступа к этому объявлению' }, { status: 403 })
    }

    await prisma.order_requests.delete({
      where: { id }
    })

    logger.info(`[API Request DELETE] Объявление ${id} удалено пользователем ${userId} (admin: ${isAdmin})`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[API Request DELETE] Error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
