import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

/**
 * Форматирует время из БД в строку HH:MM
 */
function formatEventTime(time: Date | string | null | undefined): string | null {
  if (!time) return null
  
  try {
    if (typeof time === 'string') {
      // Если строка "HH:MM:SS" - обрезаем секунды
      if (/^\d{2}:\d{2}:\d{2}/.test(time)) {
        return time.substring(0, 5)
      }
      return time
    }
    
    // Если Date объект - форматируем
    const date = new Date(time)
    if (isNaN(date.getTime())) return null
    
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return null
  }
}

/**
 * Маппинг заказа для фронтенда
 */
function mapOrderToFrontend(order: any) {
  try {
    const request = order.order_requests || null
    const client = order.users || null
    const profile = order.profiles || null

    // Парсим услуги из order_requests.details (JSON)
    let items: any[] = []
    if (request?.details) {
      try {
        const details = typeof request.details === 'string' 
          ? JSON.parse(request.details) 
          : request.details
        
        // Преобразуем формат корзины в формат items
        if (Array.isArray(details)) {
          items = details.map((item: any) => ({
            id: item.id,
            service_id: item.service_id,
            service_title: item.service?.title || item.service?.name || 'Услуга',
            quantity: item.quantity || 1,
            price: item.price_snapshot || item.price || 0,
            subtotal: (item.price_snapshot || item.price || 0) * (item.quantity || 1),
          }))
        }
      } catch (e) {
        logger.error('[mapOrderToFrontend] Failed to parse order items:', e)
        items = []
      }
    }

    return {
      ...order,
      // Обязательные поля для фронтенда
      total_amount: order.total_amount ? Number(order.total_amount) : 0,
      provider_id: profile?.user_id || profile?.id || '', // Добавляем provider_id
      payment_status: 'unpaid' as const, // Пока статус оплаты не реализован
      provider_internal_notes: order.provider_internal_notes || '', // Внутренние заметки
      
      // Объединяем данные из заказа и заявки
      event_date: order.event_date || request?.event_date || new Date().toISOString(),
      event_time: formatEventTime(order.event_time || request?.event_time) || '00:00',
      event_address: request?.address || request?.city || '',
      client_name: request?.client_name || client?.full_name || 'Клиент',
      client_phone: request?.contact_phone || client?.phone || '',
      client_email: client?.email || '',
      children_count: request?.children_count || 0,
      adults_count: request?.adults_count || 0,
      child_age: request?.children_age_from || undefined,
      
      // Услуги из корзины
      items: items,
      
      // Добавляем клиента и профиль в ожидаемом формате
      client: client,
      profile: profile
    }
  } catch (error) {
    logger.error('[mapOrderToFrontend] Unexpected error:', error)
    // Возвращаем минимальные данные при ошибке
    return {
      ...order,
      total_amount: order.total_amount ? Number(order.total_amount) : 0,
      provider_id: '',
      payment_status: 'unpaid' as const,
      provider_internal_notes: order.provider_internal_notes || '',
      event_date: order.event_date || new Date().toISOString(),
      event_time: '00:00',
      event_address: '',
      client_name: 'Клиент',
      client_phone: '',
      client_email: '',
      children_count: 0,
      adults_count: 0,
      items: [],
      client: null,
      profile: null
    }
  }
}

