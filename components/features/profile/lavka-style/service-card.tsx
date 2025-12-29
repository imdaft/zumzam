'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'

interface ServiceCardProps {
  id: string
  profile_id?: string // Добавляем profile_id для корзины
  title?: string // Для обратной совместимости
  name?: string  // Новое поле
  price: number | null
  price_type?: 'fixed' | 'from' | 'hourly' | 'per_person' | 'negotiable'
  image?: string | string[]
  duration?: string
  description?: string
  is_package?: boolean
  package_includes?: string[]
}

export function ServiceCard({ id, profile_id, title, name, price, price_type, image, duration, description, is_package, package_includes }: ServiceCardProps) {
  const displayName = name || title || 'Услуга'
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  
  const { addItem, items, clearCart } = useCartStore()
  const isInCart = items.some(item => item.service_id === id)
  
  // Преобразуем image в массив
  const images = Array.isArray(image) ? image : (image ? [image] : [])
  const hasMultipleImages = images.length > 1
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!profile_id) {
      toast.error('Невозможно добавить в корзину')
      return
    }
    
    if (isInCart) {
      toast.info('Уже в корзине')
      return
    }
    
    try {
      setIsAdding(true)
      await addItem(id, profile_id, 1)
      toast.success('Услуга добавлена', {
        description: displayName,
      })
    } catch (error: any) {
      if (error?.code === 'DIFFERENT_PROFILE_EXISTS') {
        const confirmSwitch = window.confirm(error.message || 'В корзине уже есть услуги другого исполнителя. Очистить корзину и добавить новую услугу?')
        if (confirmSwitch) {
          try {
            await clearCart()
            await addItem(id, profile_id, 1)
            toast.success('Корзина обновлена', { description: displayName })
          } catch (confirmError: any) {
            toast.error('Не удалось обновить корзину', {
              description: confirmError?.message || 'Попробуйте ещё раз',
            })
          } finally {
            setIsAdding(false)
          }
          return
        } else {
          toast.info('Корзина осталась без изменений')
          return
        }
      }
      console.error('[ServiceCard] Ошибка добавления в корзину:', error)
      toast.error('Не удалось добавить в корзину', {
        description: error.message || 'Попробуйте ещё раз',
      })
    } finally {
      setIsAdding(false)
    }
  }
  
  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }
  
  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }
  
  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className="bg-white border border-slate-100 rounded-[28px] p-4 sm:p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-300 cursor-pointer group/card"
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        {/* Фото сверху на мобильных, слева на десктопе */}
        <div className="relative w-full sm:w-36 h-48 sm:h-36 rounded-[20px] overflow-hidden bg-slate-100 shrink-0 group">
          <Image
            src={images[currentImageIndex] || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=400&h=300'}
            alt={displayName}
            fill
            className="object-cover"
          />
          
          {/* Навигация по фото */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPreviousImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
              
              {/* Индикаторы */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white w-4' 
                        : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Инфо справа (на десктопе) или снизу (на мобильных) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                {displayName}
              </h3>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
            )}
          </div>
          
          {description && (
            <div className={`text-sm text-slate-500 mb-3 transition-all whitespace-pre-wrap leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
              {description}
            </div>
          )}

          {/* Что включено в пакет */}
          {is_package && package_includes && package_includes.length > 0 && isExpanded && (
            <div className="mb-4 p-3 bg-slate-50 rounded-[16px]">
              <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-2">
                В стоимость входит:
              </h4>
              <ul className="space-y-1.5">
                {package_includes.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 leading-none">
                {price_type === 'negotiable' 
                  ? 'Договорная'
                  : price === null || price === undefined
                  ? 'Цена не указана'
                  : <>
                      {price_type === 'from' && <span className="text-sm font-normal text-slate-500 mr-1">от</span>}
                      {price.toLocaleString('ru')} ₽
                    </>
                }
              </span>
              {(price_type === 'hourly' || price_type === 'per_person' || duration) && (
                <span className="text-xs text-slate-400 font-medium mt-0.5">
                  {price_type === 'hourly' && 'за час'}
                  {price_type === 'per_person' && 'за человека'}
                  {duration && price_type !== 'negotiable' && ` • ${duration}`}
                </span>
              )}
            </div>
            
            {profile_id && (
              <button 
                onClick={handleAddToCart}
                disabled={isAdding || isInCart}
                className={`h-9 px-4 rounded-full flex items-center gap-1.5 justify-center transition-all shrink-0 font-semibold shadow-sm hover:shadow-md text-sm ${
                  isInCart 
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAdding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isInCart ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>В заявке</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Заказать</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

