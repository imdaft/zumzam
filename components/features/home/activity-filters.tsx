'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  name_ru: string
  icon: string | null
  category: string
}

interface ActivityFiltersProps {
  onFilterChange: (activityIds: string[]) => void
  selectedActivities?: string[]
}

export function ActivityFilters({ onFilterChange, selectedActivities = [] }: ActivityFiltersProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>(selectedActivities)

  useEffect(() => {
    async function loadActivities() {
      try {
        const response = await fetch('/api/catalogs?name=activity_catalog')
        if (!response.ok) return
        
        const data = await response.json()
        const items = (data.items || []).slice(0, 12)
        setActivities(items.map((item: any) => ({
          id: item.id,
          name_ru: item.name_ru,
          icon: item.icon,
          category: item.category,
        })))
      } catch (error) {
        console.error('[ActivityFilters] Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [])

  const handleToggle = (activityId: string) => {
    const newSelected = selected.includes(activityId)
      ? selected.filter((id) => id !== activityId)
      : [...selected, activityId]
    
    setSelected(newSelected)
    onFilterChange(newSelected)
  }

  const handleClearAll = () => {
    setSelected([])
    onFilterChange([])
  }

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-9 w-28 bg-slate-200 rounded-full animate-pulse" />
        ))}
      </div>
    )
  }

  if (activities.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          🎯 Быстрые фильтры
        </h3>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 text-xs text-slate-600 hover:text-slate-900"
          >
            Сбросить ({selected.length})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => {
          const isSelected = selected.includes(activity.id)
          return (
            <button
              key={activity.id}
              onClick={() => handleToggle(activity.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                'border-2 hover:shadow-sm',
                isSelected
                  ? 'bg-orange-100 border-orange-500 text-orange-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300'
              )}
            >
              <span className="text-base leading-none">
                {activity.icon || '🎯'}
              </span>
              <span>{activity.name_ru}</span>
              {isSelected && <X className="w-3 h-3 ml-0.5" />}
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div className="text-xs text-slate-600">
          Показываем профили с выбранными активностями
        </div>
      )}
    </div>
  )
}





