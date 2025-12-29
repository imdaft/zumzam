'use client'

import { Building2, Users, Sparkles, Briefcase, Search, Palette, Camera, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryOption {
  value: string
  label: string
  icon: React.ElementType
  description: string
}

const CATEGORIES: CategoryOption[] = [
  {
    value: 'venue',
    label: 'Площадка',
    icon: Building2,
    description: 'Студия, лофт, кафе, квест‑комната…',
  },
  {
    value: 'animator',
    label: 'Аниматор',
    icon: Users,
    description: 'Праздник в образе',
  },
  {
    value: 'show',
    label: 'Шоу-программа',
    icon: Sparkles,
    description: 'Выездные шоу‑номера',
  },
  {
    value: 'agency',
    label: 'Агентство',
    icon: Briefcase,
    description: 'Праздник под ключ',
  },
  {
    value: 'quest',
    label: 'Выездной квест',
    icon: Search,
    description: 'Без своей локации (к вам / к клиенту)',
  },
  {
    value: 'master_class',
    label: 'Выездной мастер-класс',
    icon: Palette,
    description: 'Выездные творческие занятия',
  },
  {
    value: 'photographer',
    label: 'Фотограф',
    icon: Camera,
    description: 'Фото и видео',
  },
]

interface CategoryVisualSelectorProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CategoryVisualSelector({ value, onChange, disabled }: CategoryVisualSelectorProps) {
  return (
    <div className="space-y-2">
      {CATEGORIES.map((category) => {
        const Icon = category.icon
        const isSelected = value === category.value
        
        return (
          <button
            key={category.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(category.value)}
            className={cn(
              'w-full relative p-4 rounded-xl border transition-all text-left',
              'hover:shadow-sm active:scale-[0.98]',
              isSelected
                ? 'bg-orange-500 border-orange-500 shadow-sm text-white'
                : 'bg-white border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-4">
              {/* Иконка */}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                  isSelected ? 'bg-white/20' : 'bg-orange-50'
                )}
              >
                <Icon className={cn('w-6 h-6', isSelected ? 'text-white' : 'text-orange-600')} />
              </div>
              
              {/* Текст */}
              <div className="flex-1 min-w-0">
                <div className={cn('text-base font-semibold', isSelected ? 'text-white' : 'text-gray-900')}>
                  {category.label}
                </div>
                <div className={cn('text-sm', isSelected ? 'text-white/90' : 'text-gray-500')}>
                  {category.description}
                </div>
              </div>
              
              {/* Галочка для выбранного */}
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

