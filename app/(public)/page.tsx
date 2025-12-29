'use client'

import { ProfileCard } from '@/components/features/profile/profile-card'
import { PromoCarousel } from '@/components/features/home/promo-carousel'
import { CategoryNav, VENUE_GROUP_MAPPING } from '@/components/features/home/category-nav'
import { ActivityFilters } from '@/components/features/home/activity-filters'
import { CATEGORIES } from '@/lib/constants/categories'
import { HorizontalSection } from '@/components/shared/horizontal-section'
import { BoardSection } from '@/components/features/board/board-section'
import { BoardCard } from '@/components/features/board/board-card'
import { 
  CATEGORIES as BOARD_CATEGORIES, 
  CLIENT_TYPES,
  SPB_DISTRICTS,
} from '@/lib/types/order-request'
import Link from 'next/link'
import { Zap, Map as MapIcon, ArrowUpDown, ChevronLeft, ArrowRight, Plus, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryCard } from '@/components/features/home/category-card'
import { useGeoLocation } from '@/hooks/use-geolocation'
import { calculateDistance } from '@/lib/utils'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ViewToggle } from '@/components/features/home/view-toggle'
import { MapWithList } from '@/components/features/home/map-with-list'
import { useCity } from '@/components/providers/city-provider'
import { useFavorites } from '@/components/providers/favorites-provider'
import { getCategoryLabel } from '@/lib/category-labels'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Интерфейс для профиля из БД
interface DbProfile {
  id: string
  slug: string
  display_name: string
  category: string
  city: string | null
  rating: number
  review_count: number
  price_from: number | null
  main_photo: string | null
  tags: string[]
  is_verified: boolean
  is_featured: boolean
  profile_locations: Array<{
    city: string
    address: string
    geo_location: any
  }>
}

// Моковые данные удалены - используем только реальные данные из БД

