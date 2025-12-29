'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AddressSelectorProps {
  city: string
  address: string
  onAddressChange: (address: string, coordinates: [number, number] | null) => void
  placeholder?: string
  label?: string
  required?: boolean
}

/**
 * Компонент выбора адреса с Яндекс.Картами, автодополнением и перетаскиванием маркера
 */
export function AddressSelector({
  city,
  address,
  onAddressChange,
  placeholder = 'Введите адрес',
  label,
  required = false,
}: AddressSelectorProps) {
  interface AddressSuggestion {
    value: string
    fullValue?: string
    coordinates: [number, number]
  }
  
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const suggestRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Инициализация Яндекс.Карт
  useEffect(() => {
    if (!window.ymaps) {
      const checkScript = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkScript)
          initYandexMaps()
        }
      }, 100)

      const timeout = setTimeout(() => {
        clearInterval(checkScript)
        console.warn('Yandex Maps загружается медленно. Если карта не появится, проверьте подключение к интернету.')
      }, 10000)

      return () => {
        clearInterval(checkScript)
        clearTimeout(timeout)
      }
    } else {
      initYandexMaps()
    }
  }, [])

  const initYandexMaps = () => {
    if (!window.ymaps) return

    window.ymaps.ready(() => {
      // Инициализируем Suggest API для автодополнения
      if (window.ymaps.Suggest) {
        suggestRef.current = new window.ymaps.Suggest('', {
          provider: {
            suggest: (request: string) => {
              return window.ymaps.geocode(request, {
                results: 5,
              })
            },
          },
        })

        suggestRef.current.events.add('select', (e: any) => {
          const selectedItem = e.get('item')
          if (selectedItem) {
            const value = selectedItem.value
            inputRef.current!.value = value
            setShowSuggestions(false)
            handleAddressSelect(value)
          }
        })
      }

      setMapLoaded(true)
    })
  }

  // Обработка ввода адреса
  const handleInputChange = (value: string) => {
    onAddressChange(value, null)
    setIsValid(null)
    setCoordinates(null)

    // Если город не выбран, не показываем подсказки
    if (!city || city.trim() === '') {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Используем геокодирование для получения подсказок с учетом города
    if (window.ymaps && mapLoaded) {
      // Формируем запрос с городом: "Санкт-Петербург, улица Ленина"
      const queryWithCity = `${city}, ${value}`
      
      window.ymaps.geocode(queryWithCity, {
        results: 10, // Больше результатов для фильтрации
      }).then((res: any) => {
        const geoObjects = res.geoObjects.toArray()
        
        // Фильтруем результаты по городу (проверяем, что результат относится к выбранному городу)
        const cityLower = city.toLowerCase().trim()
        const filteredSuggestions = geoObjects
          .filter((obj: any) => {
            const addressText = obj.properties.get('text') || ''
            const addressLower = addressText.toLowerCase()
            // Проверяем, что в адресе есть выбранный город
            return addressLower.includes(cityLower)
          })
          .slice(0, 5) // Ограничиваем до 5 результатов
          .map((obj: any) => {
            const fullAddress = obj.properties.get('text') || ''
            // Убираем название города из начала, так как оно уже в поле города
            let displayAddress = fullAddress
            if (fullAddress.toLowerCase().startsWith(cityLower + ',')) {
              displayAddress = fullAddress.substring(city.length + 1).trim()
            }
            return {
              value: displayAddress,
              fullValue: fullAddress, // Сохраняем полный адрес для геокодирования
              coordinates: obj.geometry.getCoordinates(),
            }
          })
        
        setSuggestions(filteredSuggestions)
        setShowSuggestions(true)
      }).catch(() => {
        setSuggestions([])
      })
    }
  }

  // Обработка выбора адреса из подсказок
  const handleAddressSelect = async (selectedAddress: string, fullAddress?: string) => {
    setShowSuggestions(false)
    setIsGeocoding(true)
    setIsValid(null)

    try {
      if (window.ymaps && city) {
        // Используем полный адрес (с городом) для геокодирования
        const addressForGeocode = fullAddress || `${city}, ${selectedAddress}`
        
        const res = await window.ymaps.geocode(addressForGeocode, {
          results: 1,
        })

        const firstGeoObject = res.geoObjects.get(0)
        if (firstGeoObject) {
          const coords = firstGeoObject.geometry.getCoordinates()
          // Яндекс.Карты возвращают [latitude, longitude]
          const [lat, lon] = coords
          
          // Получаем полный адрес для сохранения
          const completeAddress = firstGeoObject.properties.get('text') || addressForGeocode

          setCoordinates([lat, lon])
          setIsValid(true)
          // Сохраняем адрес без города в начале (город уже в отдельном поле)
          onAddressChange(selectedAddress, [lat, lon])

          // Обновляем карту с полным адресом
          updateMap([lat, lon], completeAddress)
        } else {
          setIsValid(false)
          setCoordinates(null)
          onAddressChange(selectedAddress, null)
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setIsValid(false)
      setCoordinates(null)
    } finally {
      setIsGeocoding(false)
    }
  }

  // Обработка окончания перетаскивания маркера
  const handleMarkerDragEnd = async (e: any) => {
    const newCoords = e.get('target').geometry.getCoordinates()
    setIsDragging(true)
    
    try {
      if (!city || city.trim() === '') {
        console.warn('[AddressSelector] City not selected for reverse geocoding')
        setIsDragging(false)
        return
      }

      // Обратное геокодирование
      const res = await window.ymaps.geocode(newCoords)
      const firstGeoObject = res.geoObjects.get(0)
      
      if (firstGeoObject) {
        const fullAddress = firstGeoObject.getAddressLine()
        const addressText = firstGeoObject.properties.get('text') || fullAddress
        
        // Проверяем, что адрес относится к выбранному городу
        const cityLower = city.toLowerCase().trim()
        const addressLower = addressText.toLowerCase()
        
        if (!addressLower.includes(cityLower)) {
          // Адрес не относится к выбранному городу
          setIsValid(false)
          setIsDragging(false)
          alert(`⚠️ Выбранный адрес не относится к городу "${city}". Выберите адрес в пределах выбранного города.`)
          
          // Возвращаем маркер на прежнее место
          if (coordinates) {
            e.get('target').geometry.setCoordinates(coordinates)
          }
          return
        }
        
        // Убираем название города из начала адреса
        let displayAddress = addressText
        if (addressText.toLowerCase().startsWith(cityLower + ',')) {
          displayAddress = addressText.substring(city.length + 1).trim()
        } else if (addressText.toLowerCase().startsWith(cityLower + ' ')) {
          displayAddress = addressText.substring(city.length + 1).trim()
        }
        
        // Обновляем инпут и состояние
        if (inputRef.current) {
          inputRef.current.value = displayAddress
        }
        
        setCoordinates(newCoords)
        onAddressChange(displayAddress, newCoords)
        setIsValid(true)
        
        // Обновляем контент балуна
        e.get('target').properties.set({
          balloonContentHeader: addressText,
          balloonContentBody: addressText,
          hintContent: addressText,
        })
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      setIsValid(false)
    } finally {
      setIsDragging(false)
    }
  }

  // Обновление карты с маркером
  const updateMap = (coords: [number, number], addressText: string) => {
    if (!window.ymaps) {
      console.warn('[AddressSelector] ymaps not available, waiting...')
      // Ждём загрузки ymaps
      const checkInterval = setInterval(() => {
        if (window.ymaps && mapRef.current) {
          clearInterval(checkInterval)
          updateMap(coords, addressText)
        }
      }, 100)
      
      setTimeout(() => clearInterval(checkInterval), 5000)
      return
    }

    if (!mapRef.current) {
      console.warn('[AddressSelector] mapRef not ready')
      return
    }

    window.ymaps.ready(() => {
      try {
        // Удаляем старую карту, если есть
        if (mapInstanceRef.current) {
          // Если карта уже есть, просто меняем центр и зум, если нужно
          // Но лучше пересоздать маркер
          const map = mapInstanceRef.current
          map.setCenter(coords, 15)

          if (markerRef.current) {
            map.geoObjects.remove(markerRef.current)
          }
          
          const marker = new window.ymaps.Placemark(
            coords,
            {
              balloonContentHeader: addressText,
              balloonContentBody: addressText,
              hintContent: addressText,
            },
            {
              preset: 'islands#blueIcon',
              draggable: true, // Разрешаем перетаскивание
            }
          )
          
          marker.events.add('dragend', handleMarkerDragEnd)
          
          map.geoObjects.add(marker)
          markerRef.current = marker
          return
        }

        // Создаём новую карту
        const map = new window.ymaps.Map(mapRef.current, {
          center: coords,
          zoom: 15,
          controls: ['zoomControl', 'fullscreenControl'],
        })

        // Создаём новый маркер
        const marker = new window.ymaps.Placemark(
          coords,
          {
            balloonContentHeader: addressText,
            balloonContentBody: addressText,
            hintContent: addressText,
          },
          {
            preset: 'islands#blueIcon',
            draggable: true, // Разрешаем перетаскивание
          }
        )

        marker.events.add('dragend', handleMarkerDragEnd)

        map.geoObjects.add(marker)
        markerRef.current = marker
        mapInstanceRef.current = map
        
        console.log('[AddressSelector] Map updated successfully with coordinates:', coords)
      } catch (error: any) {
        console.error('[AddressSelector] Error updating map:', error)
      }
    })
  }

  // Очищаем адрес и координаты при смене города
  useEffect(() => {
    if (!city || city.trim() === '') {
      // Если город очищен, очищаем адрес и координаты
      if (address && inputRef.current) {
        inputRef.current.value = ''
        onAddressChange('', null)
      }
      setSuggestions([])
      setShowSuggestions(false)
      setIsValid(null)
      setCoordinates(null)
    }
  }, [city]) // eslint-disable-line react-hooks/exhaustive-deps

  // Обновляем карту при изменении coordinates
  useEffect(() => {
    if (coordinates && mapLoaded && address && mapRef.current && city) {
      // Если координаты изменились извне (не через драг), обновляем карту
      // Важно не перерисовывать карту, если мы сами её драгаем
      if (!isDragging) {
        const timeoutId = setTimeout(() => {
          // Формируем полный адрес для отображения на карте
          const fullAddress = city && address ? `${city}, ${address}` : address
          updateMap(coordinates, fullAddress)
        }, 100)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [coordinates, mapLoaded, address, isDragging, city])

  return (
    <div className="space-y-4">
      {/* Поле ввода адреса */}
      <div className="space-y-2">
        {label && (
          <label className="text-[13px] font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {(!city || city.trim() === '') && (
              <span className="text-xs text-gray-400 font-normal ml-2">
                (Сначала выберите город выше)
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            value={address}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 && city) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => {
              // Задержка для обработки клика по подсказке
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            placeholder={!city ? 'Сначала выберите город' : placeholder}
            className="h-12 rounded-[16px] pl-11 border-gray-200 focus:ring-orange-500 text-[13px]"
            disabled={isGeocoding || isDragging || !city || city.trim() === ''}
          />
          
          {(isGeocoding || isDragging) && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            </div>
          )}

          {isValid === true && !isGeocoding && !isDragging && (
            <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
          )}

          {isValid === false && !isGeocoding && !isDragging && (
            <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
          )}

          {/* Информационное сообщение, если город не выбран */}
          {!city && address.length > 0 && (
            <div className="mt-2">
              <Alert className="border-blue-200 bg-blue-50 rounded-[12px]">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-[13px] text-blue-700">
                  Сначала выберите город, чтобы автодополнение адресов работало правильно.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Подсказки */}
          {showSuggestions && suggestions.length > 0 && city && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-[16px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAddressSelect(suggestion.value, suggestion.fullValue)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-[16px] last:rounded-b-[16px]"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[13px] text-gray-700">{suggestion.value}</span>
                      {suggestion.fullValue && suggestion.fullValue !== suggestion.value && (
                        <span className="text-[11px] text-gray-400">{suggestion.fullValue}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Статус валидации */}
        {isValid === true && coordinates && (
          <Alert className="border-green-200 bg-green-50 rounded-[12px]">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-[13px] text-green-700">
              Адрес найден. Вы можете уточнить местоположение, перетащив маркер на карте.
            </AlertDescription>
          </Alert>
        )}

        {isValid === false && (
          <Alert variant="destructive" className="rounded-[12px]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-[13px]">
              Не удалось найти адрес. Проверьте правильность написания.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Карта для визуальной проверки */}
      {coordinates && (
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-gray-700 flex items-center gap-2">
            Уточнение на карте
            <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">
              Можно перетаскивать маркер
            </span>
          </label>
          <div className="relative w-full h-[300px] rounded-[16px] border border-gray-200 overflow-hidden shadow-sm">
            <div
              ref={mapRef}
              className="w-full h-full"
            />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-[16px] z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-500">Загрузка карты...</p>
                </div>
              </div>
            )}
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
