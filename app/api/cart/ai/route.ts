import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { addToCart, removeFromCart, showCart, clearCart } from '@/lib/ai/cart-utils'

/**
 * AI Cart API - специальный endpoint для работы AI с корзиной
 * Обрабатывает команды от AI: add, remove, clear, show
 * 
 * Используется как альтернативный способ вызова функций корзины
 * (основной способ - прямой вызов из /api/ai/chat)
 */
export async function POST(request: NextRequest) {
  try {
    const { action, serviceId, notes } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Supabase client removed
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Обработка команд
    let result
    switch (action) {
      case 'add':
        result = await addToCart(userId, serviceId, notes)
        break
      
      case 'remove':
        result = await removeFromCart(userId, serviceId)
        break
      
      case 'clear':
        result = await clearCart(userId)
        break
      
      case 'show':
        result = await showCart(userId)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error: any) {
    logger.error('[AI Cart] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
