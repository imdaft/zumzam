'use client'

import { useState, useMemo, useEffect } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Activity {
  id: string
  name_ru: string
  name_en: string
  category: string
  icon: string | null
  description: string | null
}

const CATEGORY_LABELS: Record<string, { emoji: string; name: string; order: number }> = {
  // Актуальные категории в БД (важно: в каталоге сейчас есть англ. значения)
  active: { emoji: '🎯', name: 'Активности', order: 1 },
  entertainment: { emoji: '🎭', name: 'Развлечения', order: 2 },
  creative: { emoji: '🎨', name: 'Творчество', order: 3 },
  other: { emoji: '✨', name: 'Другое', order: 4 },

  // На случай старой схемы/других значений (fallback)
  active_entertainment: { emoji: '🎯', name: 'Активные развлечения', order: 10 },
  educational: { emoji: '📚', name: 'Образовательные программы', order: 11 },
  show: { emoji: '🎭', name: 'Шоу-программы', order: 12 },
  quest: { emoji: '🎮', name: 'Квесты и игры', order: 13 },
  unique: { emoji: '🌟', name: 'Уникальные программы', order: 14 },
}

/**
 * ШАГ 2: Выбор активностей
 * Мульти-селект с поиском и группировкой по категориям
 * Адаптируется под категорию профиля
 */
