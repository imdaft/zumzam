'use client'

import { useState, useEffect } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'

interface PhotographyStylesSectionProps {
  profileId: string
}

interface PhotographyStyle {
  id: string
  style: string
  title: string
  description: string | null
  photos: string[]
  base_price: number | null
  duration: number | null
  photo_count: string | null
}

const STYLE_LABELS: Record<string, string> = {
  portrait: 'Портретная',
  family: 'Семейная',
  children: 'Детская',
  event: 'Событийная',
  wedding: 'Свадебная',
  love_story: 'Love Story',
  product: 'Предметная',
  reportage: 'Репортажная',
  studio: 'Студийная',
  outdoor: 'Уличная',
  other: 'Другое'
}

export function PhotographyStylesSection({ profileId }: PhotographyStylesSectionProps) {
  const [styles, setStyles] = useState<PhotographyStyle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const { addItem, items } = useCartStore()

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const response = await fetch(`/api/photography-styles?profile_id=${profileId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch styles')
        }

        const result = await response.json()
        setStyles(result.styles || [])
      } catch (error) {
        console.error('[Photography] Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStyles()
  }, [profileId])

  const handleAddToCart = async (styleId: string, styleTitle: string) => {
    setAddingToCart(styleId)
    try {
      await addItem(styleId, profileId, 1, `Фотосъемка: ${styleTitle}`)
      toast.success('Добавлено в заявку!')
    } catch (error) {
      toast.error('Не удалось добавить в заявку')
    } finally {
      setAddingToCart(null)
    }
  }

  const isInCart = (styleId: string) => items.some(item => item.service_id === styleId)

  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (styles.length === 0) return null

  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="px-6 py-6 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Стили съемки</h2>
        <p className="text-sm text-slate-500 mt-1">Выберите подходящий стиль фотосессии</p>
      </div>

      <div className="p-2 space-y-2">
        {styles.map((style) => {
          const inCart = isInCart(style.id)
          const isAdding = addingToCart === style.id

          return (
            <div key={style.id} className="rounded-[28px] bg-slate-50/50 border border-slate-100 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex gap-4 sm:gap-6">
                  {style.photos?.[0] ? (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] overflow-hidden bg-slate-100 shrink-0">
                      <Image src={style.photos[0]} alt={style.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] bg-slate-100 flex items-center justify-center shrink-0">
                      <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">{style.title}</h3>
                      {style.base_price && (
                        <span className="text-lg font-bold text-orange-600 whitespace-nowrap">
                          от {style.base_price.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                        {STYLE_LABELS[style.style] || style.style}
                      </span>
                      {style.duration && (
                        <span className="text-xs text-slate-500">{style.duration} мин</span>
                      )}
                      {style.photo_count && (
                        <span className="text-xs text-slate-500">{style.photo_count}</span>
                      )}
                    </div>

                    {style.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{style.description}</p>
                    )}

                    <Button
                      onClick={() => handleAddToCart(style.id, style.title)}
                      disabled={isAdding || inCart}
                      className={`h-11 px-6 rounded-full font-semibold ${
                        inCart ? 'bg-slate-100 text-slate-600' : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Добавление...
                        </>
                      ) : inCart ? 'В заявке' : 'Заказать'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}





