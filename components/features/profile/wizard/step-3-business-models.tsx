'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const BUSINESS_MODELS = [
  {
    id: 'packages_turnkey',
    icon: '📦',
    label: 'Пакеты "под ключ"',
    description: 'Организуем праздник с программой, аниматорами, всё включено',
    examples: 'День рождения, выпускной, корпоратив',
    color: 'bg-orange-50 border-orange-300',
  },
  {
    id: 'tickets_freeplay',
    icon: '🎫',
    label: 'Билеты на посещение',
    description: 'Приходите в любое время, свободная игра без брони',
    examples: 'Батутный парк, игровая зона, аквапарк',
    color: 'bg-blue-50 border-blue-300',
  },
  {
    id: 'rental_only',
    icon: '🏢',
    label: 'Только аренда',
    description: 'Сдаём пустое помещение, вы организуете сами',
    examples: 'Лофт, зал, площадка без услуг',
    color: 'bg-slate-50 border-slate-300',
  },
  {
    id: 'mobile_services',
    icon: '🚗',
    label: 'Выездные программы',
    description: 'Приезжаем к вам (нет своей площадки)',
    examples: 'Выездной аниматор, шоу, мастер-классы',
    color: 'bg-green-50 border-green-300',
  },
  {
    id: 'hybrid',
    icon: '🔀',
    label: 'Гибридная модель',
    description: 'Несколько вариантов работы одновременно',
    examples: 'Аренда + пакеты, билеты + праздники',
    color: 'bg-amber-50 border-amber-300',
  },
]

/**
 * ШАГ 3: Как вы работаете? (бизнес-модели)
 * Можно выбрать несколько чекбоксов
 */
export function BusinessModelsStep({
  selected,
  onSelect,
}: {
  selected: string[]
  onSelect: (models: string[]) => void
}) {
  const toggleModel = (id: string) => {
    if (selected.includes(id)) {
      onSelect(selected.filter(s => s !== id))
    } else {
      onSelect([...selected, id])
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Шаг 3: Как вы работаете?
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          Выберите один или несколько вариантов
        </p>
      </div>
      
      {/* Business models */}
      <div className="space-y-3">
        {BUSINESS_MODELS.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isSelected={selected.includes(model.id)}
            onToggle={() => toggleModel(model.id)}
          />
        ))}
      </div>
      
      {/* Hints */}
      <div className="space-y-2">
        {selected.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[18px] p-4 text-sm text-amber-900">
            ⚠️ Выберите хотя бы один вариант работы
          </div>
        )}
        
        {selected.includes('hybrid') && selected.length === 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-[18px] p-4 text-sm text-blue-900">
            💡 Если вы выбрали "Гибридная модель", добавьте ещё конкретные варианты работы
          </div>
        )}
      </div>
    </div>
  )
}

function ModelCard({
  model,
  isSelected,
  onToggle,
}: {
  model: typeof BUSINESS_MODELS[0]
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-start gap-4 p-4 border-2 rounded-[18px] text-left transition-all',
        'active:scale-[0.99] cursor-pointer',
        model.color,
        isSelected && 'ring-2 ring-orange-500 ring-offset-2'
      )}
    >
      {/* Checkbox */}
      <div className={cn(
        'w-6 h-6 rounded-[18px] border-2 flex items-center justify-center shrink-0 mt-1',
        isSelected 
          ? 'bg-orange-600 border-orange-600'
          : 'bg-white border-slate-300'
      )}>
        {isSelected && <Check className="w-4 h-4 text-white" />}
      </div>
      
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{model.icon}</span>
          <h3 className="font-semibold text-base text-slate-900">{model.label}</h3>
        </div>
        <p className="text-sm text-slate-700 mb-2 leading-snug">
          {model.description}
        </p>
        <p className="text-xs text-slate-500">
          <strong>Примеры:</strong> {model.examples}
        </p>
      </div>
    </button>
  )
}





