/**
 * API для управления корзиной
 * GET /api/cart - получить корзину пользователя
 * POST /api/cart - добавить товар в корзину
 * DELETE /api/cart - очистить корзину
 */

import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { AddToCartInput } from '@/types'

/**
 * GET /api/cart - Получить корзину текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Получаем корзину с полной информацией об услугах и профилях
      const items = await prisma.cart.findMany({
        where: {
          user_id: userId,
        },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              service_type: true,
              is_package: true,
              photos: true,
              images: true,
              profile_id: true,
            },
          },
          profiles: {
            select: {
              id: true,
              display_name: true,
              slug: true,
              city: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      })

      // Трансформируем для соответствия типу CartItem
      const mappedItems = (items || []).map(item => {
        const service = item.services ? {
          ...item.services,
          title: item.services.name,
          images: item.services.images?.length ? item.services.images : item.services.photos
        } : null

        const mapped = {
          ...item,
          price_snapshot: Number(item.price),
          service,
          profile: item.profiles
        }

        // Удаляем лишние поля
        delete (mapped as any).services
        delete (mapped as any).profiles
        delete (mapped as any).price

        return mapped
      })

      return NextResponse.json({ items: mappedItems })
    } catch (error: any) {
      // Если таблица не существует, возвращаем пустую корзину
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        logger.warn('[Cart API] Cart table does not exist yet. Returning empty cart.')
        return NextResponse.json({ items: [], warning: 'Cart table not created yet' })
      }
      throw error
    }
  } catch (error: any) {
    logger.error('[Cart API] GET error:', error)
    
    // Если таблица не существует, возвращаем пустую корзину вместо ошибки
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return NextResponse.json({ items: [], warning: 'Cart table not created yet' })
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cart - Добавить товар в корзину
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: AddToCartInput = await request.json()
    const { service_id, profile_id, quantity = 1, notes, custom_price } = body

    // Валидация
    if (!service_id || !profile_id) {
      return NextResponse.json(
        { error: 'service_id and profile_id are required' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Проверяем, что услуга существует и активна
    const service = await prisma.services.findUnique({
      where: { id: service_id },
      select: {
        id: true,
        profile_id: true,
        price: true,
        is_active: true,
        name: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!service.is_active) {
      return NextResponse.json(
        { error: 'Service is not active' },
        { status: 400 }
      )
    }

    // Проверяем, что profile_id совпадает
    if (service.profile_id !== profile_id) {
      return NextResponse.json(
        { error: 'Service does not belong to this profile' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли товары от ДРУГОГО профиля
    const otherProfileItem = await prisma.cart.findFirst({
      where: {
        user_id: userId,
        profile_id: {
          not: profile_id,
        },
      },
      include: {
        profiles: {
          select: {
            display_name: true,
          },
        },
      },
    })

    if (otherProfileItem) {
      const profileName = otherProfileItem.profiles?.display_name || 'другого исполнителя'
      
      return NextResponse.json({
        error: 'Conflict',
        message: `В корзине уже есть услуги от "${profileName}". Очистить корзину перед добавлением?`,
        code: 'DIFFERENT_PROFILE_EXISTS',
        current_profile_name: profileName
      }, { status: 409 })
    }

    // Проверяем, есть ли уже этот товар с такими же notes в корзине
    const existingItem = await prisma.cart.findFirst({
      where: {
        user_id: userId,
        service_id: service_id,
        notes: notes || '',
      },
    })

    let cartItem

    if (existingItem) {
      // Обновляем количество существующего товара
      cartItem = await prisma.cart.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          notes: notes || existingItem.notes,
          updated_at: new Date(),
        },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              service_type: true,
              is_package: true,
              photos: true,
              images: true,
              profile_id: true,
            },
          },
          profiles: {
            select: {
              id: true,
              display_name: true,
              slug: true,
              city: true,
            },
          },
        },
      })
    } else {
      // Добавляем новый товар в корзину
      cartItem = await prisma.cart.create({
        data: {
          user_id: userId,
          service_id,
          profile_id,
          quantity,
          price: custom_price || service.price, // Используем custom_price если передан
          notes: notes || null,
        },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              service_type: true,
              is_package: true,
              photos: true,
              images: true,
              profile_id: true,
            },
          },
          profiles: {
            select: {
              id: true,
              display_name: true,
              slug: true,
              city: true,
            },
          },
        },
      })
    }

    // Трансформируем для соответствия типу CartItem
    const mappedService = cartItem.services ? {
      ...cartItem.services,
      title: cartItem.services.name,
      images: cartItem.services.images?.length ? cartItem.services.images : cartItem.services.photos
    } : null

    const mappedItem = {
      ...cartItem,
      price_snapshot: Number(cartItem.price),
      service: mappedService,
      profile: cartItem.profiles
    }

    // Удаляем лишние поля
    delete (mappedItem as any).services
    delete (mappedItem as any).profiles
    delete (mappedItem as any).price

    return NextResponse.json({
      item: mappedItem,
      message: existingItem 
        ? 'Количество обновлено' 
        : `"${service.name}" добавлено в корзину`,
    }, { status: existingItem ? 200 : 201 })
  } catch (error: any) {
    logger.error('[Cart API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cart - Очистить всю корзину
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Удаляем все товары из корзины пользователя
    await prisma.cart.deleteMany({
      where: {
        user_id: userId,
      },
    })

    return NextResponse.json({ message: 'Cart cleared successfully' })
  } catch (error: any) {
    logger.error('[Cart API] DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
