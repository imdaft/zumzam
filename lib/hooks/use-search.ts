'use client'

import { useState, useEffect, useCallback } from 'react'

export interface SearchFilters {
  city?: string
  priceMin?: number
  priceMax?: number
  ageFrom?: number
  ageTo?: number
  tags?: string[]
}

export interface SearchResult {
  services: any[]
  profiles: any[]
  total: number
  isLoading: boolean
  error: string | null
}

/**
 * Хук для управления поиском
 */
export function useSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [results, setResults] = useState<SearchResult>({
    services: [],
    profiles: [],
    total: 0,
    isLoading: false,
    error: null,
  })

  // Поиск услуг
  const searchServices = useCallback(async (searchQuery: string, searchFilters: SearchFilters = {}) => {
    if (!searchQuery.trim()) {
      setResults({
        services: [],
        profiles: [],
        total: 0,
        isLoading: false,
        error: null,
      })
      return
    }

    setResults(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Строим query params
      const params = new URLSearchParams()
      params.append('q', searchQuery)
      params.append('active', 'true')
      
      if (searchFilters.city) params.append('city', searchFilters.city)
      if (searchFilters.priceMin !== undefined) params.append('priceMin', searchFilters.priceMin.toString())
      if (searchFilters.priceMax !== undefined) params.append('priceMax', searchFilters.priceMax.toString())
      if (searchFilters.ageFrom !== undefined) params.append('ageFrom', searchFilters.ageFrom.toString())
      if (searchFilters.ageTo !== undefined) params.append('ageTo', searchFilters.ageTo.toString())
      if (searchFilters.tags && searchFilters.tags.length > 0) {
        searchFilters.tags.forEach(tag => params.append('tags', tag))
      }

      // Пока используем обычный API услуг (в День 16 добавим семантический поиск)
      const response = await fetch(`/api/services?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Ошибка поиска')
      }

      const data = await response.json()

      setResults({
        services: data.services || [],
        profiles: [], // Пока не ищем профили
        total: data.total || 0,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      console.error('Search error:', error)
      setResults(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Ошибка поиска',
      }))
    }
  }, [])

  // Автоматический поиск при изменении query или filters
  useEffect(() => {
    if (query) {
      searchServices(query, filters)
    }
  }, [query, filters, searchServices])

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    search: searchServices,
  }
}

