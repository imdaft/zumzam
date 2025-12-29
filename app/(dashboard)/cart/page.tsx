/**
 * Страница корзины клиента
 * Показывает все товары в корзине, сгруппированные по профилям
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import type { CartItem } from '@/types'

export default function CartPage() {
  const router = useRouter()
  const { items, getTotal, getItemsCount, fetchCart, removeItem, updateQuantity, clearCart, isLoading } = useCartStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchCart().catch(err => {
      console.warn('[CartPage] Cart not available:', err)
    })
  }, [fetchCart])

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId)
      toast.success('Удалено из корзины')
    } catch (error) {
      toast.error('Не удалось удалить')
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      toast.error('Не удалось обновить')
    }
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Добавьте услуги для создания заявки')
      return
    }
    router.push('/checkout')
  }

  const handleClearCart = async () => {
    const confirmClear = window.confirm('Очистить корзину? Текущий исполнитель и услуги будут удалены.')
    if (!confirmClear) return
    try {
      await clearCart()
      toast.success('Корзина очищена')
    } catch (error) {
      toast.error('Не удалось очистить корзину')
    }
  }

  if (!isMounted) {
    return null
  }

  const itemsCount = getItemsCount()
  const total = getTotal()
  const isEmpty = items.length === 0
  const activeProfileName = items[0]?.profile?.display_name

  // Группируем товары по профилям
  const itemsByProfile = items.reduce((acc, item) => {
    const profileId = item.profile?.id || 'unknown'
    if (!acc[profileId]) {
      acc[profileId] = {
        profile: item.profile,
        items: []
      }
    }
    acc[profileId].items.push(item)
    return acc
  }, {} as Record<string, { profile: any, items: CartItem[] }>)

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Корзина</h1>
        <p className="text-gray-500">
          {isEmpty ? 'Ваша корзина пуста' : `${itemsCount} ${itemsCount === 1 ? 'услуга' : itemsCount < 5 ? 'услуги' : 'услуг'}`}
        </p>
        {activeProfileName && !isEmpty && (
          <p className="text-sm text-gray-600 mt-1">
            Исполнитель: <span className="font-semibold text-gray-800">{activeProfileName}</span>
          </p>
        )}
        {!isEmpty && (
          <div className="mt-3">
            <Button variant="outline" onClick={handleClearCart}>
              Очистить корзину
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : isEmpty ? (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gray-50 rounded-full mx-auto mb-6 flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-gray-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Корзина пуста</h2>
          <p className="text-gray-500 mb-8">Добавьте услуги, чтобы создать заявку</p>
          <Button asChild className="rounded-xl">
            <Link href="/">Перейти к поиску</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список товаров */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(itemsByProfile).map(([profileId, data]) => (
              <div key={profileId} className="bg-white rounded-2xl p-6 shadow-sm border">
                {/* Информация о профиле */}
                {data.profile && (
                  <Link
                    href={`/profiles/${data.profile.slug}`}
                    className="flex items-center gap-3 mb-4 pb-4 border-b hover:opacity-75 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Store className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{data.profile.display_name}</h3>
                      {data.profile.city && (
                        <p className="text-sm text-gray-500">{data.profile.city}</p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </Link>
                )}

                {/* Список товаров профиля */}
                <div className="space-y-3">
                  {data.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      {/* Изображение */}
                      {item.service?.images && item.service.images.length > 0 && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={item.service.images[0]}
                            alt={item.service.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.service?.title}</h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {item.service?.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-600">
                            {(item.price_snapshot * item.quantity).toLocaleString()} ₽
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-500">
                              {item.price_snapshot.toLocaleString()} ₽ × {item.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Количество и удаление */}
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Сводка заказа */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Итого</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товаров:</span>
                  <span className="font-medium text-gray-900">{itemsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Профилей:</span>
                  <span className="font-medium text-gray-900">{Object.keys(itemsByProfile).length}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Сумма:</span>
                  <span className="text-2xl font-bold text-blue-600">{total.toLocaleString()} ₽</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 mb-4">
                <p className="font-semibold mb-1">Это заявка, а не покупка</p>
                <p>Сервис свяжется с вами для уточнения деталей и стоимости</p>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isEmpty}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isEmpty ? 'Корзина пуста' : 'Оформить заявку'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


