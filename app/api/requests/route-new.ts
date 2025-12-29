import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import {
  type ClientType,
  type RequestCategory,
  type VenueType,
  type ContactMethod,
  type ContactTime,
} from '@/lib/types/order-request'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zumzam.ru'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

// POST /api/requests — создание новой заявки
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.sub

    const body = await request.json()

    // Валидация обязательных полей
    if (!body.category || !body.eventDate) {
      return NextResponse.json(
        { error: 'Не указана категория или дата мероприятия' },
        { status: 400 }
      )
    }

    if (!body.clientType) {
      return NextResponse.json(
        { error: 'Не указан тип заказчика' },
        { status: 400 }
      )
    }

    // TODO: Проверка блокировки пользователя (упрощено, можно добавить позже)
    // const isBlocked = await checkUserBlocked(userId, body.contactPhone)

    // Генерируем заголовок если не передан
    const title = body.title || generateTitle(body)

    // Определяем срочность (< 3 дней)
    const eventDate = new Date(body.eventDate)
    const today = new Date()
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isUrgent = body.isUrgent || diffDays <= 3

    // Получаем тариф размещения (если указан)
    let listingPlan = null
    let pinnedUntil = null
    let priorityScore = 0
    let highlightColor = null

    if (body.listingPlanId) {
      // TODO: Проверить, существует ли таблица board_listing_plans
      // Пока пропускаем
      /*
      const plan = await prisma.board_listing_plans.findUnique({
        where: { id: body.listingPlanId, is_active: true }
      })

      if (plan) {
        listingPlan = plan
        priorityScore = plan.priority_boost || 0
        highlightColor = plan.highlight_color

        if (plan.pin_days > 0) {
          const pinDate = new Date()
          pinDate.setDate(pinDate.getDate() + plan.pin_days)
          pinnedUntil = pinDate.toISOString()
        }
      }
      */
    }

    // Создаём заявку
    const data = await prisma.order_requests.create({
      data: {
        client_id: userId,
        
        // Тип заказчика
        client_type: body.clientType as ClientType,
        client_name: body.contactName,
        company_name: body.companyName,
        
        // Категория
        category: body.category as RequestCategory,
        title,
        description: body.description,
        
        // Когда
        event_date: body.eventDate,
        event_time: body.eventTime,
        duration_minutes: body.durationMinutes,
        
        // Где
        city: body.city || 'Санкт-Петербург',
        district: body.district,
        address: body.address,
        metro: body.metro,
        venue_type: body.venueType as VenueType,
        
        // Дети
        children_count: body.childrenCount,
        children_age_from: body.childrenAgeFrom,
        children_age_to: body.childrenAgeTo,
        birthday_child_name: body.birthdayChild?.name,
        birthday_child_age: body.birthdayChild?.age,
        adults_count: body.adultsCount,
        
        // Бюджет
        budget: body.budget,
        budget_negotiable: body.budgetNegotiable || false,
        payment_type: body.paymentType || 'any',
        
        // Специфика
        details: body.details || {},
        
        // Контакт
        contact_name: body.contactName,
        contact_phone: body.contactPhone,
        contact_method: (body.contactMethod || 'chat') as ContactMethod,
        preferred_contact_time: body.preferredContactTime as ContactTime,
        
        // Статус
        is_urgent: isUrgent,
        status: 'active',

        // Тариф размещения
        listing_plan_id: body.listingPlanId || null,
        listing_paid_at: body.listingPlanId ? new Date() : null,
        pinned_until: pinnedUntil,
        priority_score: priorityScore,
        highlight_color: highlightColor,
      }
    })

    // Асинхронно отправляем уведомления подписчикам
    if (INTERNAL_API_KEY) {
      // Уведомляем подписчиков
      fetch(`${SITE_URL}/api/board-subscriptions/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': INTERNAL_API_KEY,
        },
        body: JSON.stringify({ requestId: data.id }),
      }).catch(err => logger.error('[API Requests] Failed to notify subscribers', { error: err }))

      // Публикуем в Telegram (если тариф позволяет)
      if (listingPlan?.publish_to_telegram) {
        fetch(`${SITE_URL}/api/telegram/publish-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY,
          },
          body: JSON.stringify({ requestId: data.id }),
        }).catch(err => logger.error('[API Requests] Failed to publish to Telegram', { error: err }))
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[API Requests] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET /api/requests — получение списка заявок
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Параметры фильтрации
    const category = searchParams.get('category')
    const clientType = searchParams.get('clientType')
    const city = searchParams.get('city')
    const district = searchParams.get('district')
    const status = searchParams.get('status') || 'active'
    const urgent = searchParams.get('urgent')
    const my = searchParams.get('my') // Только мои заявки
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Проверяем авторизацию для получения "моих" заявок
    let userId: string | null = null
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        userId = payload.sub
      }
    }

    // Формируем фильтры
    const where: any = {}

    if (my === 'true' && userId) {
      where.client_id = userId
    } else {
      where.status = status
    }

    if (category) {
      where.category = category
    }
    if (clientType) {
      where.client_type = clientType
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (district) {
      where.district = { contains: district, mode: 'insensitive' }
    }
    if (urgent === 'true') {
      where.is_urgent = true
    }

    // Определяем сортировку
    let orderBy: any = { created_at: 'desc' }
    if (my !== 'true') {
      // Для публичной ленты - сложная сортировка
      // Prisma не поддерживает сортировку по вычисляемым полям напрямую,
      // поэтому делаем упрощённую версию
      orderBy = [
        { priority_score: 'desc' },
        { created_at: 'desc' }
      ]
    }

    // Получаем заявки
    const [data, count] = await Promise.all([
      prisma.order_requests.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.order_requests.count({ where })
    ])

    // Добавляем флаг isPinned для UI
    const now = new Date()
    const requestsWithPinned = data.map(req => ({
      ...req,
      isPinned: req.pinned_until && new Date(req.pinned_until) > now,
    }))

    return NextResponse.json({
      requests: requestsWithPinned,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[API Requests] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Генерация заголовка на основе данных
function generateTitle(body: Record<string, any>): string {
  const categoryLabels: Record<string, string> = {
    animator: 'Аниматор',
    show: 'Шоу-программа',
    quest: 'Квест',
    masterclass: 'Мастер-класс',
    host: 'Ведущий',
    photo_video: 'Фото/Видео',
    santa: 'Дед Мороз',
    face_painting: 'Аквагрим',
    costume: 'Ростовая кукла',
    other: 'Услуга',
  }

  const clientTypeLabels: Record<string, string> = {
    parent: '',
    venue: '(площадка)',
    organizer: '(организатор)',
    colleague: '(подмена)',
  }

  const category = categoryLabels[body.category] || 'Услуга'
  const clientSuffix = clientTypeLabels[body.clientType] || ''
  
  // Если есть описание — берём первые слова
  if (body.description) {
    const firstWords = body.description.split(' ').slice(0, 5).join(' ')
    if (firstWords.length > 10) {
      return firstWords + '...'
    }
  }

  // Если есть именинник
  if (body.birthdayChild?.name) {
    return `${category} на день рождения ${body.birthdayChild.name}`
  }

  // Для коллег — подмена
  if (body.clientType === 'colleague') {
    return `${category} — нужна подмена`
  }

  // Для площадок и организаторов
  if (body.clientType === 'venue' || body.clientType === 'organizer') {
    return `${category} ${clientSuffix}`
  }

  // Простой заголовок
  return `${category} на праздник`
}

import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import {
  type ClientType,
  type RequestCategory,
  type VenueType,
  type ContactMethod,
  type ContactTime,
} from '@/lib/types/order-request'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zumzam.ru'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

// POST /api/requests — создание новой заявки
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.sub

    const body = await request.json()

    // Валидация обязательных полей
    if (!body.category || !body.eventDate) {
      return NextResponse.json(
        { error: 'Не указана категория или дата мероприятия' },
        { status: 400 }
      )
    }

    if (!body.clientType) {
      return NextResponse.json(
        { error: 'Не указан тип заказчика' },
        { status: 400 }
      )
    }

    // TODO: Проверка блокировки пользователя (упрощено, можно добавить позже)
    // const isBlocked = await checkUserBlocked(userId, body.contactPhone)

    // Генерируем заголовок если не передан
    const title = body.title || generateTitle(body)

    // Определяем срочность (< 3 дней)
    const eventDate = new Date(body.eventDate)
    const today = new Date()
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isUrgent = body.isUrgent || diffDays <= 3

    // Получаем тариф размещения (если указан)
    let listingPlan = null
    let pinnedUntil = null
    let priorityScore = 0
    let highlightColor = null

    if (body.listingPlanId) {
      // TODO: Проверить, существует ли таблица board_listing_plans
      // Пока пропускаем
      /*
      const plan = await prisma.board_listing_plans.findUnique({
        where: { id: body.listingPlanId, is_active: true }
      })

      if (plan) {
        listingPlan = plan
        priorityScore = plan.priority_boost || 0
        highlightColor = plan.highlight_color

        if (plan.pin_days > 0) {
          const pinDate = new Date()
          pinDate.setDate(pinDate.getDate() + plan.pin_days)
          pinnedUntil = pinDate.toISOString()
        }
      }
      */
    }

    // Создаём заявку
    const data = await prisma.order_requests.create({
      data: {
        client_id: userId,
        
        // Тип заказчика
        client_type: body.clientType as ClientType,
        client_name: body.contactName,
        company_name: body.companyName,
        
        // Категория
        category: body.category as RequestCategory,
        title,
        description: body.description,
        
        // Когда
        event_date: body.eventDate,
        event_time: body.eventTime,
        duration_minutes: body.durationMinutes,
        
        // Где
        city: body.city || 'Санкт-Петербург',
        district: body.district,
        address: body.address,
        metro: body.metro,
        venue_type: body.venueType as VenueType,
        
        // Дети
        children_count: body.childrenCount,
        children_age_from: body.childrenAgeFrom,
        children_age_to: body.childrenAgeTo,
        birthday_child_name: body.birthdayChild?.name,
        birthday_child_age: body.birthdayChild?.age,
        adults_count: body.adultsCount,
        
        // Бюджет
        budget: body.budget,
        budget_negotiable: body.budgetNegotiable || false,
        payment_type: body.paymentType || 'any',
        
        // Специфика
        details: body.details || {},
        
        // Контакт
        contact_name: body.contactName,
        contact_phone: body.contactPhone,
        contact_method: (body.contactMethod || 'chat') as ContactMethod,
        preferred_contact_time: body.preferredContactTime as ContactTime,
        
        // Статус
        is_urgent: isUrgent,
        status: 'active',

        // Тариф размещения
        listing_plan_id: body.listingPlanId || null,
        listing_paid_at: body.listingPlanId ? new Date() : null,
        pinned_until: pinnedUntil,
        priority_score: priorityScore,
        highlight_color: highlightColor,
      }
    })

    // Асинхронно отправляем уведомления подписчикам
    if (INTERNAL_API_KEY) {
      // Уведомляем подписчиков
      fetch(`${SITE_URL}/api/board-subscriptions/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': INTERNAL_API_KEY,
        },
        body: JSON.stringify({ requestId: data.id }),
      }).catch(err => logger.error('[API Requests] Failed to notify subscribers', { error: err }))

      // Публикуем в Telegram (если тариф позволяет)
      if (listingPlan?.publish_to_telegram) {
        fetch(`${SITE_URL}/api/telegram/publish-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': INTERNAL_API_KEY,
          },
          body: JSON.stringify({ requestId: data.id }),
        }).catch(err => logger.error('[API Requests] Failed to publish to Telegram', { error: err }))
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[API Requests] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET /api/requests — получение списка заявок
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Параметры фильтрации
    const category = searchParams.get('category')
    const clientType = searchParams.get('clientType')
    const city = searchParams.get('city')
    const district = searchParams.get('district')
    const status = searchParams.get('status') || 'active'
    const urgent = searchParams.get('urgent')
    const my = searchParams.get('my') // Только мои заявки
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Проверяем авторизацию для получения "моих" заявок
    let userId: string | null = null
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        userId = payload.sub
      }
    }

    // Формируем фильтры
    const where: any = {}

    if (my === 'true' && userId) {
      where.client_id = userId
    } else {
      where.status = status
    }

    if (category) {
      where.category = category
    }
    if (clientType) {
      where.client_type = clientType
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (district) {
      where.district = { contains: district, mode: 'insensitive' }
    }
    if (urgent === 'true') {
      where.is_urgent = true
    }

    // Определяем сортировку
    let orderBy: any = { created_at: 'desc' }
    if (my !== 'true') {
      // Для публичной ленты - сложная сортировка
      // Prisma не поддерживает сортировку по вычисляемым полям напрямую,
      // поэтому делаем упрощённую версию
      orderBy = [
        { priority_score: 'desc' },
        { created_at: 'desc' }
      ]
    }

    // Получаем заявки
    const [data, count] = await Promise.all([
      prisma.order_requests.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.order_requests.count({ where })
    ])

    // Добавляем флаг isPinned для UI
    const now = new Date()
    const requestsWithPinned = data.map(req => ({
      ...req,
      isPinned: req.pinned_until && new Date(req.pinned_until) > now,
    }))

    return NextResponse.json({
      requests: requestsWithPinned,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[API Requests] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Генерация заголовка на основе данных
function generateTitle(body: Record<string, any>): string {
  const categoryLabels: Record<string, string> = {
    animator: 'Аниматор',
    show: 'Шоу-программа',
    quest: 'Квест',
    masterclass: 'Мастер-класс',
    host: 'Ведущий',
    photo_video: 'Фото/Видео',
    santa: 'Дед Мороз',
    face_painting: 'Аквагрим',
    costume: 'Ростовая кукла',
    other: 'Услуга',
  }

  const clientTypeLabels: Record<string, string> = {
    parent: '',
    venue: '(площадка)',
    organizer: '(организатор)',
    colleague: '(подмена)',
  }

  const category = categoryLabels[body.category] || 'Услуга'
  const clientSuffix = clientTypeLabels[body.clientType] || ''
  
  // Если есть описание — берём первые слова
  if (body.description) {
    const firstWords = body.description.split(' ').slice(0, 5).join(' ')
    if (firstWords.length > 10) {
      return firstWords + '...'
    }
  }

  // Если есть именинник
  if (body.birthdayChild?.name) {
    return `${category} на день рождения ${body.birthdayChild.name}`
  }

  // Для коллег — подмена
  if (body.clientType === 'colleague') {
    return `${category} — нужна подмена`
  }

  // Для площадок и организаторов
  if (body.clientType === 'venue' || body.clientType === 'organizer') {
    return `${category} ${clientSuffix}`
  }

  // Простой заголовок
  return `${category} на праздник`
}




