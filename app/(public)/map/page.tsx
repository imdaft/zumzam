'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ProfileCard } from '@/components/features/profile/profile-card'
import { 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Navigation, 
  Search, 
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  MapPin,
  Phone,
  Heart,
  Star,
  X,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { DraggableBottomSheet, useBottomSheetSnap } from '@/components/ui/draggable-bottom-sheet'

// Интерфейсы
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
  locations?: StudioLocation[] // Массив всех локаций (филиалов)
  phone?: string
  description?: string
  category?: string
  venueType?: string | null
}

export default function MobileMapPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const clustererRef = useRef<any>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [studios, setStudios] = useState<Studio[]>([])
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<StudioLocation | null>(null) // Выбранная локация для отображения адреса
  
  // Разделяем: filteredStudios для карты, displayedStudios для списка в языке
  const [filteredStudios, setFilteredStudios] = useState<Studio[]>([]) // Для маркеров карты (по фильтрам категорий)
  const [displayedStudios, setDisplayedStudios] = useState<Studio[]>([]) // Для списка в языке (может быть одна студия)
  const filteredStudiosRef = useRef<Studio[]>([]) // Ref для updateMarkers
  
  // Синхронизируем ref с filteredStudios (не displayedStudios!)
  useEffect(() => {
    filteredStudiosRef.current = filteredStudios
  }, [filteredStudios])
  
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  // Поиск
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('') // Активный запрос после нажатия "Искать"
  const [searchSuggestions, setSearchSuggestions] = useState<Studio[]>([])
  
  // Фильтры (полноэкранные)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Собираем все уникальные теги из студий
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    studios.forEach(s => {
      s.tags?.forEach(t => tagsSet.add(t))
    })
    console.log('[MobileMap] All tags:', Array.from(tagsSet))
    return Array.from(tagsSet).sort()
  }, [studios])
  
  // Фильтры для чипсов
  const FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'top', label: '⭐ Лучшие' },
    { id: 'venue', label: '🏠 Площадки' },
    { id: 'animator', label: '🎭 Аниматоры' },
    { id: 'quest', label: '🔍 Квесты' },
    { id: 'show', label: '✨ Шоу' },
  ]
  
  const { snap: sheetSnap, setSnap: setSheetSnap } = useBottomSheetSnap(0)
  
  // Автоподсказки при поиске
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([])
      return
    }
    
    const query = searchQuery.toLowerCase()
    const suggestions = studios.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.tags?.some(t => t.toLowerCase().includes(query))
    ).slice(0, 8)
    
    setSearchSuggestions(suggestions)
  }, [searchQuery, studios])
  
  // Функция поиска
  const handleSearch = useCallback((query: string, studio?: Studio) => {
    setActiveSearchQuery(query)
    setIsSearchOpen(false)
    
    if (studio) {
      // Если выбрали конкретную студию
      // Находим главную локацию
      const mainLocation = studio.locations?.find(loc => loc.is_main) || studio.locations?.[0]
      if (mainLocation) {
        setSelectedLocation(mainLocation)
        const studioWithLocation: Studio = {
          ...studio,
          city: mainLocation.address 
            ? `${mainLocation.city}, ${mainLocation.address}`.trim()
            : mainLocation.city || studio.city,
          latitude: mainLocation.lat,
          longitude: mainLocation.lng
        }
        setSelectedStudio(studioWithLocation)
        setDisplayedStudios([studioWithLocation])
      } else {
        setSelectedLocation(null)
        setSelectedStudio(studio)
        setDisplayedStudios([studio])
      }
      setSheetSnap(1) // Открываем язык с выбранной студией
      
      const map = mapInstanceRef.current
      if (map) {
        const centerLat = mainLocation?.lat || studio.latitude
        const centerLng = mainLocation?.lng || studio.longitude
        // При поиске центрируем и зумим, чтобы показать результат
        map.setCenter([centerLat, centerLng], 16, { duration: 500 })
      }
    } else if (query.trim()) {
      // Ищем по запросу
      const q = query.toLowerCase()
      const found = studios.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
      )
      
      if (found.length === 1) {
        // Одна студия — наводимся на неё
        const studio = found[0]
        const mainLocation = studio.locations?.find(loc => loc.is_main) || studio.locations?.[0]
        if (mainLocation) {
          setSelectedLocation(mainLocation)
          const studioWithLocation: Studio = {
            ...studio,
            city: mainLocation.address 
              ? `${mainLocation.city}, ${mainLocation.address}`.trim()
              : mainLocation.city || studio.city,
            latitude: mainLocation.lat,
            longitude: mainLocation.lng
          }
          setSelectedStudio(studioWithLocation)
          setDisplayedStudios([studioWithLocation])
        } else {
          setSelectedLocation(null)
          setSelectedStudio(studio)
          setDisplayedStudios([studio])
        }
        setSheetSnap(1) // Открываем язык с выбранной студией
        
        const map = mapInstanceRef.current
        if (map) {
          const centerLat = mainLocation?.lat || studio.latitude
          const centerLng = mainLocation?.lng || studio.longitude
          map.setCenter([centerLat, centerLng], 16, { duration: 500 })
        }
      } else if (found.length > 1) {
        // Несколько — показываем список
        setSelectedStudio(null)
        setSelectedLocation(null)
        setDisplayedStudios(found)
        setSheetSnap(1)
      }
    }
  }, [studios, setSheetSnap])
  
  // Сброс поиска
  const clearSearch = useCallback(() => {
    setActiveSearchQuery('')
    setSearchQuery('')
    setSelectedStudio(null)
    setSelectedLocation(null)
    // Возвращаем к отфильтрованному списку или ко всем студиям
    setDisplayedStudios(filteredStudios.length > 0 ? filteredStudios : studios)
  }, [studios, filteredStudios])
  
  // Применение фильтров по тегам
  const applyTagFilters = useCallback(() => {
    setIsFiltersOpen(false)
    
    if (selectedTags.length === 0 && activeFilters.length === 0) {
      setFilteredStudios(studios) // Для карты
      setDisplayedStudios(studios) // Для списка
      return
    }
    
    let filtered = studios
    
    // Фильтр по категории
    if (activeFilters.length > 0 && !activeFilters.includes('all')) {
      if (activeFilters.includes('top')) {
        filtered = filtered.filter(s => s.rating >= 4.5)
      } else {
        filtered = filtered.filter(s => activeFilters.includes(s.category || ''))
      }
    }
    
    // Фильтр по тегам
    if (selectedTags.length > 0) {
      filtered = filtered.filter(s => 
        selectedTags.some(tag => s.tags?.includes(tag))
      )
    }
    
    setFilteredStudios(filtered) // Для карты
    setDisplayedStudios(filtered) // Для списка
    setSelectedStudio(null) // Сбрасываем выбранную студию при фильтрации
    setSelectedLocation(null) // Сбрасываем выбранную локацию
    if (filtered.length > 0) {
      setSheetSnap(1)
    }
  }, [studios, selectedTags, activeFilters, setSheetSnap])
  
  // Автоматическое применение фильтров при изменении activeFilters
  useEffect(() => {
    if (studios.length === 0) return
    
    let filtered = studios
    
    if (activeFilters.length > 0 && !activeFilters.includes('all')) {
      if (activeFilters.includes('top')) {
        filtered = filtered.filter(s => s.rating >= 4.5)
      } else {
        filtered = filtered.filter(s => activeFilters.includes(s.category || ''))
      }
    }
    
    setFilteredStudios(filtered) // Для карты
    setDisplayedStudios(filtered) // Для списка
    setSelectedStudio(null) // Сбрасываем выбор при смене фильтра
    setSelectedLocation(null) // Сбрасываем выбранную локацию
  }, [activeFilters, studios])
  
  // Загрузка данных через API
  useEffect(() => {
    const fetchStudios = async () => {
      try {
        console.log('[MobileMap] Fetching studios...')
        const response = await fetch('/api/profiles/public')
        const data = await response.json()
        
        if (data.error) throw new Error(data.error)
        
        const profiles = data.profiles || []
        console.log('[MobileMap] Received profiles:', profiles.length)
        
        // Фильтруем только площадки (venue) и те, у которых есть координаты
        const formatted: Studio[] = profiles
          .filter((p: any) => p.category === 'venue' && p.lat && p.lng)
          .map((profile: any) => ({
            id: profile.id,
            slug: profile.slug || profile.id,
            name: profile.name || 'Без названия',
            city: profile.city || '',
            rating: profile.rating || 0,
            reviewsCount: profile.reviews || 0,
            priceFrom: profile.price_from || 0,
            photos: [
              profile.image,
              ...(profile.service_photos || [])
            ].filter((p): p is string => !!p && p.trim() !== ''), // Убираем пустые строки
            tags: profile.tags || [],
            verified: profile.is_verified || false,
            featured: profile.is_featured || false,
            latitude: profile.lat,
            longitude: profile.lng,
            locations: profile.locations || [], // Передаём все локации (филиалы)
            phone: undefined,
            description: profile.description,
            category: profile.category,
            venueType: profile.venue_type
          }))
        
        console.log('[MobileMap] Formatted studios with locations:', formatted.map(s => ({
          name: s.name,
          locationsCount: s.locations?.length || 0,
          locations: s.locations?.map(l => ({ address: l.address, city: l.city }))
        })))
        
        console.log('[MobileMap] Formatted studios with coords:', formatted.length)
        setStudios(formatted)
        setFilteredStudios(formatted) // Все студии для карты
        setDisplayedStudios(formatted) // Все студии для списка
      } catch (error) {
        console.error('[MobileMap] Error fetching studios:', error)
      }
    }
    
    fetchStudios()
  }, [])
  
  // Отключаем pull-to-refresh через CSS
  useEffect(() => {
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehavior = 'none'
    
    return () => {
      document.body.style.overscrollBehavior = ''
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [])
  
  // Фильтрация студий при изменении фильтров
  useEffect(() => {
    if (studios.length === 0) return
    
    let filtered = [...studios]
    
    if (activeFilters.length > 0) {
      filtered = studios.filter(studio => {
        return activeFilters.some(filter => {
          switch (filter) {
            case 'top':
              return studio.rating >= 4.5
            case 'venue':
              return studio.category === 'venues' || studio.category === 'venue'
            case 'animator':
              return studio.category === 'animators' || studio.category === 'animator'
            case 'quest':
              return studio.category === 'quests' || studio.category === 'quest'
            case 'show':
              return studio.category === 'shows' || studio.category === 'show'
            default:
              return true
          }
        })
      })
    }
    
    setDisplayedStudios(filtered)
  }, [activeFilters, studios])
  
  // Инициализация карты
  useEffect(() => {
    const initMap = () => {
      if (!window.ymaps || !mapRef.current) return
      
      if (mapInstanceRef.current) return // Уже инициализирована
      
      window.ymaps.ready(() => {
        if (!mapRef.current || mapInstanceRef.current) return
        
        const center = [59.9343, 30.3351] // СПб по умолчанию
        
        const map = new window.ymaps.Map(mapRef.current, {
          center,
          zoom: 11,
          controls: []
        }, {
          suppressMapOpenBlock: true
        })
        
        map.behaviors.enable(['drag', 'scrollZoom', 'dblClickZoom', 'multiTouch'])
        mapInstanceRef.current = map
        
        setIsLoading(false)
      })
    }
    
    if (window.ymaps) {
      initMap()
    } else {
      let timeoutId: NodeJS.Timeout | null = null
      
      const checkInterval = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkInterval)
          if (timeoutId) clearTimeout(timeoutId)
          initMap()
        }
      }, 100)
      
      // Таймаут на случай если API не загрузится
      timeoutId = setTimeout(() => {
        clearInterval(checkInterval)
        if (!mapInstanceRef.current) {
          setIsLoading(false)
          console.warn('[MobileMap] Yandex Maps API not loaded after 10s')
        }
      }, 10000)
      
      return () => {
        clearInterval(checkInterval)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
    }
  }, [])
  
  // Размеры маркеров
  const CARD_WIDTH = 90
  const CARD_HEIGHT = 72
  const DOT_SIZE = 16
  
  // Ref для хранения HTML layout классов
  const cardLayoutRef = useRef<any>(null)
  const dotLayoutRef = useRef<any>(null)
  
  // Создаём HTML layout для карточки-маркера (один раз)
  const getCardLayout = useCallback(() => {
    if (!window.ymaps) return null
    if (cardLayoutRef.current) return cardLayoutRef.current
    
    cardLayoutRef.current = window.ymaps.templateLayoutFactory.createClass(`
      <div 
        class="map-card-marker"
        data-studio-id="{{ properties.studioId }}"
        style="
          width: ${CARD_WIDTH}px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          overflow: hidden;
          cursor: pointer;
          transform: translate(-50%, -100%);
        ">
        <div style="
          width: 100%;
          height: 46px;
          background: #e2e8f0;
          background-image: url('{{ properties.photo }}');
          background-size: cover;
          background-position: center;
        "></div>
        <div style="padding: 4px 6px;">
          <div style="
            font-size: 11px;
            font-weight: 600;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            
          ">{{ properties.name }}</div>
          <div style="display: flex; align-items: center; gap: 3px; margin-top: 2px;">
            <span style="
              width: 6px;
              height: 6px;
              background: #fbbf24;
              border-radius: 50%;
            "></span>
            <span style="font-size: 10px; color: #64748b;">{{ properties.rating }}</span>
          </div>
        </div>
      </div>
    `)
    return cardLayoutRef.current
  }, [])
  
  // Создаём SVG для простой точки (оранжевый — наш brand color)
  const createDotMarkerSvg = useCallback(() => {
    const half = DOT_SIZE / 2
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${DOT_SIZE}" height="${DOT_SIZE}" viewBox="0 0 ${DOT_SIZE} ${DOT_SIZE}">
        <circle cx="${half}" cy="${half}" r="${half - 1}" fill="#f97316" stroke="white" stroke-width="2"/>
      </svg>
    `
  }, [])
  
  // Определяем какие студии показывать как карточки
  const getVisibleCards = useCallback((map: any, allStudios: Studio[]): Set<string> => {
    if (!map) return new Set()
    
    const zoom = map.getZoom()
    const visibleCardIds = new Set<string>()
    
    // Получаем видимые границы карты
    const bounds = map.getBounds()
    if (!bounds) return visibleCardIds
    
    // Размер карточки в градусах (приблизительно)
    const cardSizeLat = 0.04 / Math.pow(2, zoom - 12)
    const cardSizeLng = 0.05 / Math.pow(2, zoom - 12)
    
    // Собираем все локации всех студий для проверки видимости
    const allLocations: Array<{ studio: Studio; location: StudioLocation; lat: number; lng: number }> = []
    allStudios.forEach(studio => {
      const locationsToCheck = studio.locations && studio.locations.length > 0
        ? studio.locations
        : [{
            id: `${studio.id}-main`,
            address: studio.city,
            city: studio.city?.split(',')[0] || '',
            lat: studio.latitude,
            lng: studio.longitude,
            is_main: true
          }]
      
      locationsToCheck.forEach(location => {
        allLocations.push({
          studio,
          location,
          lat: location.lat,
          lng: location.lng
        })
      })
    })
    
    // Фильтруем локации на экране
    const onScreenLocations = allLocations.filter(({ lat, lng }) => {
      return lat >= bounds[0][0] && lat <= bounds[1][0] && 
             lng >= bounds[0][1] && lng <= bounds[1][1]
    })
    
    // Сортируем по рейтингу студии (для разрешения конфликтов)
    const sorted = [...onScreenLocations].sort((a, b) => b.studio.rating - a.studio.rating)
    
    // Храним занятые области (bounding boxes)
    const occupiedAreas: { lat: number; lng: number; studioId: string }[] = []
    
    // Проверка перекрытия
    const wouldOverlap = (lat: number, lng: number): boolean => {
      return occupiedAreas.some(area => {
        const latOverlap = Math.abs(lat - area.lat) < cardSizeLat
        const lngOverlap = Math.abs(lng - area.lng) < cardSizeLng
        return latOverlap && lngOverlap
      })
    }
    
    // Добавляем карточки БЕЗ лимита - главное чтобы не перекрывались
    sorted.forEach(({ studio, location, lat, lng }) => {
      const overlaps = wouldOverlap(lat, lng)
      if (!overlaps) {
        const markerId = `${studio.id}-${location.id}`
        visibleCardIds.add(markerId)
        occupiedAreas.push({ 
          lat, 
          lng, 
          studioId: markerId
        })
      }
    })
    
    return visibleCardIds
  }, [])
  
  // Создаём layout для кластера (оранжевый круг с белым числом)
  const getClusterLayout = useCallback(() => {
    if (!window.ymaps) return null
    
    return window.ymaps.templateLayoutFactory.createClass(`
      <div style="
        width: 36px;
        height: 36px;
        background: #f97316;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
        color: white;
        cursor: pointer;
        transform: translate(-50%, -50%);
      ">{{ properties.geoObjects.length }}</div>
    `)
  }, [])
  
  // Обновляем маркеры (используем displayedStudios для фильтрации)
  const updateMarkers = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map || !window.ymaps) return
    
    // Используем filteredStudiosRef — показываем все отфильтрованные студии на карте
    const filtered = filteredStudiosRef.current
    const studiosToShow = filtered.length > 0 ? filtered : studios
    
    // Получаем список видимых карточек
    const visibleCards = getVisibleCards(map, studiosToShow)
    
    // Очищаем старые маркеры
    markersRef.current.forEach(marker => {
      map.geoObjects.remove(marker)
    })
    markersRef.current.clear()
    
    // Удаляем старый кластеризатор
    if (clustererRef.current) {
      map.geoObjects.remove(clustererRef.current)
      clustererRef.current = null
    }
    
    const CardLayout = getCardLayout()
    const ClusterLayout = getClusterLayout()
    
    // Создаём кластеризатор для точек
    const clusterer = new window.ymaps.Clusterer({
      clusterIconLayout: ClusterLayout,
      clusterIconShape: {
        type: 'Circle',
        coordinates: [0, 0],
        radius: 18
      },
      groupByCoordinates: false,
      // ОТКЛЮЧАЕМ дефолтный зум, так как он не учитывает padding/margins
      // и может слишком сильно приблизить карту, скрыв маркеры за границами
      clusterDisableClickZoom: true, 
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
      // Минимальное расстояние для кластеризации
      gridSize: 64
    })
    
    const dotMarkers: any[] = []
    
    studiosToShow.forEach(studio => {
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
      
      locationsToAdd.forEach((location, locationIndex) => {
        const markerId = `${studio.id}-${location.id}`
        const isCard = visibleCards.has(markerId)
        const photo = studio.photos[0] || ''
        const shortName = studio.name.length > 11 ? studio.name.slice(0, 10) + '…' : studio.name
        
        if (isCard && CardLayout) {
          // ==========================================
          // 🟩 КАРТОЧКА (Card Marker)
          // ==========================================
          // При клике: ОТКРЫВАЕТ профиль (Sheet)
          // Масштаб: НЕ меняется (фиксирован)
          
          const marker = new window.ymaps.Placemark(
            [location.lat, location.lng],
            { 
              studioId: studio.id,
              locationId: location.id,
              markerId: markerId,
              photo: photo,
              name: shortName,
              rating: studio.rating.toFixed(1)
            },
            {
              iconLayout: CardLayout,
              iconShape: {
                type: 'Rectangle',
                coordinates: [[-CARD_WIDTH/2, -CARD_HEIGHT], [CARD_WIDTH/2, 0]]
              },
              zIndex: 1000 // Карточки поверх точек
            }
          )
          
          marker.events.add('click', (e: any) => {
            e.preventDefault()
            e.stopPropagation() // Останавливаем всплытие к карте
            
            // Сохраняем выбранную локацию
            setSelectedLocation(location)
            
            // Создаём объект студии для отображения в языке
            const studioWithLocation: Studio = {
              ...studio,
              city: location.address 
                ? `${location.city}, ${location.address}`.trim()
                : location.city || studio.city,
              latitude: location.lat,
              longitude: location.lng
            }
            setSelectedStudio(studioWithLocation)
            setDisplayedStudios([studioWithLocation])
            
            // Открываем язык
            setSheetSnap(1)
            
            // Центрируем карту на маркере, но СОХРАНЯЕМ текущий зум
            // (как просил пользователь: "масштаб не меняется")
            const currentZoom = map.getZoom()
            map.setCenter([location.lat, location.lng], currentZoom, { duration: 300 })
          })
          
          map.geoObjects.add(marker)
          markersRef.current.set(markerId, marker)
        } else {
          // ==========================================
          // 🟧 ТОЧКА (Dot Marker)
          // ==========================================
          // При клике: ТОЛЬКО ZOOM IN (приближение)
          // Sheet: НЕ открывается
          
          const marker = new window.ymaps.Placemark(
            [location.lat, location.lng],
            { 
              studioId: studio.id,
              locationId: location.id,
              markerId: markerId,
              studio: studio,
              location: location
            },
            {
              iconLayout: 'default#image',
              iconImageHref: 'data:image/svg+xml;base64,' + btoa(createDotMarkerSvg()),
              iconImageSize: [DOT_SIZE, DOT_SIZE],
              iconImageOffset: [-DOT_SIZE / 2, -DOT_SIZE / 2],
              cursor: 'pointer',
              zIndex: 10 // Точки под карточками
            }
          )
          
          marker.events.add('click', (e: any) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Просто приближаем карту к точке
            // Это заставит алгоритм пересчитать видимость, и точка может стать карточкой
            const currentZoom = map.getZoom()
            map.setCenter([location.lat, location.lng], currentZoom + 2, { duration: 300 })
          })
          
          dotMarkers.push(marker)
          markersRef.current.set(markerId, marker)
        }
      })
    })
    
    // Добавляем точки в кластеризатор
    if (dotMarkers.length > 0) {
      clusterer.add(dotMarkers)
      map.geoObjects.add(clusterer)
      clustererRef.current = clusterer
      
      // Добавляем кастомный обработчик клика на кластер
      clusterer.events.add('click', (e: any) => {
        e.preventDefault()
        e.stopPropagation()
        
        const target = e.get('target')
        const bounds = target.getBounds()
        
        if (bounds) {
          // Используем setBounds с большими отступами (margins),
          // чтобы все маркеры гарантированно попали в видимую область и не были прижаты к краям
          map.setBounds(bounds, {
            checkZoomRange: true,
            // [top, right, bottom, left]
            // Bottom побольше, так как там может быть свернутый BottomSheet
            zoomMargin: [100, 80, 200, 80], 
            duration: 500
          })
        }
      })
    }
  }, [studios, setSheetSnap, getVisibleCards, getCardLayout, getClusterLayout, createDotMarkerSvg])
  
  // Добавление маркеров когда студии загрузятся
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.ymaps || studios.length === 0) return
    
    // Первоначальное добавление маркеров
    updateMarkers()
    
    // Автозум под все точки (учитываем все локации)
    const allLocations: Array<{ lat: number; lng: number }> = []
    studios.forEach(studio => {
      if (studio.locations && studio.locations.length > 0) {
        studio.locations.forEach(location => {
          allLocations.push({ lat: location.lat, lng: location.lng })
        })
      } else {
        allLocations.push({ lat: studio.latitude, lng: studio.longitude })
      }
    })
    
    if (allLocations.length > 1) {
      const lats = allLocations.map(l => l.lat)
      const lngs = allLocations.map(l => l.lng)
      const bounds = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ]
      map.setBounds(bounds as any, { checkZoomRange: true, zoomMargin: 50 })
    } else if (allLocations.length === 1) {
      map.setCenter([allLocations[0].lat, allLocations[0].lng], 14, { duration: 300 })
    }
    
    // Обновляем маркеры при изменении зума/позиции
    const boundsHandler = () => {
      // Debounce чтобы не пересчитывать на каждый кадр
      setTimeout(updateMarkers, 100)
    }
    map.events.add('boundschange', boundsHandler)
    
    return () => {
      map.events.remove('boundschange', boundsHandler)
    }
  }, [studios, setSheetSnap, updateMarkers])
  
  // Обновляем маркеры при изменении фильтров (с debounce чтобы избежать мерцания)
  const updateMarkersTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.ymaps) return
    
    // Debounce — ждём 200ms перед обновлением
    if (updateMarkersTimeoutRef.current) {
      clearTimeout(updateMarkersTimeoutRef.current)
    }
    
    updateMarkersTimeoutRef.current = setTimeout(() => {
      updateMarkers()
    }, 200)
    
    return () => {
      if (updateMarkersTimeoutRef.current) {
        clearTimeout(updateMarkersTimeoutRef.current)
      }
    }
  }, [activeFilters, selectedTags, filteredStudios, updateMarkers])
  
  // Обработчик кликов на карточки-маркеры (на контейнере карты)
  useEffect(() => {
    const mapContainer = mapRef.current
    if (!mapContainer) return
    
    const handleCardClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const cardElement = target.closest('.map-card-marker') as HTMLElement
      
      if (cardElement) {
        e.preventDefault()
        e.stopPropagation()
        
        const studioId = cardElement.dataset.studioId
        
        if (studioId) {
          // Находим маркер по studioId
          const marker = markersRef.current.get(studioId)
          if (marker) {
            const location = marker.properties.get('location')
            const studio = studios.find(s => s.id === marker.properties.get('studioId'))
            
            if (studio) {
              // Если есть информация о локации, используем её
              if (location) {
                setSelectedLocation(location)
                const studioWithLocation: Studio = {
                  ...studio,
                  city: location.address 
                    ? `${location.city}, ${location.address}`.trim()
                    : location.city || studio.city,
                  latitude: location.lat,
                  longitude: location.lng
                }
                setSelectedStudio(studioWithLocation)
                setDisplayedStudios([studioWithLocation])
                
                const map = mapInstanceRef.current
                if (map) {
                  // Центрируем, сохраняя зум
                  map.setCenter([location.lat, location.lng], map.getZoom(), { duration: 300 })
                }
              } else {
                // Фоллбэк на основную локацию
                setSelectedLocation(null)
                setSelectedStudio(studio)
                setDisplayedStudios([studio])
                
                const map = mapInstanceRef.current
                if (map) {
                  // Центрируем, сохраняя зум
                  map.setCenter([studio.latitude, studio.longitude], map.getZoom(), { duration: 300 })
                }
              }
              
              // Задержка чтобы state успел обновиться
              setTimeout(() => {
                setSheetSnap(1)
              }, 50)
            }
          }
        }
      }
    }
    
    // Слушаем на capture phase чтобы поймать до Яндекс.Карт
    mapContainer.addEventListener('click', handleCardClick, true)
    
    return () => {
      mapContainer.removeEventListener('click', handleCardClick, true)
    }
  }, [studios, setSheetSnap])
  
  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const map = mapInstanceRef.current
    if (map) map.setZoom(map.getZoom() + 1, { duration: 200 })
  }, [])
  
  const handleZoomOut = useCallback(() => {
    const map = mapInstanceRef.current
    if (map) map.setZoom(map.getZoom() - 1, { duration: 200 })
  }, [])
  
  const handleLocateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const map = mapInstanceRef.current
          if (map) {
            map.setCenter([position.coords.latitude, position.coords.longitude], 14, { duration: 500 })
          }
        },
        (error) => console.error('[MobileMap] Geolocation error:', error)
      )
    }
  }, [])
  
  const handleShowAll = () => {
    setSelectedStudio(null)
    setSelectedLocation(null)
    // Показываем отфильтрованные студии или все, если фильтров нет
    setDisplayedStudios(filteredStudios.length > 0 ? filteredStudios : studios)
    setSheetSnap(1)
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* ===== HEADER ===== */}
      <div className="absolute top-0 left-0 right-0 z-30 safe-area-top">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </button>
          
          {/* Title */}
          <h1 className="text-lg font-semibold text-slate-900">На карте</h1>
          
          {/* Spacer */}
          <div className="w-10" />
        </div>
      </div>
      
      {/* ===== MAP ===== */}
      <div className="absolute inset-0 bg-slate-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Zoom Controls */}
        <div className="absolute right-4 top-1/3 -translate-y-1/2 flex flex-col gap-2 z-20">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Minus className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={handleLocateMe}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Navigation className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>
      
      {/* ===== SEARCH/FILTERS BUTTONS ===== */}
      {!activeSearchQuery && (
        <div 
          className="absolute left-0 right-0 z-30 px-4 flex items-center justify-center gap-3"
          style={{ 
            bottom: sheetSnap === 0 ? 'calc(12vh + 20px)' : '100vh',
            opacity: sheetSnap === 1 ? 0 : 1,
            transition: 'bottom 0.3s ease-out, opacity 0.2s ease'
          }}
        >
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <Search className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Поиск</span>
          </button>
          <button 
            onClick={() => setIsFiltersOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Фильтры</span>
          </button>
        </div>
      )}
      
      {/* ===== BOTTOM SHEET ===== */}
      <DraggableBottomSheet
        snapPoints={[
          { height: 12, name: 'collapsed' },
          { height: 95, name: 'expanded' }
        ]}
        defaultSnapPoint={0}
        currentSnap={sheetSnap}
        onSnapChange={(index) => setSheetSnap(index)}
        bottomOffset={0}
        className="bg-white"
      >
        {/* Sheet Header */}
        <div className="bg-white px-4 pb-2">
          {/* Фильтры-чипсы (один выбор) */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {FILTERS.map(filter => {
              const isActive = filter.id === 'all' 
                ? activeFilters.length === 0 
                : activeFilters.includes(filter.id)
              
              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    if (filter.id === 'all') {
                      setActiveFilters([])
                    } else {
                      // Один выбор — заменяем, а не добавляем
                      setActiveFilters([filter.id])
                    }
                  }}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                    transition-all active:scale-95
                    ${isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                  `}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
          
          {/* Счётчик и кнопка раскрытия */}
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-slate-900">
              {displayedStudios.length} {
                displayedStudios.length === 1 ? 'место' : 
                displayedStudios.length < 5 ? 'места' : 'мест'
              }
            </span>
            
            <button
              onClick={() => setSheetSnap(sheetSnap === 1 ? 0 : 1)}
              className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              {sheetSnap === 1 ? (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>
        </div>
        
        {/* Cards List — скролл только когда развёрнут */}
        <div 
          className={cn(
            "flex-1 bg-[#F7F7F8]",
            sheetSnap === 1 ? "overflow-y-auto" : "overflow-hidden"
          )}
          style={{ 
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {selectedStudio ? (
            <div className="space-y-3 px-4 pt-3 pb-20">
              <Button
                onClick={handleShowAll}
                variant="outline"
                className="w-full bg-white hover:bg-slate-50 border-slate-200 rounded-xl"
              >
                Показать все ({studios.length})
              </Button>
              
              <div className="rounded-[20px] overflow-hidden">
                <ProfileCard 
                  {...selectedStudio}
                  enableSwipeExpand={true}
                  isHovered={false}
                />
              </div>
              
              {/* Extended info */}
              <Card className="border-none shadow-sm rounded-[20px] p-4 bg-white">
                {selectedStudio.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {selectedStudio.description}
                  </p>
                )}
                
                <div className="space-y-3">
                  {selectedStudio.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-0.5 text-slate-500" />
                      <a href={`tel:${selectedStudio.phone}`} className="text-sm text-primary hover:underline">
                        {selectedStudio.phone}
                      </a>
                    </div>
                  )}
                  {/* Показываем адрес выбранной локации или основной адрес */}
                  {(selectedLocation || selectedStudio.city) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-slate-500" />
                      <span className="text-sm text-slate-700">
                        {selectedLocation 
                          ? (selectedLocation.address 
                              ? `${selectedLocation.city}, ${selectedLocation.address}` 
                              : selectedLocation.city)
                          : selectedStudio.city}
                      </span>
                    </div>
                  )}
                </div>
                
                <Link href={`/profiles/${selectedStudio.slug}`} className="block mt-4">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                    Подробнее
                  </Button>
                </Link>
              </Card>
            </div>
          ) : (
            <div className="space-y-3 px-4 pt-3 pb-20">
              {displayedStudios.map((studio) => (
                <div
                  key={studio.id}
                  onClick={() => {
                    // Находим главную локацию для этой студии
                    const mainLocation = studio.locations?.find(loc => loc.is_main) || studio.locations?.[0]
                    if (mainLocation) {
                      setSelectedLocation(mainLocation)
                      const studioWithLocation: Studio = {
                        ...studio,
                        city: mainLocation.address 
                          ? `${mainLocation.city}, ${mainLocation.address}`.trim()
                          : mainLocation.city || studio.city,
                        latitude: mainLocation.lat,
                        longitude: mainLocation.lng
                      }
                      setSelectedStudio(studioWithLocation)
                      setDisplayedStudios([studioWithLocation])
                      
                      const map = mapInstanceRef.current
                      if (map) {
                        // При клике из списка центрируем и сохраняем зум
                        map.setCenter([mainLocation.lat, mainLocation.lng], map.getZoom(), { duration: 300 })
                      }
                    } else {
                      setSelectedLocation(null)
                      setSelectedStudio(studio)
                      setDisplayedStudios([studio])
                      
                      const map = mapInstanceRef.current
                      if (map) {
                        map.setCenter([studio.latitude, studio.longitude], map.getZoom(), { duration: 300 })
                      }
                    }
                    // Язык остаётся открытым после выбора
                  }}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <ProfileCard 
                    {...studio}
                    enableSwipeExpand={true}
                    isHovered={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Кнопка "На карту" — фиксирована внизу языка, поверх списка */}
        {sheetSnap === 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={() => setSheetSnap(0)}
              className="px-8 py-3 bg-white text-slate-900 rounded-full font-medium shadow-lg active:scale-95 transition-transform border border-slate-200"
            >
              На карту
            </button>
          </div>
        )}
      </DraggableBottomSheet>
      
      {/* ===== МИНИ-СТРОКА ПОИСКА (после поиска) ===== */}
      {activeSearchQuery && !isSearchOpen && (
        <div 
          className="absolute left-4 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-white rounded-full shadow-lg"
          style={{ 
            bottom: sheetSnap === 0 ? 'calc(12vh + 20px)' : '20px',
            transition: 'bottom 0.3s ease-out'
          }}
        >
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span className="flex-1 text-sm text-slate-700 truncate">{activeSearchQuery}</span>
          <button 
            onClick={clearSearch}
            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      )}
      
      {/* ===== ПОЛНОЭКРАННЫЙ ПОИСК ===== */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск мест..."
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              {searchQuery && (
                <button 
                  onClick={() => handleSearch(searchQuery)}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform"
                >
                  Найти
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Подсказки при вводе */}
            {searchQuery && searchSuggestions.length > 0 && (
              <div className="px-4 py-2">
                <p className="text-xs text-slate-400 mb-2">Найдено</p>
                {searchSuggestions.map(studio => (
                  <button
                    key={studio.id}
                    onClick={() => handleSearch(studio.name, studio)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${studio.photos[0] || '/placeholder-studio.jpg'})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{studio.name}</p>
                      <p className="text-xs text-slate-500">{studio.tags?.slice(0, 2).join(' · ')}</p>
                    </div>
                    {studio.rating > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-slate-600">{studio.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* Рекомендации (когда пустой запрос) */}
            {!searchQuery && (
              <div className="px-4 py-4">
                {/* Быстрые фильтры */}
                <p className="text-xs text-slate-400 mb-3">Быстрый поиск</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {FILTERS.filter(f => f.id !== 'all').map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setActiveFilters([filter.id])
                        setIsSearchOpen(false)
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200 transition-colors"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                {/* Популярные */}
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Популярное
                </p>
                {studios.slice(0, 5).map(studio => (
                  <button
                    key={studio.id}
                    onClick={() => handleSearch(studio.name, studio)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${studio.photos[0] || '/placeholder-studio.jpg'})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{studio.name}</p>
                      <p className="text-xs text-slate-500">{studio.tags?.slice(0, 2).join(' · ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ===== ПОЛНОЭКРАННЫЕ ФИЛЬТРЫ ===== */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => setIsFiltersOpen(false)}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">Фильтры</h2>
            <button 
              onClick={() => {
                setSelectedTags([])
                setActiveFilters([])
              }}
              className="text-sm text-orange-500 font-medium"
            >
              Сбросить
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Категории */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Категория</h3>
              <div className="flex flex-wrap gap-2">
                {/* Кнопка "Все" */}
                <button
                  onClick={() => setActiveFilters([])}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeFilters.length === 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Все
                </button>
                {FILTERS.filter(f => f.id !== 'all' && f.id !== 'top').map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setActiveFilters(prev => 
                        prev.includes(filter.id) ? [] : [filter.id]
                      )
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilters.includes(filter.id)
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Теги — фильтруются по выбранной категории */}
            {(() => {
              // Фильтруем теги по выбранной категории
              const filteredTags = activeFilters.length === 0
                ? allTags
                : Array.from(new Set(
                    studios
                      .filter(s => activeFilters.includes(s.category || ''))
                      .flatMap(s => s.tags || [])
                  )).sort()
              
              return (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Теги {filteredTags.length > 0 && `(${filteredTags.length})`}
                  </h3>
                  {filteredTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filteredTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag) 
                                ? prev.filter(t => t !== tag)
                                : [...prev, tag]
                            )
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Нет тегов для выбранной категории
                    </p>
                  )}
                </div>
              )
            })()}
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-slate-100">
            <button
              onClick={applyTagFilters}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
