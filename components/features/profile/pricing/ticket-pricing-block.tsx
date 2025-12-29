'use client'

import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TicketPricing {
  weekday_price: number
  weekend_price: number
  unlimited_price?: number
  notes?: string
}

/**
 * Блок "Билеты" - цены на свободное посещение
 * Для бизнес-модели: tickets_freeplay
 */
export function TicketPricingBlock({
  profileId,
  pricing,
  title = 'Билеты на посещение',
  description = 'Приходите в любое время без брони',
}: {
  profileId: string
  pricing: TicketPricing
  title?: string
  description?: string
}) {
  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="px-6 py-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      
      {/* Pricing cards */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Будние дни */}
          <PriceCard
            label="Будние дни"
            price={pricing.weekday_price}
            unit="час"
          />
          
          {/* Выходные */}
          <PriceCard
            label="Выходные"
            price={pricing.weekend_price}
            unit="час"
          />
          
          {/* Безлимит */}
          {pricing.unlimited_price && (
            <PriceCard
              label="Безлимит"
              price={pricing.unlimited_price}
              unit="весь день"
              featured
            />
          )}
        </div>
        
        {pricing.notes && (
          <p className="text-xs text-slate-500 mt-3 px-2">{pricing.notes}</p>
        )}
      </div>
    </div>
  )
}

function PriceCard({
  label,
  price,
  unit,
  featured = false,
}: {
  label: string
  price: number
  unit: string
  featured?: boolean
}) {
  return (
    <div className={cn(
      'p-4 rounded-xl text-center transition-all',
      featured 
        ? 'bg-orange-50 border-2 border-orange-500' 
        : 'bg-slate-50 border border-slate-200'
    )}>
      <div className={cn(
        'text-2xl font-bold mb-1',
        featured ? 'text-orange-600' : 'text-slate-900'
      )}>
        {price.toLocaleString('ru')} ₽
      </div>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-xs text-slate-500">/ {unit}</div>
      {featured && (
        <div className="mt-2">
          <span className="text-xs font-bold text-orange-600 uppercase">Выгодно</span>
        </div>
      )}
    </div>
  )
}





