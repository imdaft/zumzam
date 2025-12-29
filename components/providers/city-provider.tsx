'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type City = {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
}

export const CITIES: City[] = [
  { id: 'msk', name: 'Москва', slug: 'moscow', latitude: 55.7558, longitude: 37.6173 },
  { id: 'spb', name: 'Санкт-Петербург', slug: 'spb', latitude: 59.9343, longitude: 30.3351 },
]

interface CityContextType {
  currentCity: City
  setCity: (city: City) => void
}

const CityContext = createContext<CityContextType | undefined>(undefined)

export function CityProvider({ children }: { children: React.ReactNode }) {
  // Санкт-Петербург по умолчанию (там больше профилей)
  const [currentCity, setCurrentCity] = useState<City>(CITIES[1])
  const [isHydrated, setIsHydrated] = useState(false)

  // При загрузке достаём из localStorage (только после гидрации)
  useEffect(() => {
    setIsHydrated(true)
    const savedCityId = localStorage.getItem('selected_city_id')
    if (savedCityId) {
      const city = CITIES.find(c => c.id === savedCityId)
      if (city) setCurrentCity(city)
    }
  }, [])

  const setCity = (city: City) => {
    setCurrentCity(city)
    localStorage.setItem('selected_city_id', city.id)
  }

  return (
    <CityContext.Provider value={{ currentCity, setCity }}>
      {children}
    </CityContext.Provider>
  )
}

export function useCity() {
  const context = useContext(CityContext)
  if (context === undefined) {
    throw new Error('useCity must be used within a CityProvider')
  }
  return context
}

