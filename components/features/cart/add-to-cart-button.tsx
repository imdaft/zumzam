/**
 * Кнопка добавления услуги в корзину
 * Используется на страницах услуг и профилей
 */

'use client'

import { useState } from 'react'
import { ShoppingCart, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AddToCartButtonProps {
  serviceId: string
  profileId: string
  serviceTitle: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  onSuccess?: () => void
}

export function AddToCartButton({
  serviceId,
  profileId,
  serviceTitle,
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  onSuccess,
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const { addItem, items, clearCart } = useCartStore()
  
  // Состояние для диалога конфликта
  const [conflictData, setConflictData] = useState<{
    isOpen: boolean
    message: string
    otherProfileName: string
  } | null>(null)

  // Проверяем, есть ли уже в корзине
  const isInCart = items.some(item => item.service_id === serviceId)

  const handleAddToCart = async () => {
    try {
      setIsAdding(true)

      await addItem(serviceId, profileId, 1)

      setIsAdded(true)
      toast.success('Добавлено в корзину! 🎉', {
        description: `"${serviceTitle}" добавлено в вашу корзину`,
      })

      // Сбрасываем индикатор через 2 секунды
      setTimeout(() => setIsAdded(false), 2000)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      if (error.code === 'DIFFERENT_PROFILE_EXISTS') {
        setConflictData({
          isOpen: true,
          message: error.message,
          otherProfileName: error.current_profile_name
        })
        return
      }
      
      console.error('[AddToCartButton] Ошибка:', error)
      toast.error('Не удалось добавить в корзину', {
        description: error.message || 'Попробуйте ещё раз',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleClearAndAdd = async () => {
    try {
      setIsAdding(true)
      setConflictData(null)
      
      // 1. Очищаем корзину
      await clearCart()
      
      // 2. Добавляем новую услугу
      await addItem(serviceId, profileId, 1)
      
      setIsAdded(true)
      toast.success('Корзина обновлена', {
        description: `"${serviceTitle}" добавлено в вашу корзину`,
      })
      
      setTimeout(() => setIsAdded(false), 2000)
      
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('[AddToCartButton] Ошибка после очистки:', error)
      toast.error('Ошибка обновления корзины')
    } finally {
      setIsAdding(false)
    }
  }

  if (isInCart && !isAdding) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`gap-2 ${className}`}
        disabled
      >
        {showIcon && <Check className="w-4 h-4" />}
        В корзине
      </Button>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={handleAddToCart}
        disabled={isAdding || isAdded}
      >
        {isAdding ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Добавление...
          </>
        ) : isAdded ? (
          <>
            <Check className="w-4 h-4" />
            Добавлено!
          </>
        ) : (
          <>
            {showIcon && <ShoppingCart className="w-4 h-4" />}
            В корзину
          </>
        )}
      </Button>

      <AlertDialog open={!!conflictData} onOpenChange={(open) => !open && setConflictData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить корзину?</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictData?.message || 'В корзине уже есть услуги другого исполнителя.'}
              <br className="my-2"/>
              Вы можете создавать заявку только для одного исполнителя за раз.
              При добавлении новой услуги текущая корзина будет очищена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAndAdd} className="bg-blue-600 hover:bg-blue-700">
              Очистить и добавить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Компактная кнопка-иконка для добавления в корзину
 */
export function AddToCartIconButton({
  serviceId,
  profileId,
  serviceTitle,
  className = '',
}: Omit<AddToCartButtonProps, 'variant' | 'size' | 'showIcon'>) {
  const [isAdding, setIsAdding] = useState(false)
  const { addItem, items, clearCart } = useCartStore()
  const [conflictData, setConflictData] = useState<{ isOpen: boolean, message: string } | null>(null)

  const isInCart = items.some(item => item.service_id === serviceId)

  const handleAddToCart = async () => {
    try {
      setIsAdding(true)
      await addItem(serviceId, profileId, 1)
      toast.success(`"${serviceTitle}" добавлено в корзину`)
    } catch (error: any) {
      if (error.code === 'DIFFERENT_PROFILE_EXISTS') {
        setConflictData({ isOpen: true, message: error.message })
        return
      }
      toast.error('Ошибка добавления в корзину')
    } finally {
      setIsAdding(false)
    }
  }
  
  const handleClearAndAdd = async () => {
    try {
      setIsAdding(true)
      setConflictData(null)
      await clearCart()
      await addItem(serviceId, profileId, 1)
      toast.success(`"${serviceTitle}" добавлено в корзину`)
    } catch (error: any) {
      toast.error('Ошибка обновления корзины')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <Button
        variant={isInCart ? 'secondary' : 'default'}
        size="icon"
        className={`rounded-full ${className}`}
        onClick={handleAddToCart}
        disabled={isAdding || isInCart}
      >
        {isAdding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isInCart ? (
          <Check className="w-4 h-4" />
        ) : (
          <ShoppingCart className="w-4 h-4" />
        )}
      </Button>

      <AlertDialog open={!!conflictData} onOpenChange={(open) => !open && setConflictData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сменить исполнителя?</AlertDialogTitle>
            <AlertDialogDescription>
              В корзине есть услуги другого исполнителя. Очистить корзину и добавить эту услугу?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAndAdd}>
              Да, сменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
