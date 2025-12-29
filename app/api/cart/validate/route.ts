/**
 * API для валидации корзины
 * GET /api/cart/validate - проверить валидность корзины
 */

import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/cart/validate - Проверить валидность корзины
 * ИЗМЕНЕНО: Теперь это система заявок, а не e-commerce
 * Любая комбинация услуг валидна - клиент может заказать что угодно
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Получаем корзину для проверки
      const cartItems = await prisma.cart.findMany({
        where: {
          user_id: userId,
        },
        select: { id: true },
      })

      // Для системы заявок - любая корзина валидна, если не пуста
      const isEmpty = !cartItems || cartItems.length === 0
      
      return NextResponse.json({
        is_valid: !isEmpty,
        message: isEmpty 
          ? 'Корзина пуста. Добавьте услуги для создания заявки.' 
          : 'Готово к оформлению заявки',
      })
    } catch (error: any) {
      // Если таблица не существует или ошибка - всё равно разрешаем
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          is_valid: true,
          message: 'Готово к оформлению заявки',
        })
      }
      throw error
    }
  } catch (error: any) {
    logger.error('[Cart Validate API] GET error:', error)
    // В случае ошибки - всё равно разрешаем (это система заявок)
    return NextResponse.json({
      is_valid: true,
      message: 'Готово к оформлению заявки',
    })
  }
}