/**
 * GET /api/orders/[id] - Получить заказ по ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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

    const userId = payload.sub

    // Получаем заказ
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            avatar_url: true,
          }
        },
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            cover_photo: true,
            user_id: true,
          }
        },
        order_requests: {
          select: {
            id: true,
            title: true,
            category: true,
            event_date: true,
            event_time: true,
            client_name: true,
            contact_phone: true,
            address: true,
            city: true,
            children_count: true,
            adults_count: true,
            children_age_from: true,
            children_age_to: true,
            description: true,
            budget: true,
            details: true, // JSON с услугами из корзины
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    const isClient = order.client_id === userId
    const isProvider = order.profile_id ? await prisma.profiles.findFirst({
      where: {
        id: order.profile_id,
        user_id: userId
      }
    }) : false

    if (!isAdmin && !isClient && !isProvider) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Трансформируем заказ для фронтенда
    const mappedOrder = mapOrderToFrontend(order)

    return NextResponse.json({ order: mappedOrder })
  } catch (error: any) {
    logger.error('[Orders API] GET [id] error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/orders/[id] - Обновить заказ
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  // Объявляем переменные в начале для доступности в catch
  let id: string | undefined
  let body: any = {}
  
  try {
    const paramsResolved = await params
    id = paramsResolved.id
    
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    body = await request.json()

    // Получаем текущий заказ
    const currentOrder = await prisma.orders.findUnique({
      where: { id },
      select: {
        id: true,
        client_id: true,
        profile_id: true,
      }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'
    const isClient = currentOrder.client_id === userId
    const isProvider = currentOrder.profile_id ? await prisma.profiles.findFirst({
      where: {
        id: currentOrder.profile_id,
        user_id: userId
      }
    }) : false

    if (!isAdmin && !isClient && !isProvider) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Формируем данные для обновления
    const updateData: any = {}

    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.total_amount !== undefined) {
      updateData.total_amount = parseFloat(body.total_amount)
    }
    if (body.event_date !== undefined) {
      updateData.event_date = body.event_date ? new Date(body.event_date) : null
    }
    if (body.event_time !== undefined) {
      updateData.event_time = body.event_time ? new Date(`1970-01-01T${body.event_time}`) : null
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }
    if (body.provider_internal_notes !== undefined) {
      updateData.provider_internal_notes = body.provider_internal_notes
    }

    updateData.updated_at = new Date()

    // Обновляем заказ с полным include как в GET
    const order = await prisma.orders.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            avatar_url: true,
          }
        },
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            cover_photo: true,
            user_id: true,
          }
        },
        order_requests: {
          select: {
            id: true,
            title: true,
            category: true,
            event_date: true,
            event_time: true,
            client_name: true,
            contact_phone: true,
            address: true,
            city: true,
            children_count: true,
            adults_count: true,
            children_age_from: true,
            children_age_to: true,
            description: true,
            budget: true,
            details: true,
          }
        }
      }
    })

    // Трансформируем заказ для фронтенда (как в GET)
    const mappedOrder = mapOrderToFrontend(order)

    logger.info('[Orders API] Order updated successfully:', {
      orderId: id,
      status: body.status,
      hasOrderRequests: !!order.order_requests,
    })

    return NextResponse.json({
      order: mappedOrder,
      message: 'Order updated successfully'
    })
  } catch (error: any) {
    logger.error('[Orders API] PATCH error:', {
      orderId: id,
      error: error.message,
      stack: error.stack,
      body: body,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/orders/[id] - Удалить заказ
 * 
 * Правила удаления:
 * - Админ может удалять любые заказы
 * - Клиент может удалять только свои заказы в статусе 'pending' или 'cancelled'
 * - Исполнитель может удалять заказы в статусе 'pending', 'cancelled', 'rejected'
 * - Нельзя удалить заказ в процессе выполнения
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    const userId = payload.sub

    // Получаем пользователя и заказ
    const [user, order] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      }),
      prisma.orders.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          client_id: true,
          profile_id: true,
          profiles: {
            select: { user_id: true }
          }
        }
      })
    ])

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const isAdmin = user?.role === 'admin'
    const isClient = order.client_id === userId
    const isProvider = order.profiles?.user_id === userId

    // Проверка прав доступа
    if (!isAdmin && !isClient && !isProvider) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Защита от удаления заказов в процессе выполнения
    const activeStatuses = ['confirmed', 'in_progress']
    if (!isAdmin && activeStatuses.includes(order.status || '')) {
      return NextResponse.json({
        error: 'Невозможно удалить заказ в процессе выполнения',
        details: 'Заказ должен быть завершён, отменён или отклонён перед удалением'
      }, { status: 403 })
    }

    // Дополнительная проверка для клиента
    if (isClient && !isAdmin) {
      const allowedForClient = ['pending', 'cancelled', 'rejected']
      if (!allowedForClient.includes(order.status || '')) {
        return NextResponse.json({
          error: 'Вы можете удалить только новые, отменённые или отклонённые заказы',
          details: `Текущий статус: ${order.status}`
        }, { status: 403 })
      }
    }

    // Удаляем заказ
    await prisma.orders.delete({
      where: { id }
    })

    logger.info('[Orders API] Order deleted:', {
      orderId: id,
      deletedBy: userId,
      role: isAdmin ? 'admin' : isClient ? 'client' : 'provider',
      status: order.status
    })

    return NextResponse.json({
      message: 'Order deleted successfully'
    })
  } catch (error: any) {
    logger.error('[Orders API] DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: 500 }
    )
  }
}
