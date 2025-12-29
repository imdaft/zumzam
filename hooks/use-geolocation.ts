import { useState, useEffect } from 'react'

interface Coordinates {
  latitude: number
  longitude: number
}

interface GeoLocationState {
  coordinates: Coordinates | null
  error: string | null
  isLoading: boolean
}

export function useGeoLocation() {
  const [state, setState] = useState<GeoLocationState>({
    coordinates: null,
    error: null,
    isLoading: true, // Начинаем загрузку сразу, пытаясь определить
  })

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState(prev => ({
        ...prev,
        error: 'Геолокация не поддерживается вашим браузером',
        isLoading: false
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          isLoading: false,
        })
      },
      (error) => {
        setState({
          coordinates: null,
          error: error.message,
          isLoading: false,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }, [])

  return state
}

