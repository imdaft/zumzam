'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const SPACE_TYPES = [
  {
    id: 'loft_studio',
    icon: '🏭',
    label: 'Лофт / Студия',
    description: 'Открытое пространство в урбанистическом стиле',
  },
  {
    id: 'mall_venue',
    icon: '🏬',
    label: 'Площадка в ТРЦ',
    description: 'Помещение в торговом центре',
  },
  {
    id: 'closed_arena',
    icon: '🏟️',
    label: 'Закрытая арена',
    description: 'Спортзал, крытая площадка',
  },
  {
    id: 'outdoor',
    icon: '🌳',
    label: 'Открытая площадка',
    description: 'На улице, парк, сквер',
  },
  {
    id: 'country_base',
    icon: '🏡',
    label: 'База отдыха',
    description: 'Загородный комплекс',
  },
  {
    id: 'mobile',
    icon: '🚙',
    label: 'Мобильная',
    description: 'Нет своей площадки, работаем выездом',
  },
]

/**
 * ШАГ 4: Тип помещения
 * Один вариант (визуальный выбор)
 */
export function SpaceTypeStep({
  selected,
  onSelect,
}: {
  selected?: string
  onSelect: (spaceType: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Шаг 4: Тип помещения
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          Где находится ваша площадка?
        </p>
      </div>
      
      {/* Space types (2 cols) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {SPACE_TYPES.map((type) => (
          <SpaceTypeCard
            key={type.id}
            type={type}
            isSelected={selected === type.id}
            onSelect={() => onSelect(type.id)}
          />
        ))}
      </div>
      
      {/* Hint */}
      {!selected && (
        <div className="bg-amber-50 border border-amber-200 rounded-[18px] p-4 text-sm text-amber-900">
          ⚠️ Выберите тип помещения
        </div>
      )}
    </div>
  )
}

function SpaceTypeCard({
  type,
  isSelected,
  onSelect,
}: {
  type: typeof SPACE_TYPES[0]
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative p-4 border-2 rounded-[18px] text-left transition-all',
        'active:scale-[0.98] cursor-pointer',
        'bg-slate-50 border-slate-200 hover:border-slate-300',
        isSelected && 'bg-orange-50 border-orange-500 ring-2 ring-orange-500 ring-offset-2'
      )}
    >
      {/* Checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Icon */}
      <div className="text-3xl mb-2">{type.icon}</div>
      
      {/* Label */}
      <div className="font-semibold text-sm sm:text-base text-slate-900 leading-tight mb-1">
        {type.label}
      </div>
      
      {/* Description */}
      <div className="text-xs text-slate-600 leading-snug">
        {type.description}
      </div>
    </button>
  )
}





