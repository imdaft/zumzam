'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Amenity = {
  id: string
  label: string
  icon?: React.ReactNode
  category?: string
}

interface AmenitiesSelectorProps {
  amenities: Amenity[]
  selected: string[]
  onChange: (selected: string[]) => void
  label?: string
  columns?: 1 | 2 | 3
  className?: string
  disabled?: boolean
}

export function AmenitiesSelector({
  amenities,
  selected,
  onChange,
  label,
  columns = 2,
  className,
  disabled = false,
}: AmenitiesSelectorProps) {
  const handleToggle = (amenityId: string) => {
    if (disabled) return

    if (selected.includes(amenityId)) {
      onChange(selected.filter((id) => id !== amenityId))
    } else {
      onChange([...selected, amenityId])
    }
  }

  // Группировка по категориям
  const groupedAmenities = React.useMemo(() => {
    const groups: Record<string, Amenity[]> = {}
    
    amenities.forEach((amenity) => {
      const category = amenity.category || 'Общее'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(amenity)
    })
    
    return groups
  }, [amenities])

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {Object.entries(groupedAmenities).map(([category, items]) => (
        <div key={category} className="space-y-2">
          {Object.keys(groupedAmenities).length > 1 && (
            <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
          )}
          
          <div className={cn('grid gap-2', gridCols[columns])}>
            {items.map((amenity) => {
              const isSelected = selected.includes(amenity.id)
              
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => handleToggle(amenity.id)}
                  disabled={disabled}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                    'hover:border-primary/50 hover:bg-primary/5',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 bg-white text-gray-700',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                      isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  
                  {amenity.icon && (
                    <span className="shrink-0 text-lg">{amenity.icon}</span>
                  )}
                  
                  <span className="text-left flex-1">{amenity.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

















