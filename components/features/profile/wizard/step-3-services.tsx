'use client'

import { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Service {
  id: string
  name_ru: string
  name_en: string
  category: string
  icon: string | null
  description: string | null
}

type ServiceRow = {
  id: string
  name_ru: string
  name_en: string
  category: string
  icon: string | null
  description: string | null
}

const SERVICE_CATEGORY_LABELS: Record<string, { emoji: string; name: string; order: number }> = {
  media: { emoji: '📸', name: 'Фото и видео', order: 1 },
  decoration: { emoji: '✨', name: 'Украшение', order: 2 },
  food: { emoji: '🍰', name: 'Еда и сладости', order: 3 },
  equipment: { emoji: '🎭', name: 'Реквизит и оборудование', order: 4 },
  gifts: { emoji: '🎁', name: 'Подарки', order: 5 },
  amenities: { emoji: '🏢', name: 'Удобства площадки', order: 6 },
  other: { emoji: '💫', name: 'Другое', order: 999 },
}

/**
 * ШАГ 3: Выбор дополнительных услуг
 * Опциональный мульти-селект с поиском и группировкой по типам
 * Фильтрует услуги в зависимости от категории профиля
 */
export function ServicesStep({
  selected,
  onSelect,
  profileCategory,
}: {
  selected: string[]
  onSelect: (services: string[]) => void
  profileCategory?: string
}) {
  // Загружаем каталог услуг через API
  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ['additional-services-catalog', profileCategory],
    queryFn: async () => {
      // Пробуем загрузить additional_services_catalog, если не найден - используем service_catalog
      let response = await fetch('/api/catalogs?name=additional_services_catalog')
      
      if (!response.ok) {
        response = await fetch('/api/catalogs?name=service_catalog')
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load catalog: ${response.statusText}`)
      }

      const data = await response.json()
      let filtered = data.items || []

      // Фильтруем по applicable_to, если указана категория
      if (profileCategory) {
        filtered = filtered.filter((row: any) => 
          row.applicable_to && Array.isArray(row.applicable_to) && row.applicable_to.includes(profileCategory)
        )
      }

      return filtered.map((row: any) => ({
        id: row.id,
        name_ru: row.name_ru,
        name_en: row.name_en,
        category: row.category,
        icon: row.icon,
        description: row.description,
      }))
    },
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
  })

  const errorMessage =
    error instanceof Error
      ? error.message
      : (error as any)?.message || (error as any)?.error_description || 'Неизвестная ошибка'
  
  // Все услуги без фильтрации
  const filtered = useMemo(() => {
    return services || []
  }, [services])
  
  // Группируем по типам и сортируем
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>()
    
    for (const service of filtered) {
      const cat = service.category || 'other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(service)
    }
    
    // Сортируем типы по заданному порядку
    const sortedEntries = Array.from(map.entries()).sort((a, b) => {
      const orderA = SERVICE_CATEGORY_LABELS[a[0]]?.order || 999
      const orderB = SERVICE_CATEGORY_LABELS[b[0]]?.order || 999
      return orderA - orderB
    })
    
    return new Map(sortedEntries)
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
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Дополнительные услуги
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Что еще вы можете предложить? <span className="text-gray-400">(опционально)</span>
        </p>
      </div>
      
      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-medium text-slate-700">Выбрано: {selected.length}</span>
          {selected.slice(0, 4).map((id) => {
            const service = services?.find(s => s.id === id)
            return service ? (
              <Badge key={id} variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                {service.icon || '✨'} {service.name_ru}
              </Badge>
            ) : null
          })}
          {selected.length > 4 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">+{selected.length - 4}</Badge>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium ml-auto"
          >
            Очистить
          </button>
        </div>
      )}
      
      {/* Services grouped by type */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="w-6 h-6 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600">Загружаем услуги...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[18px] p-2.5 text-xs text-red-900">
          <div className="font-bold">❌ Ошибка загрузки услуг</div>
          <div className="mt-0.5 text-[10px]">{errorMessage}</div>
        </div>
      )}
      
      {!isLoading && !error && grouped.size === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-[18px] p-4 text-center">
          <p className="text-xs text-slate-600">Услуги не найдены</p>
        </div>
      )}
      
      {!isLoading && !error && grouped.size > 0 && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([serviceType, items]) => {
            const typeInfo = SERVICE_CATEGORY_LABELS[serviceType] || { emoji: '✨', name: serviceType, order: 999 }
            return (
              <div key={serviceType} className="scroll-mt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2.5 sticky top-0 bg-white py-1.5 flex items-center gap-2 z-10">
                  <span className="text-base">{typeInfo.emoji}</span>
                  <span>{typeInfo.name}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0.5 bg-gray-50">{items.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
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
            )
          })}
        </div>
      )}
      
      {/* Info hint */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-[18px] p-4 text-sm text-blue-900">
        <div className="flex gap-3">
          <span className="text-lg shrink-0">💡</span>
          <div>
            <strong className="font-semibold">Подсказка:</strong> Это опциональный шаг. Можете пропустить его и указать услуги позже.
          </div>
        </div>
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
  const displayIcon = service.icon || '✨'
  
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-[18px] text-left transition-all border',
        isChecked
          ? 'bg-orange-50 border-orange-500 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)]'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)]'
      )}
    >
      {/* Icon */}
      <div className="text-lg shrink-0">{displayIcon}</div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-semibold text-xs leading-tight',
          isChecked ? 'text-orange-700' : 'text-slate-900',
          service.description && 'mb-0.5'
        )}>
          {service.name_ru}
        </div>
        {service.description && (
          <div className="text-[10px] text-slate-500 leading-snug line-clamp-1">
            {service.description}
          </div>
        )}
      </div>
      
      {/* Checkmark */}
      {isChecked && (
        <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  )
}





