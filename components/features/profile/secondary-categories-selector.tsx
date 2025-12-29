'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Users, Sparkles, Palette, Camera } from 'lucide-react'

interface SecondaryCategory {
  value: string
  label: string
  icon: React.ElementType
  description: string
  color: string
}

// Какие дополнительные категории доступны для каждой основной
const AVAILABLE_SECONDARY: Record<string, SecondaryCategory[]> = {
  venue: [
    {
      value: 'master_class',
      label: 'Мастер-классы',
      icon: Palette,
      description: 'Проводим творческие или кулинарные занятия',
      color: 'text-amber-600',
    },
    {
      value: 'show',
      label: 'Шоу-программы',
      icon: Sparkles,
      description: 'Есть готовые шоу (научное, бумажное и др.)',
      color: 'text-pink-600',
    },
    {
      value: 'photographer',
      label: 'Фотограф',
      icon: Camera,
      description: 'Делаем профессиональную фотосъемку',
      color: 'text-rose-600',
    },
  ],
  animator: [
    {
      value: 'show',
      label: 'Шоу-программы',
      icon: Sparkles,
      description: 'Проводим интерактивные шоу',
      color: 'text-pink-600',
    },
  ],
  show: [
    {
      value: 'photographer',
      label: 'Фотограф',
      icon: Camera,
      description: 'Делаем фото на мероприятии',
      color: 'text-rose-600',
    },
  ],
  master_class: [
    {
      value: 'show',
      label: 'Шоу-программы',
      icon: Sparkles,
      description: 'Дополняем мастер-классы шоу',
      color: 'text-pink-600',
    },
    {
      value: 'photographer',
      label: 'Фотограф',
      icon: Camera,
      description: 'Фотографируем процесс',
      color: 'text-rose-600',
    },
  ],
  photographer: [],
  agency: [],
  quest: [],
}

interface SecondaryCategoriesSelectorProps {
  primaryCategory: string
  selected: string[]
  onChange: (categories: string[]) => void
  disabled?: boolean
}

export function SecondaryCategoriesSelector({
  primaryCategory,
  selected,
  onChange,
  disabled,
}: SecondaryCategoriesSelectorProps) {
  const availableOptions = AVAILABLE_SECONDARY[primaryCategory] || []

  if (availableOptions.length === 0) {
    return null
  }

  const toggle = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category))
    } else {
      onChange([...selected, category])
    }
  }

  return (
    <div className="space-y-3">
      {availableOptions.map((option) => {
        const Icon = option.icon
        const isSelected = selected.includes(option.value)

        return (
          <label
            key={option.value}
            className={cn(
              'flex items-start gap-4 p-4 rounded-[16px] border-2 cursor-pointer transition-all',
              'hover:shadow-md active:scale-[0.99]',
              isSelected
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => !disabled && toggle(option.value)}
              disabled={disabled}
              className="mt-1"
            />

            <div
              className={cn(
                'w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0',
                isSelected ? 'bg-white shadow-sm' : 'bg-gray-50'
              )}
            >
              <Icon className={cn('w-5 h-5', option.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className={cn('text-sm font-bold mb-1', isSelected ? option.color : 'text-gray-900')}>
                {option.label}
              </div>
              <div className={cn('text-xs leading-relaxed', isSelected ? 'text-gray-700' : 'text-gray-500')}>
                {option.description}
              </div>
            </div>
          </label>
        )
      })}
    </div>
  )
}















