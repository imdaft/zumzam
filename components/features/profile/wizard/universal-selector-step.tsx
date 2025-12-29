'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface CatalogItem {
  id: string
  name_ru: string
  name_en: string
  category: string
  icon: string | null
  description: string | null
  popular?: boolean
  sort_order?: number
}

interface UniversalSelectorStepProps {
  catalog: 'activity_catalog' | 'animator_services_catalog' | 'show_types_catalog' | 
           'photographer_styles_catalog' | 'masterclass_types_catalog' | 
           'quest_types_catalog' | 'agency_services_catalog'
  title: string
  description: string
  hint: string
  selected: string[]
  onSelect: (items: string[]) => void
  multiSelect?: boolean
}

const CATEGORY_LABELS: Record<string, Record<string, { emoji: string; name: string; order: number }>> = {
  activity_catalog: {
    active: { emoji: '🎯', name: 'Активности', order: 1 },
    entertainment: { emoji: '🎭', name: 'Развлечения', order: 2 },
    creative: { emoji: '🎨', name: 'Творчество', order: 3 },
    other: { emoji: '✨', name: 'Другое', order: 4 },
  },
  animator_services_catalog: {
    animation: { emoji: '🎭', name: 'Анимация', order: 1 },
    face_painting: { emoji: '🎨', name: 'Аквагрим', order: 2 },
    balloon_art: { emoji: '🎈', name: 'Шары', order: 3 },
    games: { emoji: '🎯', name: 'Игры', order: 4 },
    show: { emoji: '✨', name: 'Шоу', order: 5 },
  },
  show_types_catalog: {
    science: { emoji: '🔬', name: 'Научные', order: 1 },
    fire: { emoji: '🔥', name: 'Огненные', order: 2 },
    bubble: { emoji: '💭', name: 'Пузыри', order: 3 },
    paper: { emoji: '🎊', name: 'Бумажные', order: 4 },
    magic: { emoji: '🎩', name: 'Фокусы', order: 5 },
    circus: { emoji: '🎪', name: 'Цирковые', order: 6 },
    light: { emoji: '💡', name: 'Световые', order: 7 },
  },
  photographer_styles_catalog: {
    children: { emoji: '👶', name: 'Детская', order: 1 },
    family: { emoji: '👨‍👩‍👧‍👦', name: 'Семейная', order: 2 },
    event: { emoji: '📸', name: 'Репортаж', order: 3 },
    portrait: { emoji: '🖼️', name: 'Портреты', order: 4 },
    wedding: { emoji: '💒', name: 'Свадьбы', order: 5 },
  },
  masterclass_types_catalog: {
    creative: { emoji: '🎨', name: 'Творческие', order: 1 },
    cooking: { emoji: '👨‍🍳', name: 'Кулинарные', order: 2 },
    craft: { emoji: '🏺', name: 'Рукоделие', order: 3 },
    science: { emoji: '🔬', name: 'Научные', order: 4 },
  },
  quest_types_catalog: {
    detective: { emoji: '🕵️', name: 'Детективные', order: 1 },
    adventure: { emoji: '🗺️', name: 'Приключенческие', order: 2 },
    escape: { emoji: '🔐', name: 'Эскейп', order: 3 },
    outdoor: { emoji: '🏃', name: 'Уличные', order: 4 },
  },
  agency_services_catalog: {
    event_planning: { emoji: '🎉', name: 'Планирование', order: 1 },
    entertainment: { emoji: '🎭', name: 'Развлечения', order: 2 },
    catering: { emoji: '🍽️', name: 'Кейтеринг', order: 3 },
    decoration: { emoji: '🎈', name: 'Оформление', order: 4 },
  },
}

