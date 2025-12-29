'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCategorySubtypes } from '@/lib/constants/profile-categories'
import type { ProfileCategory } from '@/lib/constants/profile-categories'
import { Search, ChevronRight } from 'lucide-react'

interface SubtypeSelectionStepProps {
  category: ProfileCategory
  selectedSubtype: string | null
  onSelect: (subtype: string) => void
  onNext: () => void
}

// Группировка подтипов площадок по категориям
const VENUE_GROUPS = [
  {
    title: 'Традиционные развлекательные',
    subtypes: ['kids_center', 'loft', 'cafe', 'entertainment_center', 'outdoor']
  },
  {
    title: 'Спортивно-активные',
    subtypes: ['trampoline_park', 'karting', 'lasertag', 'climbing_park', 'bowling']
  },
  {
    title: 'Водные развлечения',
    subtypes: ['water_park']
  },
  {
    title: 'Образовательно-культурные',
    subtypes: ['museum', 'planetarium', 'theater', 'library']
  },
  {
    title: 'Творческие мастерские',
    subtypes: ['art_studio', 'pottery_workshop', 'culinary_studio', 'woodworking_workshop', 'sewing_workshop']
  },
  {
    title: 'Животные и природа',
    subtypes: ['zoo', 'aquarium', 'horse_club', 'farm']
  },
  {
    title: 'Специализированные развлечения',
    subtypes: ['vr_arena', 'quest_room', 'cinema', 'retail_workshop']
  },
  {
    title: 'Загородный отдых',
    subtypes: ['recreation_base', 'glamping']
  },
  {
    title: 'Прочее',
    subtypes: ['other']
  }
]

export function SubtypeSelectionStep({
  category,
  selectedSubtype,
  onSelect,
  onNext
}: SubtypeSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Получаем все подтипы для категории
  const allSubtypes = getCategorySubtypes(category)
  
  // Создаем map для быстрого доступа к метаданным
  const subtypesMap = useMemo(() => {
    const map = new Map()
    allSubtypes.forEach(subtype => {
      map.set(subtype.id, subtype)
    })
    return map
  }, [allSubtypes])
  
  // Фильтрация по поисковому запросу
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return VENUE_GROUPS
    }
    
    const query = searchQuery.toLowerCase()
    return VENUE_GROUPS.map(group => ({
      ...group,
      subtypes: group.subtypes.filter(subtypeId => {
        const subtype = subtypesMap.get(subtypeId)
        if (!subtype) return false
        return (
          subtype.name.toLowerCase().includes(query) ||
          subtype.description?.toLowerCase().includes(query)
        )
      })
    })).filter(group => group.subtypes.length > 0)
  }, [searchQuery, subtypesMap])
  
  const handleSelectAndNext = (subtypeId: string) => {
    onSelect(subtypeId)
    // Небольшая задержка для визуального feedback
    setTimeout(() => {
      onNext()
    }, 150)
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Выберите тип площадки
        </h1>
        <p className="text-gray-500">
          Это поможет нам настроить профиль под ваши особенности
        </p>
      </div>
      
      {/* Поиск */}
      {allSubtypes.length > 10 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по типу площадки..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-[16px]"
            />
          </div>
        </div>
      )}
      
      {/* Группы подтипов */}
      <div className="space-y-8">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.subtypes.map((subtypeId) => {
                const subtype = subtypesMap.get(subtypeId)
                if (!subtype) return null
                
                const isSelected = selectedSubtype === subtypeId
                
                return (
                  <button
                    key={subtypeId}
                    onClick={() => handleSelectAndNext(subtypeId)}
                    className={`
                      relative p-4 rounded-[16px] border-2 text-left transition-all
                      hover:scale-[1.02] hover:shadow-md
                      ${isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-orange-200'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 ${isSelected ? 'text-orange-900' : 'text-gray-900'}`}>
                          {subtype.name}
                        </h3>
                        {subtype.description && (
                          <p className={`text-sm ${isSelected ? 'text-orange-700' : 'text-gray-500'}`}>
                            {subtype.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Результаты поиска */}
      {searchQuery && filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">
            Ничего не найдено по запросу "{searchQuery}"
          </p>
          <Button
            variant="ghost"
            onClick={() => setSearchQuery('')}
            className="text-orange-500 hover:text-orange-600"
          >
            Сбросить поиск
          </Button>
        </div>
      )}
      
      {/* Кнопка "Далее" если уже выбрано */}
      {selectedSubtype && (
        <div className="mt-8 flex justify-end">
          <Button
            onClick={onNext}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-[16px] px-8"
          >
            Далее
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
