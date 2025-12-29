'use client'

import { cn } from '@/lib/utils'
import { Heart } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { CATEGORIES } from '@/lib/constants/categories'
import { VENUE_GROUPS, VENUE_GROUP_MAPPING } from '@/lib/constants/venue-types'
import { motion } from 'framer-motion'

interface CategoryNavProps {
  activeCategory: string | null
  onSelect: (categoryId: string | null) => void
  rightAction?: React.ReactNode
  venueTypeFilter?: string
  onVenueTypeChange?: (type: string) => void
}

// Экспортируем маппинг для использования в других компонентах
export { VENUE_GROUP_MAPPING }

export function CategoryNav({ 
  activeCategory, 
  onSelect, 
  rightAction,
  venueTypeFilter,
  onVenueTypeChange
}: CategoryNavProps) {
  const [sortedCategories, setSortedCategories] = useState<typeof CATEGORIES[number][]>(CATEGORIES as any)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const optimizeLayout = () => {
      // Только "Площадки" (первый элемент) фиксированы, остальные сортируются по длине
      const fixed = CATEGORIES.slice(0, 1) // Только Площадки
      const flexible = CATEGORIES.slice(1) // Агентства и остальные могут двигаться
      const sorted = [...flexible].sort((a, b) => a.name.length - b.name.length)
      setSortedCategories([...fixed, ...sorted])
    }
    
    optimizeLayout()
    window.addEventListener('resize', optimizeLayout)
    return () => window.removeEventListener('resize', optimizeLayout)
  }, [])

  // Определяем, что показывать в капсулах
  const displayItems = activeCategory === 'venues'
    ? VENUE_GROUPS // Для площадок показываем группы
    : sortedCategories.filter(cat => cat.id !== 'venues') // Для услуг убираем "Площадки"
  
  const isVenueMode = activeCategory === 'venues'

  return (
    <div className="sticky top-16 z-40 bg-white py-2 -mx-2 px-2 sm:mx-0 sm:px-0 mb-3">
       <div className="flex items-center justify-between gap-4">
         <div ref={containerRef} className="flex flex-wrap items-center gap-1.5 flex-1 isolate">
          {/* Кнопка "Все" или "Все типы" для площадок */}
          <button
              onClick={() => isVenueMode ? onVenueTypeChange?.('all') : onSelect(null)}
              className={cn(
                // Капсула в стиле Яндекса
                "group relative shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full transition-colors duration-200 text-[13px] font-medium",
                (isVenueMode ? venueTypeFilter === 'all' : activeCategory === null) ? "text-white" : "text-gray-700"
              )}
            >
              {/* Серый фон (всегда рендерится, но может перекрываться оранжевым) */}
              <span 
                className="absolute inset-0 rounded-full bg-gray-100 transition-colors duration-200 group-hover:bg-gray-200" 
                style={{ zIndex: 0 }}
              />
              
              {/* Оранжевый фон (активный) */}
              {(isVenueMode ? venueTypeFilter === 'all' : activeCategory === null) && (
                <motion.div
                  layoutId="category-pill"
                  className="absolute inset-0 bg-orange-500 rounded-full"
                  style={{ zIndex: 10 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Контент */}
              <span className="relative z-20 flex items-center gap-1.5">
                <span className="text-sm">🌟</span>
                <span>{isVenueMode ? 'Все типы' : 'Все'}</span>
              </span>
          </button>

          {/* Избранное - минималистичное */}
          <button
              onClick={() => onSelect('favorites')}
              className={cn(
                // Капсула/кнопка в стиле Яндекса
                "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full transition-all border relative z-0", // z-0 чтобы быть в потоке
                activeCategory === 'favorites'
                  ? "bg-red-50 border-red-200 text-red-500"
                  : "bg-white border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-red-400"
              )}
              title="Избранное"
            >
              <Heart className={cn("w-4 h-4", activeCategory === 'favorites' && "fill-red-500")} />
          </button>

          {/* Категории или типы площадок */}
          {isVenueMode ? (
            // Типы площадок (для venues)
            displayItems.map((type) => (
              <button
                key={type.id}
                onClick={() => onVenueTypeChange?.(type.id)}
                className={cn(
                  "group relative shrink-0 inline-flex items-center gap-1 px-3 h-9 rounded-full transition-colors duration-200 text-[13px] font-medium",
                  venueTypeFilter === type.id ? "text-white" : "text-gray-700"
                )}
              >
                {/* Серый фон */}
                <span 
                  className="absolute inset-0 rounded-full bg-gray-100 transition-colors duration-200 group-hover:bg-gray-200" 
                  style={{ zIndex: 0 }}
                />
                
                {/* Оранжевый фон (активный) */}
                {venueTypeFilter === type.id && (
                  <motion.div
                    layoutId="category-pill"
                    className="absolute inset-0 bg-orange-500 rounded-full"
                    style={{ zIndex: 10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* Контент */}
                <span className="relative z-20">{type.name}</span>
              </button>
            ))
          ) : (
            // Категории услуг (для остальных)
            displayItems.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={cn(
                  "group relative shrink-0 inline-flex items-center gap-1 px-3 h-9 rounded-full transition-colors duration-200 text-[13px] font-medium",
                  activeCategory === cat.id ? "text-white" : "text-gray-700"
                )}
              >
                {/* Серый фон */}
                <span 
                  className="absolute inset-0 rounded-full bg-gray-100 transition-colors duration-200 group-hover:bg-gray-200" 
                  style={{ zIndex: 0 }}
                />
                
                {/* Оранжевый фон (активный) */}
                {activeCategory === cat.id && (
                  <motion.div
                    layoutId="category-pill"
                    className="absolute inset-0 bg-orange-500 rounded-full"
                    style={{ zIndex: 10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* Контент */}
                <span className="relative z-20 flex items-center gap-1">
                  {/* Иконки только на sm+ */}
                  <span className="hidden sm:inline text-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
              </button>
            ))
          )}
        </div>
        
        {/* Правый слот для действий (например, переключатель карты) */}
        {rightAction && (
          <div className="hidden md:block shrink-0">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  )
}
