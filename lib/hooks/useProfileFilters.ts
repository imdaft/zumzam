/**
 * Хук для фильтрации и сортировки профилей
 */

import { useState, useMemo } from 'react'
import type { Profile } from './useProfiles'
import { calculateDistance } from '@/lib/utils'

interface Coordinates {
  latitude: number
  longitude: number
}

interface UseProfileFiltersOptions {
  profiles: Profile[]
  currentCity?: { name: string } | null
  userCoordinates?: Coordinates | null
  favorites?: string[]
}

interface UseProfileFiltersReturn {
  // Отфильтрованные профили
  filteredProfiles: Profile[]
  
  // Состояние фильтров
  activeCategory: string | null
  sortBy: string
  venueTypeFilter: string
  
  // Сеттеры
  setActiveCategory: (category: string | null) => void
  setSortBy: (sort: string) => void
  setVenueTypeFilter: (type: string) => void
  
  // Хелперы
  resetFilters: () => void
  getCategoryCount: (categoryId: string) => number
}

export function useProfileFilters({
  profiles,
  currentCity,
  userCoordinates,
  favorites = []
}: UseProfileFiltersOptions): UseProfileFiltersReturn {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('rating')
  const [venueTypeFilter, setVenueTypeFilter] = useState<string>('all')

  // 1. Фильтрация по городу
  const cityFilteredProfiles = useMemo(() => {
    if (!currentCity?.name) return profiles

    const cityNameLower = currentCity.name.toLowerCase()
    return profiles.filter(profile => {
      if (!profile.city) return false
      const profileCityLower = profile.city.toLowerCase()
      return profileCityLower.includes(cityNameLower) || 
             cityNameLower.includes(profileCityLower.split(',')[0])
    })
  }, [profiles, currentCity])

  // 2. Фильтрация по категории
  const categoryFilteredProfiles = useMemo(() => {
    let items = cityFilteredProfiles

    if (activeCategory === 'favorites') {
      items = items.filter(profile => favorites.includes(profile.id))
    } else if (activeCategory) {
      items = items.filter(profile => profile.category === activeCategory)
    }

    // Фильтр по типу площадки (только для venues)
    if (activeCategory === 'venues' && venueTypeFilter !== 'all') {
      items = items.filter(profile => {
        const venueType = profile.details?.venue_type
        return venueType && venueType === venueTypeFilter
      })
    }

    return items
  }, [cityFilteredProfiles, activeCategory, favorites, venueTypeFilter])

  // 3. Сортировка
  const sortedProfiles = useMemo(() => {
    const sorted = [...categoryFilteredProfiles]

    switch (sortBy) {
      case 'distance':
        if (userCoordinates) {
          sorted.sort((a, b) => {
            const distA = a.latitude && a.longitude
              ? calculateDistance(
                  userCoordinates.latitude,
                  userCoordinates.longitude,
                  a.latitude,
                  a.longitude
                )
              : Infinity
            const distB = b.latitude && b.longitude
              ? calculateDistance(
                  userCoordinates.latitude,
                  userCoordinates.longitude,
                  b.latitude,
                  b.longitude
                )
              : Infinity
            return distA - distB
          })
        }
        break

      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break

      case 'reviews':
        sorted.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
        break

      case 'price_asc':
        sorted.sort((a, b) => {
          const priceA = a.priceFrom || Infinity
          const priceB = b.priceFrom || Infinity
          return priceA - priceB
        })
        break

      case 'price_desc':
        sorted.sort((a, b) => {
          const priceA = a.priceFrom || 0
          const priceB = b.priceFrom || 0
          return priceB - priceA
        })
        break

      default:
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    return sorted
  }, [categoryFilteredProfiles, sortBy, userCoordinates])

  // Сброс фильтров
  const resetFilters = () => {
    setActiveCategory(null)
    setSortBy('rating')
    setVenueTypeFilter('all')
  }

  // Обработчик выбора категории (сбрасывает связанные фильтры)
  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category)
    setVenueTypeFilter('all')
    setSortBy('rating')
  }

  // Подсчёт профилей в категории
  const getCategoryCount = (categoryId: string): number => {
    return cityFilteredProfiles.filter(p => p.category === categoryId).length
  }

  return {
    filteredProfiles: sortedProfiles,
    activeCategory,
    sortBy,
    venueTypeFilter,
    setActiveCategory: handleCategoryChange,
    setSortBy,
    setVenueTypeFilter,
    resetFilters,
    getCategoryCount
  }
}

