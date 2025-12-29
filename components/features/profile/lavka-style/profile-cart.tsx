'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Info, Trash2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function ProfileCart() {
  const router = useRouter()
  const { items, getTotal, getItemsCount, fetchCart, removeItem, updateQuantity, clearCart, isLoading } = useCartStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Пробуем загрузить корзину, но не падаем если не получилось
    fetchCart().catch(err => {
      console.warn('[ProfileCart] Cart not available:', err)
    })
  }, [fetchCart])

  // ИЗМЕНЕНО: Валидация больше не нужна - это система заявок
  // useEffect(() => {
  //   if (items.length > 0) {
  //     validateCart()
  //       .then(setValidation)
  //       .catch(err => {
  //         console.warn('[ProfileCart] Validation not available:', err)
  //       })
  //   }
  // }, [items, validateCart])

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId)
      toast.success('Услуга удалена')
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
    // ИЗМЕНЕНО: Это система заявок, любая комбинация услуг валидна
    // Проверяем только что корзина не пуста
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

  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="px-5 py-5 pb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-bold text-lg text-slate-900 leading-tight">Ваша заявка</h2>
          {activeProfileName && (
            <div className="text-xs text-slate-500 mt-1 break-words">
              Исполнитель: <span className="font-semibold text-slate-700">{activeProfileName}</span>
            </div>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center relative shrink-0">
          <ShoppingBag className="w-4 h-4 text-slate-600" />
          {itemsCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {itemsCount}
            </Badge>
          )}
        </div>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="px-5 pb-5">
          <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-4">
            <p className="text-slate-600 text-sm font-semibold">Выберите услуги</p>
            <p className="text-slate-400 text-xs mt-1">Нажмите «Заказать» у нужной услуги.</p>
          </div>
        </div>
      ) : (
        /* Cart Items */
        <div className="px-3 pb-3">
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-[20px] border border-slate-200 bg-white">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900 break-words leading-snug">
                    {item.service?.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {(item.price_snapshot * item.quantity).toLocaleString()} ₽
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xs font-semibold w-6 text-center text-slate-700">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      {!isEmpty && (
        <div className="px-5 pb-4">
          <div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Примерно:</span>
            <span className="text-xl font-bold text-slate-900">{total.toLocaleString()} ₽</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Точную стоимость уточнит исполнитель</p>
          </div>
        </div>
      )}

      {/* Info Block */}
      <div className="px-5 pb-4">
        <div className="p-3 bg-orange-50 rounded-[20px] border border-orange-100">
          <p className="text-xs text-orange-700">
            Исполнитель свяжется с вами, чтобы обсудить детали и назвать точную цену.
          </p>
        </div>
      </div>
      
      <div className="px-5 pb-5 flex flex-col gap-2.5">
        <Button 
          onClick={handleCheckout}
          disabled={isEmpty}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 font-bold disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isEmpty ? 'Выберите услуги' : 'Отправить заявку'}
        </Button>
        <Button 
          variant="outline"
          onClick={handleClearCart}
          disabled={isEmpty}
          className="w-full rounded-full h-11"
        >
          Очистить корзину
        </Button>
      </div>
    </div>
  )
}

