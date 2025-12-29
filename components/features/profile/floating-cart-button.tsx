'use client'

import { useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart-store'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ProfileCart } from '@/components/features/profile/lavka-style/profile-cart'

export function FloatingCartButton() {
  const { items } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  // Функция для склонения слова "услуга"
  const getServicesLabel = (count: number): string => {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${count} услуг`
    }
    
    if (lastDigit === 1) {
      return `${count} услуга`
    }
    
    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${count} услуги`
    }
    
    return `${count} услуг`
  }

  // Не показываем кнопку если корзина пуста
  if (totalItems === 0) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            // Плавающая кнопка корзины — показываем до 2xl (т.е. <1536px)
            'fixed bottom-20 right-4 z-40 2xl:hidden',
            'flex items-center gap-2 px-4 py-3',
            'bg-orange-500 hover:bg-orange-600 text-white',
            'rounded-full shadow-lg shadow-orange-500/30',
            'transition-all active:scale-95',
            'animate-in fade-in slide-in-from-bottom-4 duration-300'
          )}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold">{getServicesLabel(totalItems)}</span>
        </button>
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-[24px] p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Корзина</SheetTitle>
        </SheetHeader>
        
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        
        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <ProfileCart />
        </div>
      </SheetContent>
    </Sheet>
  )
}

