'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIMARY_TYPES = [
  {
    id: 'active_entertainment',
    icon: '🎯',
    label: 'Активные развлечения',
    description: 'Батуты, лазертаг, скалодром',
  },
  {
    id: 'quest_escape',
    icon: '🔐',
    label: 'Квесты',
    description: 'Квест-комнаты, головоломки',
  },
  {
    id: 'creative_studio',
    icon: '🎨',
    label: 'Творческие студии',
    description: 'Мастер-классы, искусство',
  },
  {
    id: 'event_space',
    icon: '🎉',
    label: 'Площадка для мероприятий',
    description: 'Лофты, залы, студии',
  },
  {
    id: 'vr_digital',
    icon: '🥽',
    label: 'VR и цифровые',
    description: 'Виртуальная реальность',
  },
  {
    id: 'animal_interaction',
    icon: '🐴',
    label: 'С животными',
    description: 'Лошади, зоопарк',
  },
  {
    id: 'outdoor_recreation',
    icon: '🌲',
    label: 'Загородный отдых',
    description: 'Базы отдыха',
  },
]

/**
 * ШАГ 1: Выбор основного типа деятельности
 * Компактное отображение строчками
 */
export function PrimaryTypeStep({
  selected,
  onSelect,
}: {
  selected?: string
  onSelect: (typeId: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Основной тип площадки
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Что вы предлагаете в первую очередь?
        </p>
      </div>
      
      {/* Список типов (элегантные строчки: 2 колонки на широких экранах) */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
        {PRIMARY_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-[18px] text-left transition-all border',
              selected === type.id
                ? 'bg-orange-50 border-orange-500 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)]'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)]'
            )}
          >
            {/* Icon */}
            <div className="text-lg shrink-0">{type.icon}</div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={cn(
                'font-semibold text-xs leading-tight mb-0.5',
                selected === type.id ? 'text-orange-700' : 'text-slate-900'
              )}>
                {type.label}
              </div>
              <div className="text-[10px] text-slate-500 leading-snug">
                {type.description}
              </div>
            </div>
            
            {/* Checkmark */}
            {selected === type.id && (
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Hint */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-[18px] p-2.5 text-xs text-blue-900">
        <div className="flex gap-2">
          <span className="text-base shrink-0">💡</span>
          <div>
            <strong className="font-semibold">Совет:</strong> Выберите то, чем вы занимаетесь в основном. 
            Дополнительные активности вы укажете на следующих шагах.
          </div>
        </div>
      </div>
    </div>
  )
}





