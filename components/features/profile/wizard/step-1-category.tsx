'use client'

import { Building2, Users, Sparkles, Briefcase, Search, Palette, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  {
    id: 'venue',
    label: 'Площадка',
    icon: Building2,
    description: 'У меня есть своя локация',
    examples: 'Студия, лофт, батутный парк, квест-комната...',
  },
  {
    id: 'animator',
    label: 'Аниматор',
    icon: Users,
    description: 'Работаю на выезд',
    examples: 'Анимация, аквагрим, игры, шары...',
  },
  {
    id: 'show',
    label: 'Шоу-программа',
    icon: Sparkles,
    description: 'Провожу шоу на мероприятиях',
    examples: 'Научное шоу, файер-шоу, фокусы...',
  },
  {
    id: 'agency',
    label: 'Агентство',
    icon: Briefcase,
    description: 'Организую праздники под ключ',
    examples: 'Подбор площадки, артистов, кейтеринг...',
  },
  {
    id: 'quest',
    label: 'Выездной квест',
    icon: Search,
    description: 'Квесты без своей локации',
    examples: 'Детективный, приключенческий, эскейп...',
  },
  {
    id: 'master_class',
    label: 'Мастер-класс',
    icon: Palette,
    description: 'Провожу творческие занятия',
    examples: 'Рисование, лепка, кулинария...',
  },
  {
    id: 'photographer',
    label: 'Фотограф',
    icon: Camera,
    description: 'Фото/видео съёмка',
    examples: 'Детская, семейная, репортаж...',
  },
]

export function CategoryStep({
  selected,
  onSelect,
}: {
  selected?: string
  onSelect: (category: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Кто вы?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Выберите что лучше всего описывает ваш бизнес
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CATEGORIES.map((category) => {
          const Icon = category.icon
          const isSelected = selected === category.id
          
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                'w-full text-left p-3 rounded-[18px] border-2 transition-all',
                isSelected
                  ? 'bg-orange-50 border-orange-500 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)]'
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className={cn(
                  'w-10 h-10 rounded-[18px] flex items-center justify-center shrink-0',
                  isSelected ? 'bg-orange-500' : 'bg-slate-100'
                )}>
                  <Icon className={cn(
                    'w-5 h-5',
                    isSelected ? 'text-white' : 'text-slate-600'
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'font-bold text-sm mb-0.5',
                    isSelected ? 'text-orange-700' : 'text-slate-900'
                  )}>
                    {category.label}
                  </div>
                  <div className="text-[11px] text-slate-600 mb-1">
                    {category.description}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-relaxed line-clamp-1">
                    {category.examples}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {!selected && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-[18px] p-3 text-xs text-amber-900">
          <div className="flex gap-2">
            <span className="text-base shrink-0">💡</span>
            <div>
              Выбор типа профиля определяет какие поля будут доступны при заполнении.
              Это можно будет изменить позже.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}







