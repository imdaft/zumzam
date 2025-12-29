'use client'

import { useState, useEffect } from 'react'
import { 
  Crown,
  Star,
  Zap,
  Clock,
  Pin,
  Send,
  Users,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BoardListingPlan } from '@/lib/types/board-subscription'

interface ListingPlanSelectorProps {
  value?: string
  onChange: (planId: string | undefined) => void
  className?: string
}

export function ListingPlanSelector({ value, onChange, className }: ListingPlanSelectorProps) {
  const [plans, setPlans] = useState<BoardListingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/board-listing-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'basic': return <Clock className="w-5 h-5" />
      case 'standard': return <Star className="w-5 h-5" />
      case 'premium': return <Zap className="w-5 h-5" />
      case 'vip': return <Crown className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  const getPlanColor = (slug: string, isSelected: boolean) => {
    if (!isSelected) return 'border-gray-200 bg-white hover:border-gray-300'
    
    switch (slug) {
      case 'basic': return 'border-gray-400 bg-gray-50'
      case 'standard': return 'border-blue-400 bg-blue-50'
      case 'premium': return 'border-orange-400 bg-orange-50'
      case 'vip': return 'border-amber-400 bg-amber-50'
      default: return 'border-orange-400 bg-orange-50'
    }
  }

  const getIconColor = (slug: string) => {
    switch (slug) {
      case 'basic': return 'text-gray-500'
      case 'standard': return 'text-blue-500'
      case 'premium': return 'text-orange-500'
      case 'vip': return 'text-amber-500'
      default: return 'text-orange-500'
    }
  }

  const getFeatures = (plan: BoardListingPlan): string[] => {
    const features: string[] = []
    
    features.push(`${plan.duration_days} дней размещения`)
    
    if (plan.pin_days > 0) {
      features.push(`Закрепление на ${plan.pin_days} ${pluralizeDays(plan.pin_days)}`)
    }
    
    if (plan.publish_to_telegram) {
      features.push('Публикация в Telegram')
    }
    
    if (plan.send_to_subscribers) {
      features.push('Рассылка подписчикам')
    }
    
    if (plan.featured_badge) {
      features.push('Значок «Рекомендовано»')
    }
    
    if (plan.priority_boost > 0) {
      features.push('Приоритет в выдаче')
    }
    
    return features
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900">Выберите тариф размещения</h3>
      </div>
      
      <p className="text-sm text-gray-500">
        Премиум тарифы увеличивают видимость вашего объявления и привлекают больше откликов
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plans.map((plan) => {
          const isSelected = value === plan.id
          const isPopular = plan.slug === 'premium'
          
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onChange(isSelected ? undefined : plan.id)}
              className={cn(
                "relative p-4 rounded-[28px] border-2 text-left transition-all",
                getPlanColor(plan.slug, isSelected),
                isSelected && "ring-2 ring-offset-2",
                isSelected && plan.slug === 'basic' && "ring-gray-400",
                isSelected && plan.slug === 'standard' && "ring-blue-400",
                isSelected && plan.slug === 'premium' && "ring-orange-400",
                isSelected && plan.slug === 'vip' && "ring-amber-400",
              )}
            >
              {/* Популярный значок */}
              {isPopular && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                  Популярный
                </div>
              )}

              {/* Заголовок */}
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-[18px] bg-white/50", getIconColor(plan.slug))}>
                  {getPlanIcon(plan.slug)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{plan.name}</div>
                  <div className="text-lg font-bold text-gray-900">
                    {plan.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                {isSelected && (
                  <div className="ml-auto">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Описание */}
              {plan.description && (
                <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
              )}

              {/* Фичи */}
              <ul className="space-y-1.5">
                {getFeatures(plan).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* Подсказка */}
      <p className="text-xs text-gray-400 text-center">
        Оплата происходит после создания объявления. Вы можете выбрать тариф позже.
      </p>
    </div>
  )
}

function pluralizeDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100

  if (mod100 >= 11 && mod100 <= 19) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}