export function UniversalSelectorStep({
  catalog,
  title,
  description,
  hint,
  selected,
  onSelect,
  multiSelect = true,
}: UniversalSelectorStepProps) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadItems() {
      // Проверяем, что catalog определён
      if (!catalog) {
        console.warn('[UniversalSelector] No catalog specified, skipping load')
        if (!cancelled) {
          setIsLoading(false)
          setItems([])
        }
        return
      }

      if (!cancelled) {
        setIsLoading(true)
        setError(null)
      }

      try {
        console.log(`[UniversalSelector] Loading catalog: ${catalog}`)
        
        // Загружаем каталог через API
        const response = await fetch(`/api/catalogs?name=${encodeURIComponent(catalog)}`)
        
        if (!response.ok) {
          // Если каталог не найден, fallback на activity_catalog
          if (response.status === 404 || response.status === 400) {
            console.warn(`[UniversalSelector] Catalog ${catalog} not found, falling back to activity_catalog`)
            
            const fallbackResponse = await fetch('/api/catalogs?name=activity_catalog')
            if (!fallbackResponse.ok) {
              throw new Error('Failed to load fallback catalog')
            }
            
            const fallbackData = await fallbackResponse.json()
            console.log(`[UniversalSelector] Fallback: loaded ${fallbackData.items?.length || 0} items from activity_catalog`)
            if (!cancelled) {
              setItems(fallbackData.items || [])
              setIsFallback(true)
            }
            return
          }
          
          throw new Error(`Failed to load catalog: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log(`[UniversalSelector] Successfully loaded ${data.items?.length || 0} items from ${catalog}`)
        if (!cancelled) {
          setItems(data.items || [])
          setIsFallback(false)
        }
      } catch (err) {
        if (cancelled) return
        console.error(`[UniversalSelector] Error loading ${catalog}:`, err)
        setError(err instanceof Error ? err : new Error('Не удалось загрузить данные. Возможно, каталог еще не создан.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadItems()

    return () => {
      cancelled = true
    }
  }, [catalog])

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>()
    
    for (const item of items) {
      const cat = item.category || 'other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    
    const categoryLabels = CATEGORY_LABELS[catalog] || {}
    const sortedEntries = Array.from(map.entries()).sort((a, b) => {
      const orderA = categoryLabels[a[0]]?.order || 999
      const orderB = categoryLabels[b[0]]?.order || 999
      return orderA - orderB
    })
    
    return new Map(sortedEntries)
  }, [items, catalog])

  const toggleItem = (id: string) => {
    if (multiSelect) {
      if (selected.includes(id)) {
        onSelect(selected.filter(s => s !== id))
      } else {
        onSelect([...selected, id])
      }
    } else {
      onSelect([id])
    }
  }

  const clearAll = () => {
    onSelect([])
  }

  const categoryLabels = CATEGORY_LABELS[catalog] || {}

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>

      {isFallback && (
        <div className="bg-amber-50 border border-amber-200 rounded-[18px] p-2.5 text-xs text-amber-900">
          <div className="flex gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <div className="font-semibold mb-0.5">Временно используется общий каталог</div>
              <div className="text-[10px] text-amber-800">
                Специализированные каталоги еще не созданы в БД. 
                Примените миграцию <code className="bg-amber-100 px-1 py-0.5 rounded text-[9px]">20240102000000_create_classification_catalogs.sql</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-medium text-slate-700">Выбрано: {selected.length}</span>
          {selected.slice(0, 4).map((id) => {
            const item = items?.find(a => a.id === id)
            return item ? (
              <Badge key={id} variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                {item.icon || '🎯'} {item.name_ru}
              </Badge>
            ) : null
          })}
          {selected.length > 4 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">+{selected.length - 4}</Badge>
          )}
          {multiSelect && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium ml-auto"
            >
              Очистить
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="w-6 h-6 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600">Загружаем...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[18px] p-2.5 text-xs text-red-900">
          <div className="font-bold">❌ Ошибка загрузки</div>
          <div className="mt-0.5 text-[10px]">{error.message}</div>
        </div>
      )}

      {!isLoading && !error && grouped.size > 0 && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([category, categoryItems]) => {
            const catInfo = categoryLabels[category] || { emoji: '🌟', name: category, order: 999 }
            return (
              <div key={category} className="scroll-mt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2.5 sticky top-0 bg-white py-1.5 flex items-center gap-2 z-10">
                  <span className="text-base">{catInfo.emoji}</span>
                  <span>{catInfo.name}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0.5 bg-gray-50">{categoryItems.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
                  {categoryItems.map((item) => (
                    <ItemCheckbox
                      key={item.id}
                      item={item}
                      isChecked={selected.includes(item.id)}
                      onToggle={() => toggleItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected.length === 0 && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-[18px] p-4 text-sm text-amber-900">
          <div className="flex gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>{hint}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemCheckbox({
  item,
  isChecked,
  onToggle,
}: {
  item: CatalogItem
  isChecked: boolean
  onToggle: () => void
}) {
  const displayIcon = item.icon || '🎯'
  
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
      <div className="text-lg shrink-0">{displayIcon}</div>
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-semibold text-xs leading-tight',
          isChecked ? 'text-orange-700' : 'text-slate-900',
          item.description && 'mb-0.5'
        )}>
          {item.name_ru}
        </div>
        {item.description && (
          <div className="text-[10px] text-slate-500 leading-snug line-clamp-1">
            {item.description}
          </div>
        )}
      </div>
      
      {isChecked && (
        <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  )
}