export default function HomePage() {
  const { currentCity } = useCity()
  const { favorites } = useFavorites()
  const { coordinates, isLoading: geoLoading } = useGeoLocation()
  
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categoryNavRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  
  // Фильтры по активностям
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([])
  
  // Состояние для доски объявлений
  const [boardRequests, setBoardRequests] = useState<any[]>([])
  const [isLoadingBoard, setIsLoadingBoard] = useState(false)
  const [boardTotal, setBoardTotal] = useState(0)
  
  // Фильтры для доски объявлений
  const [boardCategory, setBoardCategory] = useState<string>('')
  const [boardClientType, setBoardClientType] = useState<string>('')
  const [boardDistrict, setBoardDistrict] = useState('')
  const [boardUrgentOnly, setBoardUrgentOnly] = useState(false)
  const [showBoardFilters, setShowBoardFilters] = useState(false)

  // Загрузка объявлений с учетом фильтров
  const fetchBoardRequests = useCallback(async () => {
    setIsLoadingBoard(true)

    try {
      const params = new URLSearchParams()
      params.set('status', 'active')
      params.set('limit', '100')
      if (boardCategory) params.set('category', boardCategory)
      if (boardClientType) params.set('clientType', boardClientType)
      if (boardDistrict) params.set('district', boardDistrict)
      if (boardUrgentOnly) params.set('urgent', 'true')

      const response = await fetch(`/api/requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBoardRequests(data.requests || [])
        setBoardTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error)
      setBoardRequests([])
      setBoardTotal(0)
    } finally {
      setIsLoadingBoard(false)
    }
  }, [boardCategory, boardClientType, boardDistrict, boardUrgentOnly])

  // Обработчик открытия полной доски объявлений
  const handleShowAllBoard = useCallback(async () => {
    console.log('🎯 handleShowAllBoard called')
    setActiveCategory('board')
    // Сбрасываем фильтры при первом открытии
    setBoardCategory('')
    setBoardClientType('')
    setBoardDistrict('')
    setBoardUrgentOnly(false)
    setShowBoardFilters(false)
    // Скроллим к началу страницы
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Загружаем данные через API route (как в BoardSection)
    setIsLoadingBoard(true)
    try {
      console.log('🔍 Fetching from /api/requests...')
      const response = await fetch('/api/requests?status=active&limit=100')
      console.log('📡 Response status:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 API result:', { requests: data.requests?.length, total: data.total })
        setBoardRequests(data.requests || [])
        setBoardTotal(data.total || 0)
      } else {
        console.error('❌ API error:', response.status, response.statusText)
        setBoardRequests([])
        setBoardTotal(0)
      }
    } catch (err) {
      console.error('❌ Catch error:', err)
      setBoardRequests([])
      setBoardTotal(0)
    } finally {
      setIsLoadingBoard(false)
      console.log('✅ Loading complete')
    }
  }, [])

  // Обработчик hash (#board) при загрузке и изменении
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#board') {
        handleShowAllBoard()
      }
    }

    // Проверяем hash при монтировании
    handleHash()

    // Слушаем изменения hash
    window.addEventListener('hashchange', handleHash)
    
    // Дополнительно: перехватываем клики по ссылкам с #board
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href*="#board"]')
      if (link) {
        e.preventDefault()
        window.location.hash = 'board'
        handleShowAllBoard()
      }
    }
    
    document.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('hashchange', handleHash)
      document.removeEventListener('click', handleClick)
    }
  }, [handleShowAllBoard])

  // Автоскролл к категориям при переключении режимов (scroll magnet)
  useEffect(() => {
    // Пропускаем скролл при первой отрисовке страницы
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Scroll magnet работает ТОЛЬКО когда активны площадки
    if (activeCategory !== 'venues') return

    if (!categoryNavRef.current) return

    // 1. Ждем завершения анимации переключения (400-500мс)
    const timeoutId = setTimeout(() => {
      const element = categoryNavRef.current
      if (!element) return

      // 2. Кастомный плавный скролл
      const headerOffset = 70 // 64px (top-16) + небольшой запас
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset

      // Если мы уже близко (меньше 10px), не скроллим
      if (Math.abs(element.getBoundingClientRect().top - headerOffset) < 10) return

      const startPosition = window.scrollY
      const distance = offsetPosition - startPosition
      const duration = 1000 // 1 секунда для плавности (было "slower")
      let start: number | null = null

      function animation(currentTime: number) {
        if (start === null) start = currentTime
        const timeElapsed = currentTime - start
        const progress = Math.min(timeElapsed / duration, 1)
        
        // Easing function: easeInOutCubic
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

        window.scrollTo(0, startPosition + distance * ease)

        if (timeElapsed < duration) {
          requestAnimationFrame(animation)
        }
      }

      requestAnimationFrame(animation)

    }, 400) // Задержка после переключения

    return () => clearTimeout(timeoutId)
  }, [viewMode])
  const [realItems, setRealItems] = useState<any[]>([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  const [sortBy, setSortBy] = useState<string>('rating') // Сортировка по умолчанию
  const [venueTypeFilter, setVenueTypeFilter] = useState<string>('all') // Фильтр по типу площадки
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({})
  const [desktopCategoryImages, setDesktopCategoryImages] = useState<Record<string, string>>({})
  const [mobileCategoryImages, setMobileCategoryImages] = useState<Record<string, string>>({})
  const [originalCategoryImages, setOriginalCategoryImages] = useState<Record<string, string>>({})
  const [categoryCrops, setCategoryCrops] = useState<Record<string, { desktop?: any, mobile?: any }>>({})

  // Загрузка изображений категорий
  const fetchCategoryImages = async () => {
    try {
      // Добавляем timestamp для обхода кеша
      const response = await fetch(`/api/category-images?t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (!response.ok) {
        // Таблица еще не создана - это нормально для первой загрузки
        console.log('[HomePage] Category images table not found yet. Run migrations first.')
        return
      }
      const data = await response.json()
      if (data.images) {
        console.log('[HomePage] Category images updated:', data.images)
        setCategoryImages(data.images)
      }
      if (data.desktopImages) setDesktopCategoryImages(data.desktopImages)
      if (data.mobileImages) setMobileCategoryImages(data.mobileImages)
      if (data.originalImages) setOriginalCategoryImages(data.originalImages)
      if (data.crops) {
        console.log('[HomePage] Category crops updated:', data.crops)
        setCategoryCrops(data.crops)
      }
    } catch (error) {
      console.error('[HomePage] Error fetching category images:', error)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const fetchProfiles = async () => {
      setIsLoadingProfiles(true)
      try {
        // Используем API вместо прямого запроса к Supabase
        const response = await fetch('/api/profiles/public')
        const data = await response.json()
        if (data.error) {
          console.error('[HomePage] API error:', data.error)
          if (isMounted) {
            setRealItems([])
            setIsLoadingProfiles(false)
          }
          return
        }
        
        const profilesData = data.profiles || []
        if (profilesData.length > 0) {
          // Форматируем данные из API
          const formatted = profilesData.map((p: any) => {
            let cat = 'venues'
            switch(p.category) {
                case 'venue': cat = 'venues'; break;
                case 'animator': cat = 'animators'; break;
                case 'show': cat = 'shows'; break;
                case 'quest': cat = 'quests'; break;
                case 'master_class': cat = 'master_classes'; break;
                case 'photographer': cat = 'photographers'; break;
                case 'agency': cat = 'agencies'; break;
            }

            return {
              id: p.id,
              category: cat,
              slug: p.slug,
              name: p.display_name || p.slug,
              city: p.city || 'Не указан',
              rating: p.rating || 0,
              reviewsCount: p.reviews_count || 0,
              priceFrom: p.price_range || 0,
              priceFromVisit: null,
              budgetCategory: null,
              venueType: null,
              photos: [
                p.cover_photo || p.main_photo || 'https://images.unsplash.com/photo-1555248219-b72ac33c423e?auto=format&fit=crop&q=80&w=800&h=600',
              ],
              tags: [],
              featured: false,
              verified: p.verified || false,
              latitude: null,
              longitude: null,
              locations: [],
              phone: null,
              website: null,
              workingHours: null,
              description: p.bio || null
            }
          })
          if (isMounted) {
            setRealItems(formatted)
            }
        } else {
          if (isMounted) {
            setRealItems([])
          }
        }
      } catch (e) {
        console.error('[HomePage] Error:', e)
        if (isMounted) {
          setRealItems([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfiles(false)
        }
      }
    }
    
    fetchProfiles()
    fetchCategoryImages()
    
    return () => {
      isMounted = false
    }
  }, [])

  const combinedItems = useMemo(() => {
    return realItems
  }, [realItems])

  // 1. Фильтрация по городу
  const cityItems = useMemo(() => {
    if (!currentCity || !currentCity.name) {
      return combinedItems
    }
    const cityNameLower = currentCity.name.toLowerCase()
    return combinedItems.filter(item => {
      if (!item.city) return false
      const itemCityLower = item.city.toLowerCase()
      return itemCityLower.includes(cityNameLower) || cityNameLower.includes(itemCityLower.split(',')[0])
    })
  }, [currentCity, combinedItems])

  // 2. Фильтрация по активной категории (если выбрана)
  const filteredItems = useMemo(() => {
    let items = cityItems

    if (activeCategory === 'favorites') {
      items = items.filter(item => favorites.includes(item.id))
    } else if (activeCategory) {
      items = items.filter(item => item.category === activeCategory)
    }

    // Фильтр по типу площадки (только для категории venues)
    if (activeCategory === 'venues' && venueTypeFilter !== 'all') {
      // Если выбрана группа, фильтруем по всем типам в этой группе
      const allowedTypes = VENUE_GROUP_MAPPING[venueTypeFilter] || []
      items = items.filter(item => {
        const venueType = item.venueType
        return venueType && allowedTypes.includes(venueType)
      })
    }

    return items
  }, [cityItems, activeCategory, favorites, venueTypeFilter])
  
  // 2.5. Фильтрация по активностям (НОВОЕ!)
  const [profilesWithActivities, setProfilesWithActivities] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    if (selectedActivityIds.length === 0) {
      setProfilesWithActivities(new Set())
      return
    }
    
    async function fetchProfilesWithActivities() {
      try {
        const activityIdsQuery = selectedActivityIds.join(',')
        const response = await fetch(`/api/profiles/by-activities?activity_ids=${encodeURIComponent(activityIdsQuery)}`)
        const data = await response.json()
        
        if (data.profileIds) {
          const profileIds = new Set(data.profileIds)
          setProfilesWithActivities(profileIds)
        }
      } catch (error) {
        console.error('[HomePage] Error fetching profiles with activities:', error)
      }
    }
    
    fetchProfilesWithActivities()
  }, [selectedActivityIds])
  
  const activityFilteredItems = useMemo(() => {
    if (selectedActivityIds.length === 0) {
      return filteredItems
    }
    return filteredItems.filter(item => profilesWithActivities.has(item.id))
  }, [filteredItems, selectedActivityIds, profilesWithActivities])

  // 3. Сортировка
  const displayedItems = useMemo(() => {
    let sorted = [...activityFilteredItems]
    
    switch (sortBy) {
      case 'distance':
        // Сортировка по расстоянию (если есть координаты пользователя)
        if (coordinates) {
          sorted = sorted.sort((a, b) => {
            const distA = a.latitude && a.longitude 
              ? calculateDistance(coordinates.latitude, coordinates.longitude, a.latitude, a.longitude)
              : Infinity
            const distB = b.latitude && b.longitude
              ? calculateDistance(coordinates.latitude, coordinates.longitude, b.latitude, b.longitude)
              : Infinity
            return distA - distB
          })
        }
        break
      
      case 'rating':
        // Сортировка по рейтингу (по убыванию)
        sorted = sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      
      case 'reviews':
        // Сортировка по количеству отзывов (по убыванию)
        sorted = sorted.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
        break
      
      case 'price_asc':
        // Сортировка по цене (по возрастанию)
        sorted = sorted.sort((a, b) => {
          const priceA = a.priceFrom || a.price_from || Infinity
          const priceB = b.priceFrom || b.price_from || Infinity
          return priceA - priceB
        })
        break
      
      case 'price_desc':
        // Сортировка по цене (по убыванию)
        sorted = sorted.sort((a, b) => {
          const priceA = a.priceFrom || a.price_from || 0
          const priceB = b.priceFrom || b.price_from || 0
          return priceB - priceA
        })
        break
      
      default:
        // По умолчанию по рейтингу
        sorted = sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }
    
    return sorted
  }, [filteredItems, sortBy, coordinates])

  // Обработчик выбора категории
  const handleCategorySelect = (categoryId: string | null) => {
    setActiveCategory(categoryId)
    // Сбрасываем фильтр по типу при смене категории
    setVenueTypeFilter('all')
    // Сбрасываем сортировку на рейтинг
    setSortBy('rating')
    // Если не площадки - сбрасываем на grid
    if (categoryId !== 'venues') {
      setViewMode('grid')
    }
    
    // Скроллим наверх страницы при открытии категории
    if (categoryId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Обновление при изменении фильтров
  useEffect(() => {
    if (activeCategory === 'board') {
      fetchBoardRequests()
    }
  }, [activeCategory, fetchBoardRequests])

  // Сброс фильтров доски
  const resetBoardFilters = () => {
    setBoardCategory('')
    setBoardClientType('')
    setBoardDistrict('')
    setBoardUrgentOnly(false)
  }

  const hasBoardFilters = boardCategory || boardClientType || boardDistrict || boardUrgentOnly

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-[1340px] px-4 sm:px-6 md:px-8 pt-6">
        
        {/* SEO H1 - скрыт визуально, но виден для поисковиков */}
        <h1 className="sr-only">
          Детские праздники в Санкт-Петербурге: аниматоры, студии, квесты - ZumZam
        </h1>
        
        {/* Промо Баннеры */}
        <PromoCarousel />

        {/* Навигация по категориям (Фильтр) - показываем только когда выбрана категория */}
        {activeCategory !== null && activeCategory !== 'board' && (
          <div ref={categoryNavRef} className="scroll-mt-16">
            <CategoryNav 
              activeCategory={activeCategory} 
              onSelect={handleCategorySelect}
              venueTypeFilter={venueTypeFilter}
              onVenueTypeChange={setVenueTypeFilter}
              rightAction={
                // Переключатель карта/список только для площадок
                activeCategory === 'venues' ? (
                  <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                ) : null
              }
            />
          </div>
        )}
        
        {/* Быстрые фильтры по активностям - показываем когда выбрана категория */}
        {activeCategory !== null && activeCategory !== 'board' && (
          <div className="mt-4 bg-white rounded-[24px] p-4 shadow-sm border border-slate-100">
            <ActivityFilters 
              onFilterChange={setSelectedActivityIds}
              selectedActivities={selectedActivityIds}
            />
          </div>
        )}


        {/* --- РЕЖИМ КАРТЫ (только для площадок и только десктоп) --- */}
        {/* На мобильных карта на отдельной странице /map */}
        {viewMode === 'map' && activeCategory === 'venues' && (
          <div className="hidden md:block mb-12">
            <MapWithList 
              studios={displayedItems.filter(item => 
                item.category === 'venues' && 
                item.latitude != null && 
                item.longitude != null
              )} 
              onBack={() => setViewMode('grid')}
              title="На карте"
            />
          </div>
        )}

        {/* --- РЕЖИМ СПИСКА --- */}
        {viewMode === 'grid' && (
          <>
            {/* 
              СЦЕНАРИЙ 1: Ничего не выбрано.
              Площадки - горизонтальный список
              Остальные категории - карточки категорий в grid
            */}
            {activeCategory === null && (
              <div className="space-y-8 mt-8">
                {/* Площадки - горизонтальная прокрутка */}
                {(() => {
                  const venueItems = cityItems.filter(item => item.category === 'venues')
                  if (venueItems.length > 0) {
                    return (
                      <div key="venues">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Площадки для праздника</h2>
                          <button 
                            onClick={() => handleCategorySelect('venues')}
                            className="flex items-center gap-1 px-3 h-8 bg-white hover:bg-gray-50 text-orange-500 hover:text-orange-600 rounded-full text-[13px] font-medium shadow-sm transition-all"
                          >
                            Все
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <HorizontalSection
                          title=""
                          items={venueItems}
                          categorySlug="venues"
                          cardRoundedClassName="rounded-[24px]"
                          onShowAll={() => {}}
                          showAllButton={false}
                        />
                      </div>
                    )
                  }
                  return null
                })()}
                
                {/* Остальные категории - карточки в grid */}
                {(() => {
                  const otherCategories = CATEGORIES.filter(cat => cat.id !== 'venues')
                  const categoriesWithItems = otherCategories.filter(cat => {
                    const items = cityItems.filter(item => item.category === cat.id)
                    return items.length > 0
                  })
                  
                  if (categoriesWithItems.length > 0) {
                     return (
                       <section>
                         <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4">Услуги для праздника</h2>
                         <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                          {categoriesWithItems.map((cat) => {
                            const items = cityItems.filter(item => item.category === cat.id)
                            const crops = categoryCrops[cat.id] || {}
                            return (
                              <CategoryCard
                                key={cat.id}
                                name={cat.name}
                                categoryId={cat.id}
                                count={items.length}
                                imageUrl={categoryImages[cat.id]} // Fallback
                                originalImageUrl={originalCategoryImages[cat.id]} // Для редактора
                                desktopImageUrl={desktopCategoryImages[cat.id]} // Готовый кроп
                                mobileImageUrl={mobileCategoryImages[cat.id]} // Готовый кроп
                                desktopCrop={crops.desktop}
                                mobileCrop={crops.mobile}
                                onClick={() => handleCategorySelect(cat.id)}
                                onImageUpdate={fetchCategoryImages}
                                roundedClassName="rounded-[24px]"
                              />
                            )
                          })}
                        </div>
                      </section>
                    )
                  }
                  return null
                })()}
                
                {/* Если совсем пусто в городе */}
                {cityItems.length === 0 && (
                   <div className="text-center py-12 bg-slate-50 rounded-[24px]">
                      <p className="text-slate-500">В городе {currentCity.name} пока нет объявлений</p>
              </div>
                )}

                {/* Доска объявлений — после всех категорий */}
                <BoardSection onShowAll={handleShowAllBoard} />
            </div>
            )}

            {/* 
              СЦЕНАРИЙ 2: Выбрана категория.
              Показываем полную сетку (Grid) выбранной категории.
            */}
            {activeCategory !== null && (
              <div className={cn(
                "animate-in fade-in zoom-in-95 duration-300",
                activeCategory === 'board' ? "mt-8" : ""
              )}>
                {/* Заголовок и кнопка "Назад" */}
                <div className={cn(
                  "flex items-center justify-between",
                  activeCategory === 'board' ? "mb-8" : "mb-6"
                )}>
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-900">
                    {activeCategory === 'favorites' 
                      ? 'Избранное' 
                      : activeCategory === 'board'
                        ? 'Доска объявлений'
                        : CATEGORIES.find(c => c.id === activeCategory)?.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    {activeCategory === 'board' && (
                      <Link 
                        href="/create-request"
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Разместить
                      </Link>
                    )}
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="flex items-center gap-1 px-3 h-8 bg-white hover:bg-gray-50 text-orange-500 hover:text-orange-600 rounded-full text-[13px] font-medium shadow-sm transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Назад
                    </button>
                  </div>
                </div>

                {/* Панель сортировки и фильтров - только для площадок */}
                {activeCategory === 'venues' && (
                  <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
                    {/* Сортировка */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-9 px-3.5 text-[13px] font-medium bg-gray-100 border-0 rounded-full min-w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">По рейтингу</SelectItem>
                          <SelectItem value="reviews">По отзывам</SelectItem>
                          <SelectItem value="distance">По расстоянию</SelectItem>
                          <SelectItem value="price_asc">Дешевле</SelectItem>
                          <SelectItem value="price_desc">Дороже</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Панель фильтрации для доски объявлений */}
                {activeCategory === 'board' && (
                  <div className="mb-8">
                    {/* Фильтры — категории */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <button
                        onClick={() => setBoardCategory('')}
                        className={cn(
                          "group relative shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full transition-colors duration-200 text-[13px] font-medium",
                          !boardCategory ? "text-white" : "text-gray-700"
                        )}
                      >
                        {/* Серый фон */}
                        <span 
                          className="absolute inset-0 rounded-full bg-gray-100 transition-colors duration-200 group-hover:bg-gray-200" 
                          style={{ zIndex: 0 }}
                        />
                        
                        {/* Оранжевый фон (активный) с анимацией */}
                        {!boardCategory && (
                          <motion.div
                            layoutId="board-category-pill"
                            className="absolute inset-0 bg-orange-500 rounded-full"
                            style={{ zIndex: 10 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        
                        {/* Контент */}
                        <span className="relative z-20">Все категории</span>
                      </button>

                      {BOARD_CATEGORIES.slice(0, 8).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setBoardCategory(cat.id)}
                          className={cn(
                            "group relative shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full transition-colors duration-200 text-[13px] font-medium",
                            boardCategory === cat.id ? "text-white" : "text-gray-700"
                          )}
                        >
                          {/* Серый фон */}
                          <span 
                            className="absolute inset-0 rounded-full bg-gray-100 transition-colors duration-200 group-hover:bg-gray-200" 
                            style={{ zIndex: 0 }}
                          />
                          
                          {/* Оранжевый фон (активный) с анимацией */}
                          {boardCategory === cat.id && (
                            <motion.div
                              layoutId="board-category-pill"
                              className="absolute inset-0 bg-orange-500 rounded-full"
                              style={{ zIndex: 10 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                          
                          {/* Контент - убрали эмодзи, оставили только текст */}
                          <span className="relative z-20">{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Дополнительные фильтры */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setBoardUrgentOnly(!boardUrgentOnly)}
                        className={cn(
                          "group relative shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full transition-colors duration-200 text-[13px] font-medium",
                          boardUrgentOnly ? "text-white" : "text-gray-700"
                        )}
                      >
                        {/* Фон */}
                        <span 
                          className={cn(
                            "absolute inset-0 rounded-full transition-colors duration-200",
                            boardUrgentOnly 
                              ? "bg-red-500" 
                              : "bg-gray-100 group-hover:bg-red-50"
                          )}
                          style={{ zIndex: 0 }}
                        />
                        
                        {/* Контент */}
                        <span className="relative z-20">
                          <span className="hidden sm:inline">Срочные</span>
                          <span className="sm:hidden">Срочные</span>
                        </span>
                      </button>

                      <button
                        onClick={() => setShowBoardFilters(!showBoardFilters)}
                        className={cn(
                          "group relative shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full transition-colors duration-200 text-[13px] font-medium",
                          showBoardFilters || hasBoardFilters ? "text-orange-700" : "text-gray-700"
                        )}
                      >
                        {/* Фон */}
                        <span 
                          className={cn(
                            "absolute inset-0 rounded-full transition-colors duration-200",
                            showBoardFilters || hasBoardFilters
                              ? "bg-orange-100"
                              : "bg-gray-100 group-hover:bg-gray-200"
                          )}
                          style={{ zIndex: 0 }}
                        />
                        
                        {/* Контент */}
                        <span className="relative z-20 flex items-center gap-1.5">
                          <span>Фильтры</span>
                          {hasBoardFilters && (
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          )}
                        </span>
                      </button>

                      {hasBoardFilters && (
                        <button
                          onClick={resetBoardFilters}
                          className="shrink-0 inline-flex items-center gap-1 px-3 h-9 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <span>Сбросить</span>
                        </button>
                      )}
                    </div>

                    {/* Расширенные фильтры */}
                    {showBoardFilters && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-[18px] grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Тип заказчика */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 font-medium">
                            Тип заказчика
                          </label>
                          <select
                            value={boardClientType}
                            onChange={(e) => setBoardClientType(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-full text-[13px] font-medium"
                          >
                            <option value="">Все типы</option>
                            {CLIENT_TYPES.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.emoji} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Район */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 font-medium">
                            Район
                          </label>
                          <select
                            value={boardDistrict}
                            onChange={(e) => setBoardDistrict(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-gray-200 rounded-full text-[13px] font-medium"
                          >
                            <option value="">Любой район</option>
                            {SPB_DISTRICTS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Контент для обычных категорий */}
                {activeCategory !== 'board' && displayedItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
                    {displayedItems.map((item) => (
                      <ProfileCard
                        key={item.id}
                        {...item}
                        enableSwipeExpand={true}
                        roundedClassName="rounded-[24px]"
                      />
                    ))}
              </div>
                ) : activeCategory !== 'board' ? (
                  <div className="text-center py-8 md:py-12 bg-slate-50 rounded-xl md:rounded-[24px]">
                    <p className="text-slate-500 text-sm md:text-base">В этой категории пока нет объявлений</p>
              </div>
                ) : null}

                {/* Контент для доски объявлений */}
                {activeCategory === 'board' && (
                  <>
                    {console.log('🎨 Rendering board section, isLoadingBoard:', isLoadingBoard, 'boardRequests.length:', boardRequests.length)}
                    {isLoadingBoard ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="h-48 bg-white rounded-[24px] animate-pulse"
                          />
                        ))}
                      </div>
                    ) : boardRequests.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {boardRequests.map((request) => (
                          <BoardCard 
                            key={request.id} 
                            request={request} 
                            onDelete={fetchBoardRequests}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-[24px]">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          Объявлений пока нет
                        </h2>
                        <p className="text-gray-500 mb-6">
                          {hasBoardFilters 
                            ? 'Попробуйте изменить фильтры' 
                            : 'Станьте первым, кто разместит объявление!'
                          }
                        </p>
                        <Link href="/create-request">
                          <Button className="bg-orange-500 hover:bg-orange-600 rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Разместить объявление
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Секция Партнёры - стиль Яндекса */}
            <section className="mt-10 rounded-[24px] bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 sm:p-8 relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="max-w-lg">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Владелец детской студии?</h2>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Добавьте свою площадку и получайте заказы. Более 10 000 родителей ищут праздник.
                  </p>
                </div>
                <Link 
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-all shrink-0"
                >
                  Добавить площадку
                </Link>
              </div>
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/10 to-transparent" />
            </section>
          </>
        )}

      </div>
    </div>
  )
}


