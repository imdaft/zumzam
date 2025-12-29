/**
 * API для управления отдельными элементами корзины
 * PATCH /api/cart/[id] - обновить элемент корзины (quantity, notes)
 * DELETE /api/cart/[id] - удалить элемент из корзины
 */

import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

/**
 * PATCH /api/cart/[id] - Обновить элемент корзины
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quantity, notes } = body

    // Валидация
    if (quantity !== undefined && quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Проверяем, что элемент принадлежит пользователю
    const existingItem = await prisma.cart.findUnique({
      where: { id },
      select: { id: true, user_id: true },
    })

    if (!existingItem || existingItem.user_id !== userId) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Обновляем элемент
    const updateData: any = {
      updated_at: new Date(),
    }
    
    if (quantity !== undefined) {
      updateData.quantity = quantity
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const updatedItem = await prisma.cart.update({
      where: { id },
      data: updateData,
      include: {
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            service_type: true,
            is_package: true,
            images: true,
            photos: true,
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

    // Трансформируем для соответствия типу CartItem
    const service = updatedItem.services ? {
      ...updatedItem.services,
      title: updatedItem.services.name,
      images: updatedItem.services.images?.length ? updatedItem.services.images : updatedItem.services.photos
    } : null

    const mappedItem = {
      ...updatedItem,
      price_snapshot: Number(updatedItem.price),
      service,
      profile: updatedItem.profiles
    }

    // Удаляем лишние поля
    delete (mappedItem as any).services
    delete (mappedItem as any).profiles
    delete (mappedItem as any).price

    return NextResponse.json({
      item: mappedItem,
      message: 'Cart item updated successfully',
    })
  } catch (error: any) {
    logger.error('[Cart Item API] PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cart/[id] - Удалить элемент из корзины
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем, что элемент принадлежит пользователю, и удаляем
    const existingItem = await prisma.cart.findUnique({
      where: { id },
      select: { user_id: true },
    })

    if (!existingItem || existingItem.user_id !== userId) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    await prisma.cart.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Item removed from cart successfully',
    })
  } catch (error: any) {
    logger.error('[Cart Item API] DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}
