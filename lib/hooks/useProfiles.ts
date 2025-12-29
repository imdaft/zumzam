/**
 * Хук для загрузки и управления профилями
 * Использует API endpoint вместо прямого доступа к БД
 */

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface Profile {
  id: string
  category: string
  slug: string
  name: string
  city: string
  rating: number
  reviewsCount: number
  priceFrom: number
  priceFromVisit: number | null
  budgetCategory: string | null
  details: Record<string, any>
  photos: string[]
  tags: string[]
  featured: boolean
  verified: boolean
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  workingHours: string | null
  description: string | null
}

interface UseProfilesReturn {
  profiles: Profile[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProfiles(): UseProfilesReturn {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfiles = async () => {
    logger.debug('[useProfiles] Fetching profiles from API...')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/profiles/public')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array')
      }

      logger.debug('[useProfiles] Profiles loaded', { count: data.length })
      setProfiles(data)
    } catch (err: any) {
      logger.error('[useProfiles] Error fetching profiles', err)
      setError(err)
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  return {
    profiles,
    isLoading,
    error,
    refetch: fetchProfiles
  }
}
