'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface StudioLocation {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
  priceFrom: number
}

interface StudiosMapProps {
  studios: StudioLocation[]
}

export function StudiosMap({ studios }: StudiosMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const initMap = () => {
      if (!window.ymaps) return

      window.ymaps.ready(() => {
        if (!mapRef.current) return

        // Центр карты (Москва по дефолту, или среднее по точкам)
        // Лучше взять первую точку или Москву
        const center = [55.751574, 37.573856]

        const map = new window.ymaps.Map(mapRef.current, {
          center: center,
          zoom: 9,
          controls: ['zoomControl', 'fullscreenControl'],
        })
        
        mapInstanceRef.current = map

        // Коллекция геообъектов
        const collection = new window.ymaps.GeoObjectCollection()
        const points: number[][] = []

        studios.forEach((studio) => {
          if (studio.latitude && studio.longitude) {
            points.push([studio.latitude, studio.longitude])
            
            const placemark = new window.ymaps.Placemark(
              [studio.latitude, studio.longitude],
              {
                balloonContentHeader: `<a href="/profiles/${studio.slug}" target="_blank" style="font-weight:bold; color:#000; text-decoration:none">${studio.name}</a>`,
                balloonContentBody: `<div>От ${studio.priceFrom.toLocaleString()} ₽</div>`,
                hintContent: studio.name
              },
              {
                iconLayout: 'default#image',
                iconImageHref: 'data:image/svg+xml;base64,' + btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
                  </svg>
                `),
                iconImageSize: [32, 32],
                iconImageOffset: [-16, -16]
              }
            )
            collection.add(placemark)
          }
        })

        map.geoObjects.add(collection)

        // Автозум под все точки
        if (points.length > 0) {
           // Используем явный расчет границ, как мы делали ранее, чтобы избежать ошибок конструктора
           const lats = points.map(p => p[0])
           const lons = points.map(p => p[1])
           const minLat = Math.min(...lats)
           const maxLat = Math.max(...lats)
           const minLon = Math.min(...lons)
           const maxLon = Math.max(...lons)
           
           map.setBounds([[minLat, minLon], [maxLat, maxLon]], {
             checkZoomRange: true,
             zoomMargin: 50
           })
        }

        setIsLoading(false)
      })
    }

    // Проверяем, загружен ли API
    if (window.ymaps) {
      initMap()
    } else {
      // Ждем загрузки API (обычно он в layout)
      const checkInterval = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkInterval)
          initMap()
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
      }
    }
  }, [studios])

  return (
    <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-slate-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