export function ActivitiesStep({
  category,
  selected,
  onSelect,
}: {
  category?: string
  selected: string[]
  onSelect: (activities: string[]) => void
}) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Загружаем каталог активностей (или услуг для агентства)
  useEffect(() => {
    let cancelled = false

    async function loadActivities() {
      if (!cancelled) {
        setIsLoading(true)
        setError(null)
      }

      try {
        // Выбираем каталог в зависимости от категории профиля
        let catalogName = 'activity_catalog' // по умолчанию
        
        switch (category) {
          case 'animator':
            catalogName = 'animator_services_catalog'
            break
          case 'show':
            catalogName = 'show_types_catalog'
            break
          case 'quest':
            catalogName = 'quest_types_catalog'
            break
          case 'master_class':
            catalogName = 'masterclass_types_catalog'
            break
          case 'photographer':
            catalogName = 'photographer_styles_catalog'
            break
          case 'agency':
            catalogName = 'agency_services_catalog'
            break
          case 'venue':
          default:
            catalogName = 'activity_catalog'
            break
        }
        
        const response = await fetch(`/api/catalogs?name=${catalogName}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load catalog: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!cancelled) {
          setActivities(data.items || [])
        }
      } catch (err) {
        if (cancelled) return
        console.error('[ActivitiesStep] Error loading activities:', err)
        const e = err instanceof Error ? err : new Error('Unknown error')
        if (String(e.message || '').startsWith('LOAD_TIMEOUT_')) {
          setError(new Error('Таймаут загрузки активностей. Проверьте интернет/доступ к Supabase и обновите страницу.'))
        } else {
          setError(e)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadActivities()

    return () => {
      cancelled = true
    }
  }, [category])
  
  // Все активности без фильтрации
  const filtered = useMemo(() => {
    return activities || []
  }, [activities])
  
  // Группируем по категориям и сортируем
  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>()
    
    for (const activity of filtered) {
      const cat = activity.category || 'unique'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(activity)
    }
    
    // Сортируем категории по заданному порядку
    const sortedEntries = Array.from(map.entries()).sort((a, b) => {
      const orderA = CATEGORY_LABELS[a[0]]?.order || 999
      const orderB = CATEGORY_LABELS[b[0]]?.order || 999
      return orderA - orderB
    })
    
    return new Map(sortedEntries)
  }, [filtered])
  
  const toggleActivity = (id: string) => {
    if (selected.includes(id)) {
      onSelect(selected.filter(s => s !== id))
    } else {
      onSelect([...selected, id])
    }
  }
  
  const clearAll = () => {
    onSelect([])
  }
  
  // Адаптивный контент в зависимости от категории
  const getContent = () => {
    switch (category) {
      case 'venue':
        return {
          title: 'Активности на площадке',
          description: 'Выберите всё, что есть у вас на площадке',
          hint: 'Выберите хотя бы одну активность. Это поможет клиентам найти вас через поиск.'
        }
      case 'animator':
        return {
          title: 'Ваши программы и услуги',
          description: 'Что вы предлагаете: анимация, аквагрим, шары, шоу...',
          hint: 'Выберите хотя бы одну программу. Это поможет клиентам найти вас.'
        }
      case 'show':
        return {
          title: 'Виды шоу',
          description: 'Какие шоу-программы вы проводите',
          hint: 'Выберите хотя бы один вид шоу.'
        }
      case 'agency':
        return {
          title: 'Что организуете',
          description: 'Выберите услуги, которые вы предоставляете',
          hint: 'Выберите хотя бы одну услугу.'
        }
      default:
        return {
          title: 'Ваши услуги',
          description: 'Что вы предлагаете клиентам',
          hint: 'Выберите хотя бы одну услугу.'
        }
    }
  }
  
  const content = getContent()
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {content.title}
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {content.description}
        </p>
      </div>
      
      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-medium text-slate-700">Выбрано: {selected.length}</span>
          {selected.slice(0, 4).map((id) => {
            const activity = activities?.find(a => a.id === id)
            return activity ? (
              <Badge key={id} variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                {activity.icon || '🎯'} {activity.name_ru}
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
      
      {/* Activities grouped by category */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="w-6 h-6 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600">Загружаем активности...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[18px] p-3 text-xs text-red-900">
          <div className="font-bold">❌ Ошибка загрузки активностей</div>
          <div className="mt-1">{error instanceof Error ? error.message : 'Неизвестная ошибка'}</div>
        </div>
      )}
      
      {!isLoading && !error && grouped.size === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-[18px] p-6 text-center">
          <p className="text-sm text-slate-600">Активности не найдены</p>
        </div>
      )}
      
      {!isLoading && !error && grouped.size > 0 && (
        <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2">
          {Array.from(grouped.entries()).map(([category, items]) => {
            const catInfo = CATEGORY_LABELS[category] || { emoji: '🌟', name: category, order: 999 }
            return (
              <div key={category} className="scroll-mt-4">
                <h3 className="text-base font-bold text-gray-800 mb-4 sticky top-0 bg-white py-2 flex items-center gap-3 z-10">
                  <span className="text-xl">{catInfo.emoji}</span>
                  <span>{catInfo.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs px-2 py-0.5 bg-gray-50">{items.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
                  {items.map((activity) => (
                    <ActivityCheckbox
                      key={activity.id}
                      activity={activity}
                      isChecked={selected.includes(activity.id)}
                      onToggle={() => toggleActivity(activity.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Hint */}
      {selected.length === 0 && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-[18px] p-4 text-sm text-amber-900">
          <div className="flex gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>{content.hint}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityCheckbox({
  activity,
  isChecked,
  onToggle,
}: {
  activity: Activity
  isChecked: boolean
  onToggle: () => void
}) {
  const displayIcon = activity.icon || '🎯'
  
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-[18px] text-left transition-all border',
        isChecked
          ? 'bg-orange-50 border-orange-500 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)]'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)]'
      )}
    >
      {/* Icon */}
      <div className="text-2xl shrink-0">{displayIcon}</div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-semibold text-sm leading-tight mb-0.5',
          isChecked ? 'text-orange-700' : 'text-slate-900'
        )}>
          {activity.name_ru}
        </div>
        {activity.description && (
          <div className="text-xs text-slate-500 leading-snug">
            {activity.description}
          </div>
        )}
      </div>
      
      {/* Checkmark */}
      {isChecked && (
        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </button>
  )
}





