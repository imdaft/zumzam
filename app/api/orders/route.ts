import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

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
 * Трансформирует заказ из БД в формат для фронтенда
 * Объединяет данные из orders, order_requests и users
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
        
        logger.info('[mapOrderToFrontend] Parsing items:', {
          detailsType: typeof request.details,
          isArray: Array.isArray(details),
          itemsCount: Array.isArray(details) ? details.length : 0,
          firstItem: Array.isArray(details) && details[0] ? details[0] : null
        })
        
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
          
          logger.info('[mapOrderToFrontend] Items mapped:', {
            count: items.length,
            firstMapped: items[0]
          })
        }
      } catch (e) {
        logger.error('[mapOrderToFrontend] Failed to parse order items:', e)
        items = []
      }
    } else {
      logger.warn('[mapOrderToFrontend] No order_requests.details found')
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
 * GET /api/orders - Получить список заказов
 */
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
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'provider' или 'client'
    const profile_id = searchParams.get('profile_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    // Фильтры
    const where: any = {}
    
    if (role === 'provider') {
      // Исполнитель видит заказы на свои профили
      const userProfiles = await prisma.profiles.findMany({
        where: { user_id: userId },
        select: { id: true }
      })
      const profileIds = userProfiles.map(p => p.id)
      
      if (profileIds.length === 0) {
        // Нет профилей - нет заказов
        return NextResponse.json({
          orders: [],
          total: 0,
          limit,
          offset
        })
      }
      
      where.profile_id = { in: profileIds }
    } else if (role === 'client') {
      // Клиент видит только свои заказы
      where.client_id = userId
    } else if (!isAdmin) {
      // Обычный пользователь без роли видит свои заказы или заказы на свои профили
      const userProfiles = await prisma.profiles.findMany({
        where: { user_id: userId },
        select: { id: true }
      })
      const profileIds = userProfiles.map(p => p.id)

      where.OR = [
        { client_id: userId },
        ...(profileIds.length > 0 ? [{ profile_id: { in: profileIds } }] : [])
      ]
    }

    if (profile_id) {
      where.profile_id = profile_id
    }

    if (status) {
      where.status = status
    }

    // Получаем заказы
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
            }
          },
          profiles: {
            select: {
              id: true,
              slug: true,
              display_name: true,
              cover_photo: true,
              user_id: true, // Для provider_id
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
              details: true, // JSON с услугами из корзины
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.orders.count({ where })
    ])

    // Трансформируем заказы для фронтенда (маппинг полей из order_requests и users)
    const mappedOrders = orders.map(mapOrderToFrontend)

    return NextResponse.json({
      orders: mappedOrders,
      total,
      limit,
      offset
    })
  } catch (error: any) {
    logger.error('[Orders API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders - Создать новый заказ
 */
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

    const {
      profile_id,
      provider_id,
      total_amount,
      event_date,
      event_time,
      event_address,
      child_age,
      children_count,
      client_name,
      client_phone,
      client_email,
      client_message,
    } = body

    // Валидация обязательных полей
    if (!profile_id) {
      return NextResponse.json(
        { error: 'profile_id is required' },
        { status: 400 }
      )
    }

    if (!event_date || !event_time || !event_address) {
      return NextResponse.json(
        { error: 'event_date, event_time and event_address are required' },
        { status: 400 }
      )
    }

    // Проверяем, что профиль существует
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { id: true, category: true, display_name: true }
    })
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Получаем услуги из корзины для сохранения в order_request
    const cartItems = await prisma.cart.findMany({
      where: { 
        user_id: userId,
        profile_id: profile_id 
      },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            service_type: true,
          }
        }
      }
    })

    // Формируем детали заказа с услугами в формате для фронтенда
    const orderDetails = cartItems.map(item => ({
      id: item.id,
      service_id: item.service_id,
      service: {
        title: item.services?.name || 'Услуга',
        name: item.services?.name || 'Услуга',
      },
      quantity: item.quantity,
      price_snapshot: Number(item.price),
      price: Number(item.price),
      notes: item.notes,
    }))

    // Создаём order_request с полными данными из формы checkout
    const orderRequest = await prisma.order_requests.create({
      data: {
        client_id: userId,
        
        // Категория из профиля
        category: profile.category || 'animator',
        title: `Заказ у ${profile.display_name}`,
        description: client_message || '',
        
        // Когда и где
        event_date: new Date(event_date),
        event_time: event_time ? new Date(`1970-01-01T${event_time}`) : null,
        address: event_address,
        
        // Дети
        children_count: children_count || null,
        birthday_child_age: child_age || null,
        
        // Контакты
        client_name: client_name,
        contact_name: client_name,
        contact_phone: client_phone,
        
        // Город из профиля или дефолт
        city: 'Санкт-Петербург',
        
        // Статус
        status: 'active',
        client_type: 'parent',
        
        // Сохраняем детали заказа (услуги из корзины)
        details: orderDetails,
      },
    })

    logger.info('[Orders API] Order request created with items:', {
      requestId: orderRequest.id,
      itemsCount: orderDetails.length,
      detailsSample: orderDetails[0] // Показываем первый элемент для отладки
    })

    // Создаём заказ со ссылкой на order_request
    const order = await prisma.orders.create({
      data: {
        profile_id: profile_id,
        client_id: userId,
        request_id: orderRequest.id,
        status: 'pending',
        total_amount: total_amount ? parseFloat(total_amount.toString()) : null,
        event_date: new Date(event_date),
        event_time: event_time ? new Date(`1970-01-01T${event_time}`) : null,
        notes: client_message || null,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          }
        },
        profiles: {
          select: {
            id: true,
            slug: true,
            display_name: true,
            city: true,
            user_id: true, // Для provider_id
          }
        },
        order_requests: {
          select: {
            id: true,
            event_date: true,
            event_time: true,
            address: true,
            children_count: true,
            birthday_child_age: true,
            client_name: true,
            contact_phone: true,
            details: true, // JSON с услугами из корзины
          }
        }
      }
    })

    logger.info('[Orders API] Order created successfully:', {
      orderId: order.id,
      requestId: orderRequest.id,
      profileId: profile_id,
      clientId: userId,
      totalAmount: total_amount,
    })

    // Создаём уведомление и conversation для владельца профиля
    try {
      const profileOwner = await prisma.profiles.findUnique({
        where: { id: profile_id },
        select: { user_id: true }
      })

      if (profileOwner?.user_id && profileOwner.user_id !== userId) {
        // Форматируем дату и время для уведомления
        const eventDateFormatted = event_date ? format(new Date(event_date), 'd MMMM', { locale: ru }) : 'дата не указана'
        const orderShortId = order.id.slice(0, 8).toUpperCase()
        const cityName = event_address?.split(',')[0]?.trim() || 'Адрес не указан'
        const amountText = total_amount ? `${Number(total_amount).toLocaleString('ru-RU')} ₽` : 'не указана'
        
        // Создаём уведомление с подробностями
        await prisma.notifications.create({
          data: {
            user_id: profileOwner.user_id,
            type: 'order',
            title: `Заявка в профиле "${profile.display_name}"`,
            message: `${client_name || 'Клиент'} • ${eventDateFormatted}${event_time ? ` в ${event_time}` : ''} • ${cityName} • ${amountText}`,
            link: `/orders/${order.id}`,
            read: false,
          }
        })
        
        // Создаём conversation для диалога по заказу
        const [p1, p2] = userId < profileOwner.user_id
          ? [userId, profileOwner.user_id]
          : [profileOwner.user_id, userId]

        await prisma.conversations.create({
          data: {
            participant_1_id: p1,
            participant_2_id: p2,
            profile_id: profile_id, // Сохраняем ID профиля для отображения аватарки
            type: 'order',
            order_id: order.id,
            title: userId === order.client_id 
              ? `Заказ у ${profile.display_name}`
              : `Заказ от ${client_name}`,
            last_message_preview: 'Диалог по заказу создан',
          }
        })
        
        logger.info('[Orders API] Notification and conversation created:', {
          ownerId: profileOwner.user_id,
          orderId: order.id
        })
      }
    } catch (notifError) {
      // Не блокируем создание заказа, если уведомление/диалог не удалось создать
      logger.error('[Orders API] Failed to create notification/conversation:', notifError)
    }

    return NextResponse.json({
      order: mapOrderToFrontend(order),
      message: 'Order created successfully'
    }, { status: 201 })
  } catch (error: any) {
    logger.error('[Orders API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
