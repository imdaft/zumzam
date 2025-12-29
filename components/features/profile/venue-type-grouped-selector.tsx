'use client'

import { useState } from 'react'
import { ChevronRight, Building2, Activity, GraduationCap, Palette, TreePine, Sparkles, Home, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VenueType {
  value: string
  label: string
  description?: string
}

interface VenueGroup {
  id: string
  label: string
  icon: React.ElementType
  types: VenueType[]
}

const VENUE_GROUPS: VenueGroup[] = [
  {
    id: 'rental',
    label: 'Только аренда помещения',
    icon: Building2,
    types: [
      { value: 'cafe', label: 'Кафе / Ресторан', description: 'Аренда зала для праздника' },
      { value: 'loft_rental', label: 'Лофт', description: 'Аренда стильного пространства' },
      { value: 'banquet_hall', label: 'Банкетный зал', description: 'Специализированный зал для банкетов' },
    ],
  },
  {
    id: 'event_studio',
    label: 'Лофты для праздников',
    icon: Sparkles,
    types: [
      { value: 'event_loft', label: 'Лофт для праздников', description: 'Со своими программами и организацией' },
      { value: 'event_loft_hybrid', label: 'Лофт-студия (программы + аренда)', description: 'Организуем праздники и сдаем в аренду' },
    ],
  },
  {
    id: 'entertainment',
    label: 'Развлекательные центры',
    icon: Activity,
    types: [
      { value: 'entertainment_center', label: 'Детский развлекательный центр', description: 'Билеты, батуты, лабиринты, игровые зоны' },
    ],
  },
  {
    id: 'active',
    label: 'Активные развлечения',
    icon: Activity,
    types: [
      { value: 'trampoline_park', label: 'Батутный парк', description: 'Батуты, поролоновая яма' },
      { value: 'water_park', label: 'Аквапарк / Бассейн', description: 'Водные горки, бассейны' },
      { value: 'karting', label: 'Картинг-центр', description: 'Гоночная трасса, карты' },
      { value: 'lasertag', label: 'Лазертаг / Пейнтбол', description: 'Тактические игры' },
      { value: 'climbing_park', label: 'Скалодром / Веревочный парк', description: 'Высотные трассы' },
      { value: 'bowling', label: 'Боулинг / Бильярд', description: 'Дорожки, столы' },
      { value: 'archery_club', label: 'Лучно-арбалетный клуб', description: 'Стрельба из лука и арбалета' },
      { value: 'sports_center', label: 'Спортивный центр', description: 'Футбольная академия, спортивные программы' },
    ],
  },
  {
    id: 'quest',
    label: 'Квесты',
    icon: Gamepad2,
    types: [
      { value: 'quest_room', label: 'Квест‑комната', description: 'Эскейп‑румы, квест-локации' },
    ],
  },
  {
    id: 'vr',
    label: 'VR-арены',
    icon: Gamepad2,
    types: [
      { value: 'vr_arena', label: 'VR-арена', description: 'Большие залы с виртуальной реальностью' },
    ],
  },
  {
    id: 'creative',
    label: 'Творческие мастерские',
    icon: Palette,
    types: [
      { value: 'art_studio', label: 'Художественная студия', description: 'Рисование, живопись' },
      { value: 'pottery_workshop', label: 'Гончарная мастерская', description: 'Лепка из глины' },
      { value: 'culinary_studio', label: 'Кулинарная студия', description: 'Приготовление блюд' },
      { value: 'woodworking_workshop', label: 'Столярная мастерская', description: 'Работа с деревом' },
      { value: 'sewing_workshop', label: 'Швейная мастерская', description: 'Шитье, рукоделие' },
    ],
  },
  {
    id: 'nature',
    label: 'С животными и природой',
    icon: TreePine,
    types: [
      { value: 'horse_club', label: 'Конный клуб', description: 'Катание на лошадях и пони' },
      { value: 'farm', label: 'Ферма / Экоферма', description: 'Домашние животные, кормление' },
    ],
  },
  {
    id: 'outdoor',
    label: 'Загородные и открытые',
    icon: Home,
    types: [
      { value: 'recreation_base', label: 'База отдыха / Загородный клуб', description: 'Коттеджи, большая территория' },
      { value: 'glamping', label: 'Глэмпинг', description: 'Комфортный отдых на природе' },
      { value: 'outdoor', label: 'Открытая площадка', description: 'Парк, поляна, терраса' },
    ],
  },
  {
    id: 'other',
    label: 'Другое',
    icon: Building2,
    types: [
      { value: 'other', label: 'Другое', description: 'Нестандартная площадка' },
    ],
  },
]

interface VenueTypeGroupedSelectorProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function VenueTypeGroupedSelector({ value, onChange, disabled }: VenueTypeGroupedSelectorProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    value ? VENUE_GROUPS.find(g => g.types.some(t => t.value === value))?.id || null : null
  )

  return (
    <div className="space-y-1.5">
      {VENUE_GROUPS.map((group) => {
        const Icon = group.icon
        const isExpanded = expandedGroup === group.id
        const hasSelectedType = group.types.some(t => t.value === value)
        
        return (
          <div key={group.id} className="border rounded-xl border-gray-200 overflow-hidden">
            {/* Заголовок группы */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
              className={cn(
                'w-full p-2.5 flex items-center gap-2 transition-all',
                'hover:bg-gray-50 active:bg-gray-100',
                hasSelectedType && 'bg-orange-50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-gray-900 leading-tight">{group.label}</div>
                <div className="text-xs text-gray-500">{group.types.length} {group.types.length === 1 ? 'вариант' : 'варианта'}</div>
              </div>
              <ChevronRight
                className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-90')}
              />
            </button>

            {/* Список типов */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50/50 p-1.5 space-y-1">
                {group.types.map((type) => {
                  const isSelected = value === type.value
                  
                  return (
                    <button
                      key={type.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(type.value)}
                      className={cn(
                        'w-full p-2 rounded-lg border transition-all text-left',
                        'hover:shadow-sm active:scale-[0.98]',
                        isSelected
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-white border-gray-200 hover:border-gray-300',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className={cn('text-sm font-semibold leading-tight mb-0.5', isSelected ? 'text-white' : 'text-gray-900')}>
                            {type.label}
                          </div>
                          {type.description && (
                            <div className={cn('text-xs leading-tight', isSelected ? 'text-white/90' : 'text-gray-500')}>
                              {type.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

