'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { ProfileCard } from '@/components/features/profile/profile-card'
import { Loader2, Map as MapIcon, LayoutList, X, Phone, Globe, MapPin, Clock, Plus, Minus, Navigation, ChevronUp, ChevronDown, Filter, List, Search, ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { DraggableBottomSheet, useBottomSheetSnap } from '@/components/ui/draggable-bottom-sheet'

// Хук для определения мобильного устройства
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // На сервере и при первом рендере возвращаем false
  // чтобы избежать hydration mismatch
  if (!mounted) return false
  
  return isMobile
}

interface StudioLocation {
  id: string
  address: string
  city: string
  lat: number
  lng: number
  is_main: boolean
}

interface Studio {
  id: string
  slug: string
  name: string
  city: string
  rating: number
  reviewsCount: number
  priceFrom: number
  photos: string[]
  tags: string[]
  verified?: boolean
  featured?: boolean
  latitude: number
  longitude: number
  locations?: StudioLocation[]
  phone?: string
  website?: string
  workingHours?: string
  description?: string
  category?: string
}

interface MapWithListProps {
  studios: Studio[]
  onBack?: () => void // Callback для выхода из режима карты (мобильные)
  title?: string // Заголовок для мобильного header
}

export function MapWithList({ studios, onBack, title = 'На карте' }: MapWithListProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null) // Храним инстанс в ref для синхронного доступа
  const [mapInstance, setMapInstance] = useState<any>(null) // State для реактивности (если нужно)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null)
  const [hoveredStudioId, setHoveredStudioId] = useState<string | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<{lat: number, lng: number} | null>(null)
  const [viewedStudios, setViewedStudios] = useState<Set<string>>(new Set()) // Просмотренные маркеры
  const markersRef = useRef<Map<string, { blue: any; orange: any; studioId: string }>>(new Map()) // Два маркера на точку!
  const labelsRef = useRef<Map<string, any>>(new Map()) // Метки рядом с маркерами
  // Храним фактические координаты маркеров (после геокодирования)
  const markerCoordsRef = useRef<Map<string, { lat: number; lng: number; studioId: string }>>(new Map())
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const [visibleStudios, setVisibleStudios] = useState<Studio[]>(studios)
  const [displayedStudios, setDisplayedStudios] = useState<Studio[]>(studios)
  const [currentZoom, setCurrentZoom] = useState(10)
  const permanentlyVisibleLabelsRef = useRef<Set<string>>(new Set()) // Метки, которые всегда видны (храним studioId)
  const lastHoveredLabelRef = useRef<string | null>(null) // ID последней показанной hover-метки (studioId)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Таймер для дебаунса hover enter
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Таймер для дебаунса hover leave
  const lastHoveredIdRef = useRef<string | null>(null) // Последний наведенный ID (studioId)
  
  // Расширенная карточка при клике на маркер
  const [expandedStudio, setExpandedStudio] = useState<Studio | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<StudioLocation | null>(null) // Выбранная локация для отображения адреса
  
  // Mobile detection и sheet snap - объявляем ДО первого использования
  const isMobile = useIsMobile()
  const { snap: sheetSnap, setSnap: setSheetSnap } = useBottomSheetSnap(0) // Начинаем с collapsed
  
  // Кэш предыдущего состояния маркеров для оптимизации
  const markersStateRef = useRef<Map<string, { isSelected: boolean; isHovered: boolean; isViewed: boolean }>>(new Map())
  
  // Функция для вычисления размера круга на основе зума
  const getCircleSize = useCallback((zoom: number): number => {
    if (zoom <= 7) return 12
    if (zoom >= 15) return 20
    return Math.round(12 + ((zoom - 7) / (15 - 7)) * (20 - 12))
  }, [])
  
  // Функция для вычисления размера SVG маркера-пина
  const getPinSize = useCallback((zoom: number, isSelected: boolean = false): { width: number; height: number } => {
    let baseHeight = 0
    if (zoom <= 7) baseHeight = 24
    else if (zoom >= 15) baseHeight = 40
    else baseHeight = Math.round(24 + ((zoom - 7) / (15 - 7)) * (40 - 24))
    
    if (isSelected) {
      baseHeight = Math.round(baseHeight * 1.5)
    }
    
    const width = Math.round(baseHeight * 0.69)
    return { width, height: baseHeight }
  }, [])
  
  // Функция для обновления внешнего вида маркеров (показать синий или оранжевый)
  const updateSingleMarker = useCallback((markerPair: { blue: any; orange: any }, id: string, zoom: number, isSelected: boolean, isHovered: boolean, isViewed: boolean) => {
    // ПРОВЕРКА: если пара маркеров некорректна (старые данные), пропускаем
    if (!markerPair || !markerPair.blue || !markerPair.orange) {
      return
    }
    
    // Проверяем, изменилось ли состояние (предотвращаем лишние обновления)
    const prevState = markersStateRef.current.get(id)
    
    // Если состояние не изменилось - не обновляем (предотвращаем мерцание)
    if (prevState && 
        prevState.isSelected === isSelected && 
        prevState.isHovered === isHovered && 
        prevState.isViewed === isViewed) {
      return // Состояние не изменилось, ничего не делаем
    }
    
    // Сохраняем новое состояние
    markersStateRef.current.set(id, { isSelected, isHovered, isViewed })
    
    // Активный маркер (выбранный или наведенный) - показываем оранжевый ПОВЕРХ синего
    if (isSelected || isHovered) {
      markerPair.orange.options.set({
        zIndex: isSelected ? 10000 : 9000,
        visible: true, // Включаем рендер
        opacity: 1 // Показываем оранжевый ПОВЕРХ синего
      })
    } else {
      // Неактивный маркер - скрываем оранжевый
      
      // Проверяем, изменился ли статус просмотра (чтобы обновить цвет синего)
      if (prevState && prevState.isViewed !== isViewed) {
        const circleSize = getCircleSize(zoom)
        const halfSize = circleSize / 2
        const fillColor = isViewed ? '#94a3b8' : '#3b82f6'
        
        // Обновляем ТОЛЬКО цвет синего маркера (если isViewed изменился)
        markerPair.blue.options.set({
          iconImageHref: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${circleSize}" height="${circleSize}" viewBox="0 0 ${circleSize} ${circleSize}">
              <circle cx="${halfSize}" cy="${halfSize}" r="${Math.max(halfSize - 1, 2)}" fill="${fillColor}" stroke="white" stroke-width="1"/>
            </svg>
          `),
          iconImageSize: [circleSize, circleSize],
          iconImageOffset: [-halfSize, -halfSize]
        })
      }
      
      // Скрываем оранжевый
      markerPair.orange.options.set({
        visible: false, // Выключаем рендер
        opacity: 0 // Дополнительно opacity
      })
    }
  }, [getCircleSize])
  
  // Функция для обновления внешнего вида маркеров
  const updateMarkersAppearance = useCallback((zoom: number, hoveredStudioId: string | null = null, selectedStudioId: string | null = null, viewedStudiosIds: Set<string> = new Set()) => {
    if (!markersRef.current || markersRef.current.size === 0) return
    
    markersRef.current.forEach((markerPair, markerId) => {
      const markerStudioId = markerPair.studioId
      
      const isSelected = markerStudioId === selectedStudioId
      const isHovered = markerStudioId === hoveredStudioId && !isSelected
      const isViewed = viewedStudiosIds.has(markerStudioId) && !isSelected
      
      updateSingleMarker(markerPair, markerId, zoom, isSelected, isHovered, isViewed)
    })
    
    // Обновляем метки (labels)
    if (labelsRef.current) {
        labelsRef.current.forEach((labelData, markerId) => {
            const labelStudioId = labelData.studioId
            const isHovered = labelStudioId === hoveredStudioId
            
            if (labelData.label) {
                if (isHovered) {
                    labelData.label.options.set('visible', true)
                    labelData.label.options.set('zIndex', 2000)
                } else {
                    // Если метка не должна быть постоянно видима - скрываем
                    // Здесь логика упрощена: если не hover, скрываем (или оставляем как было если это permanent)
                    // Полная логика меток в updateLabelsVisibility, здесь только hover эффект
                    const isPermanent = permanentlyVisibleLabelsRef.current.has(labelStudioId)
                    if (!isPermanent) {
                        labelData.label.options.set('visible', false)
                    }
                    labelData.label.options.set('zIndex', 1500)
                }
            }
        })
    }
  }, [updateSingleMarker])
  
  // Функция для геокодирования адреса с улучшенной точностью
  const geocodeAddress = useCallback(async (address: string): Promise<[number, number] | null> => {
    if (!window.ymaps) return null
    try {
      const res = await window.ymaps.geocode(address, { 
        results: 1,
        boundedBy: undefined 
      })
      const firstGeoObject = res.geoObjects.get(0)
      if (firstGeoObject) {
        const coords = firstGeoObject.geometry.getCoordinates()
        return [coords[1], coords[0]]
      }
    } catch (e) {
      console.error('[MapWithList] Geocoding error:', e)
    }
    return null
  }, [])

  // Функция для автоматической прокрутки к карточке в списке
  const scrollToCard = useCallback((id: string) => {
    const element = document.getElementById(`studio-card-${id}`)
    const container = cardsContainerRef.current
    
    if (!element || !container) return
    
    const totalCards = container.querySelectorAll('[id^="studio-card-"]').length
    if (totalCards <= 3) return
    
    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    
    const isElementVisible = 
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom
    
    if (isElementVisible) return
    
    const startScrollTop = container.scrollTop
    const elementOffsetTop = element.offsetTop - container.offsetTop
    const maxScrollTop = container.scrollHeight - container.clientHeight
    
    let targetScrollTop
    
    if (elementRect.top < containerRect.top) {
      targetScrollTop = elementOffsetTop - 16
    } else if (elementRect.bottom > containerRect.bottom) {
      targetScrollTop = elementOffsetTop - container.clientHeight + element.clientHeight + 16
    } else {
      return
    }
    
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))
    const distance = targetScrollTop - startScrollTop
    
    if (Math.abs(distance) <= 5) return
    
    const duration = 400
    const startTime = performance.now()
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      const currentScroll = startScrollTop + distance * easeProgress
      container.scrollTop = currentScroll
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }
    
    requestAnimationFrame(animateScroll)
  }, [])

  useEffect(() => {
    let initId = 0

    const initMap = async () => {
      if (!window.ymaps || !mapRef.current) return

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
        markersRef.current.clear()
        markersStateRef.current.clear()
        markerCoordsRef.current.clear()
      }
      
      if (mapRef.current.childNodes.length > 0) {
         mapRef.current.innerHTML = ''
      }
      
      const currentInitId = Date.now()
      initId = currentInitId

      window.ymaps.ready(async () => {
        if (!mapRef.current) return
        if (initId !== currentInitId) return
        
        if (mapRef.current.childNodes.length > 0) {
           mapRef.current.innerHTML = ''
        }

        const center = studios.length > 0 
          ? [studios[0].latitude, studios[0].longitude]
          : [55.751574, 37.573856]

        const isMobileDevice = window.innerWidth < 1024
        
        const map = new window.ymaps.Map(mapRef.current, {
          center: center,
          zoom: 11,
          controls: isMobileDevice ? [] : ['zoomControl'],
        }, {
          suppressMapOpenBlock: true,
        })
        
        map.behaviors.enable(['drag', 'scrollZoom', 'dblClickZoom', 'multiTouch'])

        mapInstanceRef.current = map
        setMapInstance(map)
        setCurrentZoom(10)

        const HintLayout = window.ymaps.templateLayoutFactory.createClass(
          '<div class="yandex-hint-custom" style="' +
            'position: absolute; ' +
            'background: white; ' +
            'color: #1f2937; ' +
            'border-radius: 8px; ' +
            'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); ' +
            'padding: 8px 12px; ' +
            'border: 1px solid #e5e7eb; ' +
            'font-family: system-ui, -apple-system, sans-serif; ' +
            'font-size: 12px; ' +
            'white-space: nowrap; ' +
            'pointer-events: none; ' +
            'z-index: 1000;' +
          '">' +
            '$[properties.hintContent]' +
          '</div>',
          {
            build: function () {
              HintLayout.superclass.build.call(this)
            },
            getShape: function () {
              const element = this.getElement()
              if (!element) return null
              const offset = this.getData().options.get('hintOffset', [15, -10])
              return new window.ymaps.shape.Rectangle(
                new window.ymaps.geometry.pixel.Rectangle([
                  [offset[0], offset[1]],
                  [offset[0] + element.offsetWidth, offset[1] + element.offsetHeight]
                ])
              )
            }
          }
        )
        
        map.options.set('hintLayout', HintLayout)

        const initialCircleSize = getCircleSize(10)
        const initialHalfSize = initialCircleSize / 2

        markersRef.current.clear()
        markersStateRef.current.clear()

        for (const studio of studios) {
          const locationsToAdd = studio.locations && studio.locations.length > 0
            ? studio.locations
            : [{
                id: `${studio.id}-main`,
                address: studio.city,
                city: studio.city?.split(',')[0] || '',
                lat: studio.latitude,
                lng: studio.longitude,
                is_main: true
              }]
          
          for (const location of locationsToAdd) {
            let finalLat = location.lat
            let finalLng = location.lng
            
            const isDefaultCoords = Math.abs(finalLat - 59.9343) < 0.001 && Math.abs(finalLng - 30.3351) < 0.001
            
            if (isDefaultCoords) {
              let fullAddress = ''
              if (location.city && location.address) {
                fullAddress = `${location.city}, ${location.address}`
              } else if (location.address) {
                fullAddress = location.address
                if (!location.address.includes(',')) {
                  if (location.city) {
                    fullAddress = `${location.city}, ${location.address}`
                  }
                }
              } else if (location.city) {
                fullAddress = location.city
              }
              
              if (fullAddress) {
                const geocoded = await geocodeAddress(fullAddress)
                if (geocoded) {
                  finalLat = geocoded[0]
                  finalLng = geocoded[1]
                  const markerId = `${studio.id}-${location.id}`
                  markerCoordsRef.current.set(markerId, { lat: finalLat, lng: finalLng, studioId: studio.id })
                }
              }
            }
            
            const markerId = `${studio.id}-${location.id}`
            
            let addressWithoutCity = location.address || studio.city
            if (addressWithoutCity && addressWithoutCity.includes(',')) {
              const parts = addressWithoutCity.split(',').map(p => p.trim())
              if (parts.length > 1) {
                addressWithoutCity = parts.slice(1).join(', ')
              }
            }

          const hintContent = 
            `<div style="font-size: 12px; font-weight: 500; color: #1f2937; line-height: 1.3; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${studio.name}</div>` +
            `<div style="font-size: 11px; line-height: 1.2; white-space: nowrap;">` +
              `<span style="color: #f59e0b;">★ ${studio.rating}</span>` +
              ` ` +
              `<span style="color: #9ca3af;">(${studio.reviewsCount})</span>` +
              (studio.priceFrom > 0 ? ` <span style="color: #10b981; font-weight: 500; margin-left: 4px;">от ${studio.priceFrom.toLocaleString('ru')}₽</span>` : '') +
            `</div>`

          // 1a. СИНИЙ маркер
          const blueMarker = new window.ymaps.Placemark(
            [finalLat, finalLng],
            {
              hintContent: hintContent,
              name: studio.name,
              address: addressWithoutCity,
              price: studio.priceFrom.toLocaleString('ru')
            },
            {
              iconLayout: 'default#image',
              iconImageHref: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="${initialCircleSize}" height="${initialCircleSize}" viewBox="0 0 ${initialCircleSize} ${initialCircleSize}">
                  <circle cx="${initialHalfSize}" cy="${initialHalfSize}" r="${Math.max(initialHalfSize - 1, 2)}" fill="#3b82f6" stroke="white" stroke-width="2"/>
                </svg>
              `),
              iconImageSize: [initialCircleSize, initialCircleSize],
              iconImageOffset: [-initialHalfSize, -initialHalfSize],
              iconShape: {
                type: 'Circle',
                coordinates: [0, 0],
                radius: initialCircleSize * 0.75
              },
              zIndex: 500,
              hasBalloon: false,
              hasHint: false,
              cursor: 'pointer',
              visible: true,
              opacity: 1
            }
          )
          
          // 1b. ОРАНЖЕВЫЙ маркер
          const { width: orangeWidth, height: orangeHeight } = getPinSize(currentZoom, true)
          const orangeMarkerSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 181.4 262.3"><style>.st0{fill:#F16F2C;}.st1{fill:#FFFFFF;}</style><g><path class="st0" d="M82,3.8c18.9-3,42.3,4,58.1,14.6c19.4,13.1,32.8,33.4,37.1,56.4c7.4,37.9-14,73.3-31.5,105.3c-14.6,26.7-32.1,51.5-49.2,76.7c-8.8,9.9-17.6-8.1-22.1-15.2c-24.8-39.4-64-93.3-71.3-139.9C-4.3,54.1,34.5,9.7,82,3.8z"/><path class="st1" d="M87.2,30.2c33.7-2,62.8,23.6,64.8,57.4c2.1,33.7-23.6,62.8-57.3,64.9c-33.8,2.1-62.9-23.6-65-57.4C27.6,61.3,53.4,32.3,87.2,30.2z"/><path class="st0" d="M55.2,100.2c5.9,0.2,9.2,8,15.4,12.8c12.2,9.4,27.9,8.8,40.8,1.1c4.8-2.9,9.4-13.1,14.7-13.8c3.5,1.6,2.4,4.8,1.3,7.6c-6.1,8.1-11.9,13.7-21.7,17c-11.1,3.7-23.2,2.9-33.7-2.2c-6.3-3.1-15.8-9.9-18-17.1C53.2,103.1,54.1,102.3,55.2,100.2z"/><path class="st0" d="M66.1,66.9c10.2-0.2,19,9.4,11.6,15.1c-5.2-0.3-3-3.3-7.5-7.5l-0.1-0.1c-8.8,0.5-4.5,2.8-10.8,7.2c-1.1,0.8-4.3,0.3-5.1-2.5C55.3,72.8,60.1,68.4,66.1,66.9z"/><path class="st0" d="M111.4,66.8c3.2-0.2,6.4-0.2,9.3,1.2c2.7,1.2,4.7,3.5,5.6,6.3c0.8,2.5,0.6,4.3-0.6,6.6c-1.9,1.3-1,1.1-3.3,0.8c-1.6-0.8-3.1-4.7-4.5-6.9c-10.1-2.8-6.3,6.2-13,7.5C96.9,78.3,105.8,69.4,111.4,66.8z"/></g></svg>`
          
          const orangeMarker = new window.ymaps.Placemark(
            [finalLat, finalLng],
            {
              hintContent: hintContent,
              name: studio.name,
              address: addressWithoutCity,
              price: studio.priceFrom.toLocaleString('ru')
            },
            {
              iconLayout: 'default#image',
              iconImageHref: 'data:image/svg+xml;base64,' + btoa(orangeMarkerSvg),
              iconImageSize: [orangeWidth, orangeHeight],
              iconImageOffset: [-orangeWidth / 2, -orangeHeight],
              iconShape: {
                type: 'Circle',
                coordinates: [0, 0],
                radius: initialCircleSize * 0.75
              },
              zIndex: 9000,
              hasBalloon: false,
              hasHint: false,
              cursor: 'pointer',
              pane: 'overlaps',
              visible: false
            }
          )
          
          const placemark = blueMarker
          
          orangeMarker.properties.set('studioId', studio.id)
          orangeMarker.properties.set('locationId', location.id)
          orangeMarker.properties.set('markerId', markerId)
          orangeMarker.properties.set('finalLat', finalLat)
          orangeMarker.properties.set('finalLng', finalLng)
          orangeMarker.properties.set('locationAddress', location.address)
          orangeMarker.properties.set('locationCity', location.city)
          
          // 2. Метка (только десктоп)
          let label: any = null
          
          if (!isMobileDevice) {
          const LabelLayout = window.ymaps.templateLayoutFactory.createClass(
            '<div style="' +
              'display: inline-block; ' +
              'background: rgba(255, 255, 255, 0.7); ' +
              'backdrop-filter: blur(16px); ' +
              'border: 1px solid rgba(0, 0, 0, 0.04); ' +
              'border-radius: 16px; ' +
              'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04); ' +
              'padding: 6px 10px; ' +
              'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; ' +
              'cursor: pointer; ' +
              'user-select: none; ' +
              'transition: all 0.15s ease; ' +
              'pointer-events: auto; ' +
              'max-width: 220px;' +
            '" onmouseover="this.style.background=\'rgba(255,255,255,0.9)\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.12)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.7)\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)\'">' +
              hintContent +
            '</div>'
          )
          
          label = new window.ymaps.Placemark(
            [finalLat, finalLng],
            {
              name: studio.name
            },
            {
              iconLayout: LabelLayout,
              iconOffset: [initialCircleSize / 2 + 8, -20],
              zIndex: 1500,
              cursor: 'pointer',
              hasBalloon: false,
              hasHint: false
            }
          )
          }

          placemark.properties.set('studioId', studio.id)
          placemark.properties.set('locationId', location.id)
          placemark.properties.set('markerId', markerId)
          placemark.properties.set('finalLat', finalLat)
          placemark.properties.set('finalLng', finalLng)
          placemark.properties.set('locationAddress', location.address)
          placemark.properties.set('locationCity', location.city)
          
          markerCoordsRef.current.set(markerId, { lat: finalLat, lng: finalLng, studioId: studio.id })

          const handleMarkerMouseEnter = () => {
            if (leaveTimeoutRef.current) {
              clearTimeout(leaveTimeoutRef.current)
              leaveTimeoutRef.current = null
            }
            
            if (lastHoveredIdRef.current === studio.id) return
            
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
              hoverTimeoutRef.current = null
            }
            
            lastHoveredIdRef.current = studio.id
            
            hoverTimeoutRef.current = setTimeout(() => {
              const map = mapInstanceRef.current
              if (map) {
                const zoom = map.getZoom()
                updateMarkersAppearance(zoom, studio.id, selectedStudioId, viewedStudios)
              }
            
              if (label) {
                label.options.set('visible', true)
                label.options.set('zIndex', 2000)
              }
              
              setHoveredStudioId(studio.id)
              scrollToCard(studio.id)
              
              hoverTimeoutRef.current = null
            }, 50)
          }
          
          const handleMarkerMouseLeave = () => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
              hoverTimeoutRef.current = null
            }
            
            if (leaveTimeoutRef.current) {
              clearTimeout(leaveTimeoutRef.current)
              leaveTimeoutRef.current = null
            }
            
            leaveTimeoutRef.current = setTimeout(() => {
              if (lastHoveredIdRef.current !== null && lastHoveredIdRef.current !== studio.id) {
                leaveTimeoutRef.current = null
                return
              }
              
              if (lastHoveredIdRef.current === studio.id) {
                lastHoveredIdRef.current = null
              }
              
              const map = mapInstanceRef.current
              if (map) {
                const zoom = map.getZoom()
                // Сбрасываем hover (передаем null вместо studio.id)
                updateMarkersAppearance(zoom, null, selectedStudioId, viewedStudios)
              }
              
              setHoveredStudioId(null)
              
              if (label) {
                const isPermanent = permanentlyVisibleLabelsRef.current.has(studio.id)
                if (isPermanent) {
                  label.options.set('zIndex', 1500)
                } else {
                  label.options.set('visible', false)
                  label.options.set('zIndex', 1500)
                }
              }
              
              leaveTimeoutRef.current = null
            }, 100)
          }
          
          if (!isMobileDevice) {
            placemark.events.add('mouseenter', handleMarkerMouseEnter)
            placemark.events.add('mouseleave', handleMarkerMouseLeave)
            
            orangeMarker.events.add('mouseenter', handleMarkerMouseEnter)
            orangeMarker.events.add('mouseleave', handleMarkerMouseLeave)
          }

          const handleMarkerClick = (e: any) => {
            e.stopPropagation()
            
            const markerStudioId = placemark.properties.get('studioId')
            const markerLocationId = placemark.properties.get('locationId')
            const markerLat = placemark.properties.get('finalLat')
            const markerLng = placemark.properties.get('finalLng')
            const locationAddress = placemark.properties.get('locationAddress')
            const locationCity = placemark.properties.get('locationCity')
            
            const isDesktop = window.innerWidth >= 1024
            setHoveredStudioId(null)
            
            const clickedLocation: StudioLocation = {
              id: markerLocationId || location.id,
              address: locationAddress || location.address,
              city: locationCity || location.city,
              lat: markerLat,
              lng: markerLng,
              is_main: location.is_main
            }
            setSelectedLocation(clickedLocation)
            
            setSelectedStudioId(prevId => {
              if (prevId && prevId !== markerStudioId) {
                setViewedStudios(prev => new Set(prev).add(prevId))
              }
              return markerStudioId
            })
            
            setViewedStudios(prev => new Set(prev).add(markerStudioId))
            setSelectedPoint({ lat: markerLat, lng: markerLng })
            
            const studioWithLocation: Studio = {
              ...studio,
              city: clickedLocation.address 
                ? `${clickedLocation.city}, ${clickedLocation.address}`.trim()
                : clickedLocation.city || studio.city,
              latitude: markerLat,
              longitude: markerLng
            }
            
            setExpandedStudio(studioWithLocation)
            
            if (isDesktop) {
              const currentVisible = visibleStudios.length > 0 ? visibleStudios : studios
              const sameLocationStudios = currentVisible.filter(s => {
                if (s.id === markerStudioId) return true
                const latDiff = Math.abs(s.latitude - markerLat)
                const lngDiff = Math.abs(s.longitude - markerLng)
                return latDiff < 0.001 && lngDiff < 0.001
              })
              
              if (sameLocationStudios.length > 0) {
                setDisplayedStudios(sameLocationStudios)
                setTimeout(() => {
                  scrollToCard(sameLocationStudios[0].id)
                }, 100)
              } else {
                const byId = studios.find(s => s.id === markerStudioId)
                if (byId) {
                  setDisplayedStudios([byId])
                } else {
                  setDisplayedStudios(visibleStudios)
                }
              }
            } else {
              const byId = studios.find(s => s.id === markerStudioId)
              if (byId) {
                setDisplayedStudios([byId])
                const map = mapInstanceRef.current
                if (map) {
                  map.setCenter([markerLat, markerLng], 15, { duration: 300 })
                }
                setSheetSnap(0)
                setTimeout(() => {
                  setSheetSnap(1)
                }, 100)
              }
            }
          }
          
          placemark.events.add('click', handleMarkerClick)
          orangeMarker.events.add('click', handleMarkerClick)
          if (typeof window !== 'undefined' && 'ontouchstart' in window) {
            placemark.events.add('tap', handleMarkerClick)
            orangeMarker.events.add('tap', handleMarkerClick)
          }
          
          if (!isMobileDevice && label) {
            label.events.add('click', handleMarkerClick)
            if (typeof window !== 'undefined' && 'ontouchstart' in window) {
              label.events.add('tap', handleMarkerClick)
            }
          }

          map.geoObjects.add(blueMarker)
          map.geoObjects.add(orangeMarker)
          
          if (!isMobileDevice && label) {
            map.geoObjects.add(label)
          }
          
          // ВАЖНО: сохраняем studioId в структуре
          markersRef.current.set(markerId, { blue: blueMarker, orange: orangeMarker, studioId: studio.id })
          
          if (!isMobileDevice && label) {
            labelsRef.current.set(markerId, { 
              label, 
              rating: studio.rating,
              reviewsCount: studio.reviewsCount,
              category: studio.category,
              studioId: studio.id
            })
          }
          markersStateRef.current.set(markerId, { isSelected: false, isHovered: false, isViewed: false })
          } 
        }

        if (markerCoordsRef.current.size > 0) {
          const allCoords = Array.from(markerCoordsRef.current.values()) as any[]
          const lats = allCoords.map(c => c.lat)
          const lons = allCoords.map(c => c.lng)
          map.setBounds([
            [Math.min(...lats), Math.min(...lons)],
            [Math.max(...lats), Math.max(...lons)]
          ], { checkZoomRange: true, zoomMargin: 150, duration: 0 }).then(() => {
            const currentZoom = map.getZoom()
            if (currentZoom > 11) {
              map.setZoom(10, { duration: 0 })
            }
          })
        }

        const updateVisibleStudios = () => {
          const bounds = map.getBounds()
          if (!bounds) return

          const [[minLat, minLng], [maxLat, maxLng]] = bounds

          const visibleStudioIds = new Set<string>()
          markerCoordsRef.current.forEach((coords, markerId) => {
            const { lat, lng, studioId } = coords as any
            if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
              visibleStudioIds.add(studioId)
            }
          })

          const filtered = studios.filter(studio => {
            if (visibleStudioIds.has(studio.id)) return true
            
            const lat = studio.latitude
            const lng = studio.longitude
            
            const inBounds = (
              lat >= minLat &&
              lat <= maxLat &&
              lng >= minLng &&
              lng <= maxLng
            )
            
            return inBounds
          })
          
          setVisibleStudios(filtered)
        }

        updateVisibleStudios()

        const updateLabelsVisibility = () => {
          if (isMobileDevice) return
          
          const zoom = map.getZoom()
          const projection = map.options.get('projection')
          if (!projection || typeof projection.toGlobalPixels !== 'function') return
          
          const labelsArray: Array<{
            id: string
            label: any
            rating: number
            reviewsCount: number
            category: string
            score: number
            coords: [number, number]
            studioId: string
          }> = []
          
          labelsRef.current.forEach((data, id) => {
            let score = data.rating || 0
            score += Math.min(data.reviewsCount / 10, 50)
            
            if (data.category === 'venue') {
              score += 100
            }
            
            const markerPair = markersRef.current.get(id)
            const coords = markerPair && markerPair.blue 
              ? markerPair.blue.geometry.getCoordinates() 
              : [0, 0]
            
            labelsArray.push({
              id,
              label: data.label,
              rating: data.rating,
              reviewsCount: data.reviewsCount,
              category: data.category,
              score,
              coords,
              studioId: data.studioId
            })
          })
          
          labelsArray.sort((a, b) => b.score - a.score)
          
          let maxVisibleCount = 0
          if (zoom < 11) {
            maxVisibleCount = 5
          } else if (zoom < 12) {
            maxVisibleCount = 10
          } else if (zoom < 13) {
            maxVisibleCount = 20
          } else if (zoom < 14) {
            maxVisibleCount = 40
          } else {
            maxVisibleCount = 9999
          }
          
          const visibleLabels: Array<{ coords: [number, number]; pixelCoords: [number, number] }> = []
          const newPermanentlyVisible = new Set<string>()
          let shownCount = 0
          
          const labelWidth = 220
          const labelHeight = 38
          const minDistance = 10
          
          labelsArray.forEach((item, index) => {
            // Если на маркер наведен курсор, не скрываем его метку
            if (item.studioId === lastHoveredIdRef.current) {
                return
            }

            if (shownCount >= maxVisibleCount) {
              item.label.options.set('visible', false)
              return
            }
            
            const pixelCoords = map.converter.globalToPage(
              projection.toGlobalPixels(item.coords, zoom)
            )
            
            let hasOverlap = false
            for (const visibleLabel of visibleLabels) {
              const dx = Math.abs(pixelCoords[0] - visibleLabel.pixelCoords[0])
              const dy = Math.abs(pixelCoords[1] - visibleLabel.pixelCoords[1])
              
              if (dx < (labelWidth + minDistance) && dy < (labelHeight + minDistance)) {
                hasOverlap = true
                break
              }
            }
            
            if (!hasOverlap) {
              item.label.options.set('visible', true)
              item.label.options.set('zIndex', 1500)
              visibleLabels.push({ coords: item.coords, pixelCoords })
              newPermanentlyVisible.add(item.studioId)
              shownCount++
            } else {
              item.label.options.set('visible', false)
            }
          })
          
          permanentlyVisibleLabelsRef.current = newPermanentlyVisible
        }
        
        map.events.add('actionend', () => {
          const zoom = map.getZoom()
          setCurrentZoom(zoom)
          updateLabelsVisibility()
        })
        
        updateLabelsVisibility()

        map.events.add('boundschange', updateVisibleStudios)

        map.events.add('click', (e: any) => {
          const target = e.get('target')
          if (target && target.properties) {
            return
          }
          
          const isDesktop = window.innerWidth >= 1024
          setSelectedStudioId(null)
          setSelectedPoint(null)
          setExpandedStudio(null)
          setSelectedLocation(null)
          
          if (isDesktop) {
            setDisplayedStudios(prev => {
              const bounds = map.getBounds()
              if (!bounds) return prev
              
              const [[minLat, minLng], [maxLat, maxLng]] = bounds
              const filtered = studios.filter(studio => {
                const markerCoords = markerCoordsRef.current.get(studio.id) // This assumes markerId == studioId which is mostly true for 1st loc
                // Need to check ANY marker of this studio
                let hasVisibleMarker = false
                markerCoordsRef.current.forEach((coords) => {
                    if (coords.studioId === studio.id) {
                        const { lat, lng } = coords
                        if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
                            hasVisibleMarker = true
                        }
                    }
                })
                
                if (hasVisibleMarker) return true

                const lat = studio.latitude
                const lng = studio.longitude
                
                return (
                  lat >= minLat &&
                  lat <= maxLat &&
                  lng >= minLng &&
                  lng <= maxLng
                )
              })
              return filtered
            })
          }
        })

        setIsLoading(false)
      })
    }

    if (window.ymaps) {
      initMap()
    } else {
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
        mapInstanceRef.current = null
      }
    }
  }, [studios])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    
    const zoom = map.getZoom()
    
    updateMarkersAppearance(zoom, null, selectedStudioId, viewedStudios)
  }, [selectedStudioId, currentZoom, viewedStudios, updateMarkersAppearance])

  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
    
    if (!isDesktop) {
      setDisplayedStudios(visibleStudios)
      return
    }
    
    if (!selectedPoint && !selectedStudioId) {
      setDisplayedStudios(visibleStudios)
    } else if (selectedStudioId) {
      const byId = studios.find(s => s.id === selectedStudioId)
      if (byId) {
        const sameLocationStudios = visibleStudios.filter(s => {
          if (s.id === selectedStudioId) return true
          const latDiff = Math.abs(s.latitude - byId.latitude)
          const lngDiff = Math.abs(s.longitude - byId.longitude)
          return latDiff < 0.001 && lngDiff < 0.001
        })
        setDisplayedStudios(sameLocationStudios.length > 0 ? sameLocationStudios : [byId])
      } else {
        if (selectedPoint) {
          const sameLocationStudios = visibleStudios.filter(s => {
            const latDiff = Math.abs(s.latitude - selectedPoint.lat)
            const lngDiff = Math.abs(s.longitude - selectedPoint.lng)
            return latDiff < 0.001 && lngDiff < 0.001
          })
          setDisplayedStudios(sameLocationStudios.length > 0 ? sameLocationStudios : visibleStudios)
        } else {
          setDisplayedStudios(visibleStudios)
        }
      }
    } else if (selectedPoint) {
      const sameLocationStudios = visibleStudios.filter(s => {
        const latDiff = Math.abs(s.latitude - selectedPoint.lat)
        const lngDiff = Math.abs(s.longitude - selectedPoint.lng)
        return latDiff < 0.001 && lngDiff < 0.001
      })
      setDisplayedStudios(sameLocationStudios.length > 0 ? sameLocationStudios : visibleStudios)
    }
  }, [visibleStudios, selectedPoint, selectedStudioId, studios])

  const handleCardHover = (id: string | null) => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
    if (isDesktop) {
      setHoveredStudioId(id)
      
      const map = mapInstanceRef.current
      if (map) {
        const zoom = map.getZoom()
        // Теперь передаем ID студии, и updateMarkersAppearance найдет все её маркеры
        updateMarkersAppearance(zoom, id, selectedStudioId, viewedStudios)
      }
    } else {
      setSelectedStudioId(id)
    }
  }

  const handleShowAll = () => {
    setSelectedStudioId(null)
    setSelectedPoint(null)
    setExpandedStudio(null)
    setSelectedLocation(null)
    setDisplayedStudios(visibleStudios)
  }
  
  const handleZoomIn = useCallback(() => {
    const map = mapInstanceRef.current
    if (map) {
      const currentZoom = map.getZoom()
      map.setZoom(currentZoom + 1, { duration: 200 })
    }
  }, [])
  
  const handleZoomOut = useCallback(() => {
    const map = mapInstanceRef.current
    if (map) {
      const currentZoom = map.getZoom()
      map.setZoom(currentZoom - 1, { duration: 200 })
    }
  }, [])
  
  const handleLocateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const map = mapInstanceRef.current
          if (map) {
            map.setCenter([position.coords.latitude, position.coords.longitude], 14, {
              duration: 500
            })
          }
        },
        (error) => {
          console.error('[MapWithList] Geolocation error:', error)
        }
      )
    }
  }, [])

  const renderCardsContent = () => (
    <>
      {expandedStudio && displayedStudios.length === 1 && (
        <div className="mb-3 px-4 lg:px-0">
          <Button
            onClick={handleShowAll}
            variant="outline"
            className="w-full bg-white hover:bg-slate-50 border-slate-200 rounded-xl"
          >
            <LayoutList className="w-4 h-4 mr-2" />
            Показать все
          </Button>
        </div>
      )}

      {expandedStudio ? (
        <div className="space-y-3 px-4 lg:px-0 pb-4">
          <div
            id={`studio-card-${expandedStudio.id}`}
            className="transition-all duration-300 ease-in-out rounded-[20px]"
          >
            <ProfileCard 
              {...expandedStudio} 
              enableSwipeExpand={true}
              isHovered={false}
            />
          </div>

          <Card className="border-none shadow-sm rounded-[20px] p-4 bg-white">
            {expandedStudio.photos && expandedStudio.photos.length > 1 && (
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-2">
                  {expandedStudio.photos.slice(0, 3).map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <Image
                        src={photo}
                        alt={`${expandedStudio.name} - фото ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expandedStudio.description && (
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                {expandedStudio.description}
              </p>
            )}

            <div className="space-y-3">
              {expandedStudio.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                  <a 
                    href={`tel:${expandedStudio.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {expandedStudio.phone}
                  </a>
                </div>
              )}

              {expandedStudio.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                  <a 
                    href={expandedStudio.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {expandedStudio.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {(selectedLocation || expandedStudio.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">
                    {selectedLocation 
                      ? (selectedLocation.address 
                          ? `${selectedLocation.city}, ${selectedLocation.address}` 
                          : selectedLocation.city)
                      : expandedStudio.city}
                  </span>
                </div>
              )}

              {expandedStudio.workingHours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{expandedStudio.workingHours}</span>
                </div>
              )}
            </div>

            <Link href={`/profiles/${expandedStudio.slug}`} className="block mt-4">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                Подробнее
              </Button>
            </Link>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 px-4 lg:px-0 pb-4">
          {displayedStudios.map((studio) => (
            <div
              key={studio.id}
              id={`studio-card-${studio.id}`}
              onMouseEnter={() => handleCardHover(studio.id)}
              onMouseLeave={() => handleCardHover(null)}
              className={`
                transition-all duration-300 ease-in-out rounded-[20px]
                ${selectedStudioId === studio.id ? 'ring-2 ring-orange-500 shadow-lg' : ''}
              `}
            >
              <ProfileCard 
                {...studio} 
                enableSwipeExpand={true}
                isHovered={hoveredStudioId === studio.id && selectedStudioId !== studio.id}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )

  const snapPoints = useMemo(() => [
    { height: 15, name: 'collapsed' },
    { height: 50, name: 'half' },
    { height: 85, name: 'expanded' },
  ], [])

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-2 pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Назад"
              >
                <ArrowLeft className="w-5 h-5 text-slate-900" />
              </button>
            )}
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            </div>
            
            {onBack && <div className="w-10" />}
          </div>
        </div>
        
        <div className="absolute inset-0 bg-slate-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
          
          <div className="absolute right-3 top-1/3 -translate-y-1/2 flex flex-col gap-2 z-20">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Увеличить"
            >
              <Plus className="w-5 h-5 text-slate-700" />
            </button>
            
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Уменьшить"
            >
              <Minus className="w-5 h-5 text-slate-700" />
            </button>
            
            <button
              onClick={handleLocateMe}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Моё местоположение"
            >
              <Navigation className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>
        
        <div 
          className="absolute left-0 right-0 z-[60] px-4 flex items-center justify-center gap-3 pointer-events-none"
          style={{ 
            bottom: sheetSnap === 0 ? 'calc(15vh + 20px)' : 
                   sheetSnap === 1 ? 'calc(50vh + 20px)' : 
                   '100vh',
            opacity: sheetSnap === 2 ? 0 : 1,
            transition: 'bottom 0.3s ease-out, opacity 0.2s ease'
          }}
        >
          <button
            className="flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg active:scale-95 transition-transform pointer-events-auto"
            aria-label="Поиск"
          >
            <Search className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Поиск</span>
          </button>
          
          <button
            className="flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg active:scale-95 transition-transform pointer-events-auto"
            aria-label="Фильтры"
          >
            <SlidersHorizontal className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Фильтры</span>
          </button>
        </div>
        
        <DraggableBottomSheet
          snapPoints={[
            { height: 15, name: 'collapsed' },
            { height: 50, name: 'half' },
            { height: 85, name: 'expanded' },
          ]}
          defaultSnapPoint={0}
          currentSnap={sheetSnap}
          onSnapChange={(index, name) => {
            setSheetSnap(index)
          }}
          bottomOffset={0}
          className="bg-white"
        >
          <div className="bg-white rounded-t-[20px] pt-2 pb-3 px-4">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
            
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-slate-900">
                {displayedStudios.length} {
                  displayedStudios.length === 1 ? 'место' : 
                  displayedStudios.length < 5 ? 'места' : 'мест'
                }
              </span>
              
              <button
                onClick={() => {
                  if (sheetSnap === 2) {
                    setSheetSnap(0)
                  } else {
                    setSheetSnap(2)
                  }
                }}
                className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                {sheetSnap === 2 ? (
                  <ChevronDown className="w-5 h-5 text-slate-500" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-slate-500" />
                )}
              </button>
            </div>
          </div>
          
          <div 
            ref={cardsContainerRef} 
            className="overflow-y-auto bg-[#F7F7F8]"
            style={{ 
              maxHeight: sheetSnap === 0 ? '0' : 
                        sheetSnap === 1 ? 'calc(50vh - 100px)' : 
                        'calc(85vh - 100px)',
              overflow: sheetSnap === 0 ? 'hidden' : 'auto',
              transition: 'max-height 0.3s ease'
            }}
          >
            {expandedStudio ? (
              <div className="space-y-3 px-4 pt-3 pb-4">
                <Button
                  onClick={handleShowAll}
                  variant="outline"
                  className="w-full bg-white hover:bg-slate-50 border-slate-200 rounded-xl"
                >
                  <LayoutList className="w-4 h-4 mr-2" />
                  Показать все
                </Button>
                
                <div className="rounded-[20px] overflow-hidden">
                  <ProfileCard 
                    {...expandedStudio} 
                    enableSwipeExpand={true}
                    isHovered={false}
                  />
                </div>
                
                <Card className="border-none shadow-sm rounded-[20px] p-4 bg-white">
                  {expandedStudio.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {expandedStudio.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    {expandedStudio.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                        <a href={`tel:${expandedStudio.phone}`} className="text-sm text-primary hover:underline">
                          {expandedStudio.phone}
                        </a>
                      </div>
                    )}
                    {(selectedLocation || expandedStudio.city) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">
                          {selectedLocation 
                            ? (selectedLocation.address 
                                ? `${selectedLocation.city}, ${selectedLocation.address}` 
                                : selectedLocation.city)
                            : expandedStudio.city}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/profiles/${expandedStudio.slug}`} className="block mt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                      Подробнее
                    </Button>
                  </Link>
                </Card>
              </div>
            ) : (
              <div className="space-y-3 px-4 pt-3 pb-4">
                {displayedStudios.map((studio) => {
                  const mainLocation = studio.locations?.find(loc => loc.is_main) || studio.locations?.[0]
                  
                  return (
                  <div
                    key={studio.id}
                    id={`studio-card-${studio.id}`}
                    onClick={() => {
                      setSelectedStudioId(studio.id)
                      if (mainLocation) {
                        setSelectedLocation(mainLocation)
                        const studioWithLocation: Studio = {
                          ...studio,
                          city: mainLocation.address ? `${mainLocation.city}, ${mainLocation.address}` : mainLocation.city,
                          latitude: mainLocation.lat,
                          longitude: mainLocation.lng
                        }
                        setExpandedStudio(studioWithLocation)
                      } else {
                        setSelectedLocation(null)
                        setExpandedStudio(studio)
                      }
                      setViewedStudios(prev => new Set(prev).add(studio.id))
                      
                      const map = mapInstanceRef.current
                      if (map) {
                        const centerLat = mainLocation?.lat || studio.latitude
                        const centerLng = mainLocation?.lng || studio.longitude
                        map.setCenter([centerLat, centerLng], 14, { duration: 300 })
                      }
                      
                      setSheetSnap(0)
                    }}
                    className={`
                      rounded-[20px] overflow-hidden cursor-pointer
                      transition-all duration-200 active:scale-[0.98]
                      ${selectedStudioId === studio.id ? 'ring-2 ring-orange-500' : ''}
                    `}
                  >
                    <ProfileCard 
                      {...studio} 
                      enableSwipeExpand={true}
                      isHovered={false}
                    />
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </DraggableBottomSheet>
      </div>
    )
  }

  return (
    <div className="flex flex-row relative rounded-[24px] overflow-hidden shadow-lg" style={{ height: 'calc(100vh - 220px)', minHeight: '400px', maxHeight: '700px' }}>
      
      <div 
        ref={cardsContainerRef}
        className="w-[30%] min-w-[280px] max-w-[360px] overflow-y-auto p-4 bg-[#F3F3F5] relative smooth-scroll-list shrink-0 h-full"
      >
        {renderCardsContent()}
      </div>
      
      <div className="flex-1 relative bg-slate-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}
        
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  )
}
