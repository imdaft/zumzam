/**
 * Виджет корзины - компактное отображение корзины с количеством товаров
 * Показывается в шапке сайта и на странице профиля
 */

'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Trash2, Plus, Minus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

export function CartWidget() {
  const router = useRouter()
  const { items, getTotal, getItemsCount, fetchCart, removeItem, updateQuantity, clearCart, isLoading } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchCart()
  }, [fetchCart])

  // Подписка на глобальное событие обновления корзины
  useEffect(() => {
    const handleCartUpdated = () => fetchCart()
    window.addEventListener('cart:updated', handleCartUpdated)
    return () => window.removeEventListener('cart:updated', handleCartUpdated)
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
      toast.error('Не удалось обновить количество')
    }
  }

  const handleCheckout = () => {
    setIsOpen(false)
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
  const activeProfileName = items[0]?.profile?.display_name

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full">
          <ShoppingBag className="w-5 h-5" />
          {itemsCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-blue-600">
              {itemsCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Ваша корзина
          </SheetTitle>
          <SheetDescription>
            {itemsCount === 0 ? 'Корзина пуста' : `${itemsCount} ${itemsCount === 1 ? 'услуга' : 'услуг'}`}
            {activeProfileName && itemsCount > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                Исполнитель: {activeProfileName}
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500">Корзина пуста</p>
              <p className="text-sm text-gray-400 mt-1">Добавьте услуги для создания заявки</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl border bg-white">
                    {item.service?.images?.[0] && (
                      <img
                        src={item.service.images[0]}
                        alt={item.service.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.service?.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{item.profile?.display_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold text-sm">
                        {(item.price_snapshot * item.quantity).toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Итого:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {total.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex gap-3">
                <Button
                  onClick={handleCheckout}
                  className="w-full rounded-xl h-12 text-base font-semibold"
                  size="lg"
                >
                  Оформить заявку
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  className="w-full rounded-xl h-12 text-base font-semibold"
                  size="lg"
                >
                  Очистить
                </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


