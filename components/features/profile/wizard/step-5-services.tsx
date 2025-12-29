'use client'

import { useState, useMemo } from 'react'
import { Check, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Service {
  id: string
  name_ru: string
  name_en: string
  category: string
  icon: string
  description?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  event: '🎭 Организация',
  food: '🍽️ Питание',
  media: '📸 Фото/видео',
  other: '🛠️ Другое',
}

/**
 * ШАГ 5: Дополнительные услуги
 * Мульти-селект (опционально)
 */
export function ServicesStep({
  selected,
  onSelect,
}: {
  selected: string[]
  onSelect: (services: string[]) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Загружаем каталог услуг
  const { data: services } = useQuery<Service[]>({
    queryKey: ['service-catalog'],
    queryFn: async () => {
      const response = await fetch('/api/catalogs?name=service_catalog')
      if (!response.ok) {
        throw new Error('Failed to load services')
      }
      const { items } = await response.json()
      return items || []
    },
  })
  
  // Фильтруем по поиску
  const filtered = useMemo(() => {
    if (!services) return []
    if (!searchQuery.trim()) return services
    
    const query = searchQuery.toLowerCase()
    return services.filter(s => 
      s.name_ru.toLowerCase().includes(query) ||
      s.name_en.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    )
  }, [services, searchQuery])
  
  // Группируем по категориям
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>()
    for (const service of filtered) {
      const cat = service.category || 'other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(service)
    }
    return map
  }, [filtered])
  
  const toggleService = (id: string) => {
    if (selected.includes(id)) {
      onSelect(selected.filter(s => s !== id))
    } else {
      onSelect([...selected, id])
    }
  }
  
  const clearAll = () => {
    onSelect([])
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Шаг 5: Дополнительные услуги
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          Что еще вы предлагаете? (необязательно)
        </p>
      </div>
      
      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-slate-700">Выбрано: {selected.length}</span>
          {selected.slice(0, 4).map((id) => {
            const service = services?.find(s => s.id === id)
            return service ? (
              <Badge key={id} variant="secondary" className="gap-1.5">
                {service.icon} {service.name_ru}
              </Badge>
            ) : null
          })}
          {selected.length > 4 && (
            <Badge variant="secondary">+{selected.length - 4} еще</Badge>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Очистить
          </button>
        </div>
      )}
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Поиск услуг..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Services grouped by category */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 sticky top-0 bg-white py-1">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((service) => (
                <ServiceCheckbox
                  key={service.id}
                  service={service}
                  isChecked={selected.includes(service.id)}
                  onToggle={() => toggleService(service.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Hint */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-[18px] p-4 text-sm text-amber-900">
        💡 <strong>Необязательно:</strong> Можете пропустить этот шаг и добавить услуги позже
      </div>
    </div>
  )
}

function ServiceCheckbox({
  service,
  isChecked,
  onToggle,
}: {
  service: Service
  isChecked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-start gap-3 p-3 border-2 rounded-[18px] text-left transition-all',
        'active:scale-[0.98] cursor-pointer',
        isChecked
          ? 'bg-orange-50 border-orange-500'
          : 'bg-white border-slate-200 hover:border-slate-300'
      )}
    >
      {/* Checkbox */}
      <div className={cn(
        'w-5 h-5 rounded-[18px] border-2 flex items-center justify-center shrink-0 mt-0.5',
        isChecked 
          ? 'bg-orange-600 border-orange-600'
          : 'bg-white border-slate-300'
      )}>
        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      
      {/* Content */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg">{service.icon}</span>
          <span className="font-medium text-sm text-slate-900">{service.name_ru}</span>
        </div>
        {service.description && (
          <p className="text-xs text-slate-600 leading-snug">{service.description}</p>
        )}
      </div>
    </button>
  )
}





