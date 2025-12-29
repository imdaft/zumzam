'use client'

import { Calendar, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RentalRate {
  item: string
  price: number
  unit: string
  description?: string
}

/**
 * Блок "Почасовая аренда" - прайс на аренду площадки/активностей
 * Для бизнес-модели: rental_only или hybrid
 */
export function RentalPricingBlock({
  profileId,
  pricing,
  title = 'Почасовая аренда',
  description = 'Организуете сами, мы предоставляем площадку',
}: {
  profileId: string
  pricing: RentalRate[]
  title?: string
  description?: string
}) {
  if (!pricing || pricing.length === 0) return null
  
  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="px-6 py-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      
      {/* Pricing list */}
      <div className="px-4 pb-4">
        <div className="space-y-2">
          {pricing.map((rate, idx) => (
            <div 
              key={idx} 
              className="flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-900">{rate.item}</div>
                {rate.description && (
                  <div className="text-xs text-slate-500 mt-0.5">{rate.description}</div>
                )}
              </div>
              <div className="text-orange-600 font-semibold whitespace-nowrap ml-4">
                {rate.price.toLocaleString('ru')} ₽/{rate.unit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}





