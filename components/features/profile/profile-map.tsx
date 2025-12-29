'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

interface Location {
  id?: string
  city: string
  address: string | null
  name: string | null
  phone: string | null
  email: string | null
  geo_location?: {
    type: string
    coordinates: [number, number] // [longitude, latitude]
  } | null
}

interface ProfileMapProps {
  locations: Location[]
  profileName: string
}

/**
 * Компонент карты с маркерами всех адресов профиля
 * Использует Яндекс.Карты API
 */
export function ProfileMap({ locations, profileName }: ProfileMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загружаем Яндекс.Карты API
  useEffect(() => {
    // Проверяем, загружен ли уже скрипт
    if (window.ymaps) {
      window.ymaps.ready(() => {
        setIsLoaded(true)
      })
      return
    }

    // Проверяем наличие скрипта в head (добавлен через layout)
    const checkScript = setInterval(() => {
      if (window.ymaps) {
        window.ymaps.ready(() => {
          setIsLoaded(true)
          clearInterval(checkScript)
        })
      }
    }, 100)

    // Таймаут на случай если скрипт не загрузится
    const timeout = setTimeout(() => {
      clearInterval(checkScript)
      if (!window.ymaps) {
        setError('Не удалось загрузить Яндекс.Карты. Проверьте API ключ.')
      }
    }, 10000)

    return () => {
      clearInterval(checkScript)
      clearTimeout(timeout)
    }
  }, [])

  // Упрощённая функция получения координат города
  const getCityCoordinates = (city: string): [number, number] | null => {
    // Примерные координаты крупных городов России
    const cityCoords: Record<string, [number, number]> = {
      'Москва': [55.751574, 37.573856],
      'Санкт-Петербург': [59.934280, 30.335098],
      'Новосибирск': [55.008352, 82.935732],
      'Екатеринбург': [56.843099, 60.645408],
      'Казань': [55.830430, 49.066080],
      'Нижний Новгород': [56.296504, 43.936058],
      'Челябинск': [55.164442, 61.436843],
      'Самара': [53.200066, 50.140320],
      'Омск': [54.988480, 73.324236],
      'Ростов-на-Дону': [47.235713, 39.701505],
    }

    return cityCoords[city] || null
  }

  // Геокодирование адреса через Яндекс.Геокодер
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    if (!window.ymaps) {
      console.warn('[ProfileMap] ymaps not available for geocoding')
      return null
    }

    try {
      return new Promise((resolve) => {
        window.ymaps.geocode(address, {
          results: 1,
        }).then((res: any) => {
          if (!res || !res.geoObjects) {
            console.warn('[ProfileMap] No geoObjects in geocode response for:', address)
            resolve(null)
            return
          }

          const firstGeoObject = res.geoObjects.get(0)
          if (firstGeoObject) {
            const coords = firstGeoObject.geometry.getCoordinates()
            if (Array.isArray(coords) && coords.length >= 2) {
              // Яндекс.Карты возвращают [latitude, longitude]
              console.log('[ProfileMap] Geocoded:', address, '->', coords)
              resolve([coords[0], coords[1]])
            } else {
              console.warn('[ProfileMap] Invalid coordinates format for:', address)
              resolve(null)
            }
          } else {
            console.warn('[ProfileMap] No geoObject found for:', address)
            resolve(null)
          }
        }).catch((err: any) => {
          console.error('[ProfileMap] Geocoding error for', address, ':', err)
          resolve(null)
        })
      })
    } catch (err) {
      console.error('[ProfileMap] Geocoding exception for', address, ':', err)
      return null
    }
  }

  // Инициализация карты
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.ymaps || locations.length === 0) {
      return
    }

    let map: any = null
    let isMounted = true

    window.ymaps.ready(async () => {
      try {
        // Создаём карту сразу (с центром по умолчанию)
        map = new window.ymaps.Map(mapRef.current, {
          center: [59.934280, 30.335098], // Санкт-Петербург по умолчанию
          zoom: 10,
          controls: ['zoomControl', 'fullscreenControl', 'typeSelector'],
        })

        const markers: any[] = []
        const bounds: number[][] = []

        // Обрабатываем все локации асинхронно
        const geocodePromises = locations.map(async (location, index) => {
          let coordinates: [number, number] | null = null

          console.log('[ProfileMap] Processing location:', location.name || location.city, index)

          // Если есть geo_location, используем его
          if (location.geo_location?.coordinates && Array.isArray(location.geo_location.coordinates)) {
            // geo_location в формате geography(Point) - координаты в порядке [longitude, latitude]
            // Яндекс.Карты используют формат [latitude, longitude], поэтому меняем порядок
            const [lon, lat] = location.geo_location.coordinates
            coordinates = [lat, lon]
            console.log('[ProfileMap] Using geo_location:', coordinates)
          } else if (location.address && location.city) {
            // Геокодируем полный адрес
            const fullAddress = `${location.city}, ${location.address}`
            console.log('[ProfileMap] Geocoding full address:', fullAddress)
            coordinates = await geocodeAddress(fullAddress)
            
            // Если геокодирование не удалось, пробуем только город
            if (!coordinates) {
              console.log('[ProfileMap] Full address geocoding failed, trying city only:', location.city)
              coordinates = await geocodeAddress(location.city)
            }
            
            // Если и это не помогло, используем координаты города из справочника
            if (!coordinates) {
              console.log('[ProfileMap] Using city coordinates from lookup:', location.city)
              coordinates = getCityCoordinates(location.city)
              // Для разных адресов в одном городе добавляем небольшое смещение
              if (coordinates && index > 0) {
                // Добавляем небольшое смещение (0.005 градуса ≈ 500м) для каждого адреса
                const offset = index * 0.005
                coordinates = [coordinates[0] + offset, coordinates[1] + offset]
                console.log('[ProfileMap] Applied offset for multiple addresses:', offset)
              }
            }
          } else if (location.city) {
            // Геокодируем только город
            console.log('[ProfileMap] Geocoding city only:', location.city)
            coordinates = await geocodeAddress(location.city)
            
            // Если геокодирование не удалось, используем координаты из справочника
            if (!coordinates) {
              console.log('[ProfileMap] Using city coordinates from lookup:', location.city)
              coordinates = getCityCoordinates(location.city)
              // Для разных адресов в одном городе добавляем небольшое смещение
              if (coordinates && index > 0) {
                const offset = index * 0.005
                coordinates = [coordinates[0] + offset, coordinates[1] + offset]
                console.log('[ProfileMap] Applied offset for multiple addresses:', offset)
              }
            }
          }

          if (!coordinates) {
            console.warn('[ProfileMap] Could not determine coordinates for location:', location)
          }

          if (coordinates && isMounted) {
            bounds.push(coordinates)

            // Создаём маркер
            const marker = new window.ymaps.Placemark(
              coordinates,
              {
                balloonContentHeader: location.name || profileName,
                balloonContentBody: `
                  <div style="padding: 8px;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${location.name || profileName}</div>
                    <div style="color: #666; margin-bottom: 4px;">
                      📍 ${location.city}${location.address ? `, ${location.address}` : ''}
                    </div>
                    ${location.phone ? `<div style="margin-bottom: 4px;">📞 <a href="tel:${location.phone}">${location.phone}</a></div>` : ''}
                    ${location.email ? `<div>✉️ <a href="mailto:${location.email}">${location.email}</a></div>` : ''}
                  </div>
                `,
                hintContent: location.name || `${location.city}${location.address ? `, ${location.address}` : ''}`,
              },
              {
                preset: 'islands#blueIcon',
              }
            )

            markers.push(marker)
            map.geoObjects.add(marker)
          }
        })

        // Ждём завершения всех геокодирований
        await Promise.all(geocodePromises)

        if (!isMounted) return

        if (markers.length === 0 && isMounted) {
          // Если не удалось создать ни одного маркера, показываем ошибку
          console.warn('Не удалось определить координаты для адресов:', locations)
          setError('Не удалось определить координаты адресов. Проверьте правильность адресов.')
          return
        }

        // Если маркеров несколько, подстраиваем границы карты
        if (bounds.length > 1) {
          try {
            // Вычисляем границы вручную
            const lats = bounds.map(c => c[0])
            const lons = bounds.map(c => c[1])
            const minLat = Math.min(...lats)
            const maxLat = Math.max(...lats)
            const minLon = Math.min(...lons)
            const maxLon = Math.max(...lons)
            
            // Устанавливаем границы карты
            map.setBounds([
              [minLat, minLon],
              [maxLat, maxLon]
            ], {
              checkZoomRange: true,
              zoomMargin: 50,
              duration: 300,
            })
          } catch (boundsError) {
            console.error('[ProfileMap] Error setting bounds:', boundsError)
          }
        } else if (bounds.length === 1) {
          // Если один маркер, центрируем на нём
          map.setCenter(bounds[0], 15, {
            duration: 300,
          })
        }

        // Очистка при размонтировании
        return () => {
          isMounted = false
          if (map) {
            map.destroy()
          }
        }
      } catch (err: any) {
        console.error('Error initializing map:', err)
        if (isMounted) {
          setError('Ошибка инициализации карты')
        }
      }
    })

    return () => {
      isMounted = false
      if (map) {
        map.destroy()
      }
    }
  }, [isLoaded, locations, profileName])

  if (error) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (locations.length === 0) {
    return null
  }

  return (
    <div className="w-full relative">
      <div ref={mapRef} className="w-full h-[400px] rounded-lg overflow-hidden border" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Загрузка карты...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Расширяем Window для TypeScript
declare global {
  interface Window {
    ymaps: any
  }
}
