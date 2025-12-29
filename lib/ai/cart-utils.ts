import prisma from '@/lib/prisma'

/**
 * Утилиты для работы с корзиной через AI
 * Вызываются напрямую из AI Chat API
 */

export interface CartActionResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// Добавить услугу в корзину
export async function addToCart(
  userId: string,
  serviceId: string,
  notes?: string
): Promise<CartActionResult> {
  try {
    if (!serviceId) {
      return { success: false, message: 'Service ID is required' }
    }

    // Получаем информацию об услуге
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        title: true,
        price: true,
        price_from: true,
        profile_id: true,
        profiles: {
          select: {
            display_name: true,
            slug: true,
          },
        },
      },
    })

    if (!service) {
      return { success: false, message: 'Услуга не найдена' }
    }

    // Проверяем есть ли уже в корзине
    const existing = await prisma.cart.findFirst({
      where: {
        user_id: userId,
        service_id: serviceId,
        notes: notes || '',
      },
    })

    if (existing) {
      return {
        success: false,
        message: `"${service.title}" уже в корзине`,
        data: { cart_item_id: existing.id },
      }
    }

    // Добавляем в корзину
    const cartItem = await prisma.cart.create({
      data: {
        user_id: userId,
        service_id: serviceId,
        profile_id: service.profile_id,
        notes: notes || null,
        custom_price: null,
        price_snapshot: service.price || service.price_from || 0,
      },
      select: { id: true },
    })

    return {
      success: true,
      message: `✅ Добавлено в корзину: "${service.title}" от ${service.profiles?.display_name || 'профиля'}`,
      data: {
        cart_item_id: cartItem.id,
        service: {
          id: service.id,
          title: service.title,
          price: service.price,
          profile_name: service.profiles?.display_name,
        },
      },
    }
  } catch (error: any) {
    console.error('[Cart Utils] Add error:', error)
    return { success: false, message: 'Ошибка при добавлении', error: error.message }
  }
}

// Удалить услугу из корзины
export async function removeFromCart(
  userId: string,
  serviceId: string
): Promise<CartActionResult> {
  try {
    if (!serviceId) {
      return { success: false, message: 'Service ID is required' }
    }

    const deleted = await prisma.cart.deleteMany({
      where: {
        user_id: userId,
        service_id: serviceId,
      },
    })

    if (deleted.count === 0) {
      return { success: false, message: 'Услуга не найдена в корзине' }
    }

    return {
      success: true,
      message: '✅ Услуга удалена из корзины',
      data: { deleted_count: deleted.count },
    }
  } catch (error: any) {
    console.error('[Cart Utils] Remove error:', error)
    return { success: false, message: 'Ошибка при удалении', error: error.message }
  }
}

// Показать содержимое корзины (алиас для getCart)
export async function showCart(userId: string): Promise<CartActionResult> {
  return getCart(userId)
}

// Получить содержимое корзины
export async function getCart(userId: string): Promise<CartActionResult> {
  try {
    const items = await prisma.cart.findMany({
      where: { user_id: userId },
      include: {
        services: {
          select: {
            id: true,
            title: true,
            price: true,
            profiles: {
              select: {
                display_name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    const total = items.reduce((sum, item) => {
      const price = item.custom_price || item.price_snapshot || 0
      return sum + Number(price)
    }, 0)

    return {
      success: true,
      message: `В корзине ${items.length} услуг`,
      data: {
        items,
        total,
        count: items.length,
      },
    }
  } catch (error: any) {
    console.error('[Cart Utils] Get cart error:', error)
    return { success: false, message: 'Ошибка при загрузке корзины', error: error.message }
  }
}

// Очистить корзину
export async function clearCart(userId: string): Promise<CartActionResult> {
  try {
    const deleted = await prisma.cart.deleteMany({
      where: { user_id: userId },
    })

    return {
      success: true,
      message: `✅ Корзина очищена (удалено ${deleted.count} услуг)`,
      data: { deleted_count: deleted.count },
    }
  } catch (error: any) {
    console.error('[Cart Utils] Clear cart error:', error)
    return { success: false, message: 'Ошибка при очистке корзины', error: error.message }
  }
}
