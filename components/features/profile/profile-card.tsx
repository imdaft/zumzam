'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, Navigation } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useGeoLocation } from '@/hooks/use-geolocation'
import { calculateDistance } from '@/lib/utils'
import { useFavorites } from '@/components/providers/favorites-provider'
import { getVenueTypeName } from '@/lib/constants/venue-types'

export interface ProfileCardProps {
  id: string
  slug: string
  name: string
  city: string
  rating: number
  reviewsCount: number
  priceFrom: number
  priceFromVisit?: number | null
  budgetCategory?: string | null
  photos: string[]
  tags: string[]
  verified?: boolean
  featured?: boolean
  latitude?: number
  longitude?: number
  /** Включить свайп-расширение карточки (16:9 → 1:1 при листании) */
  enableSwipeExpand?: boolean
  isHovered?: boolean
  venueType?: string | null
  category?: string
  /** Переопределение скругления (например, rounded-[24px]) */
  roundedClassName?: string
}

export function ProfileCard({
  id,
  slug,
  name,
  rating,
  reviewsCount,
  priceFrom,
  photos,
  tags,
  verified = false,
  featured = false,
  latitude,
  longitude,
  enableSwipeExpand = false, // По умолчанию выключен, включается в вертикальном списке
  isHovered = false,
  venueType,
  category,
  roundedClassName
}: ProfileCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const isLiked = isFavorite(id)
  const { coordinates } = useGeoLocation()
  
  // Проверка на touch-устройство (отключаем hover-галерею на мобильных)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  // Галерея: используем все фото из props (главное фото + фото услуг уже в массиве)
  // Фильтруем пустые строки
  const validPhotos = photos.filter(p => p && p.trim() !== '')
  const galleryPhotos = validPhotos.length > 0 ? validPhotos : ['/placeholder-studio.jpg']
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // ========================================
  // 📱 SWIPE EXPAND: 16:9 → 1:1 при свайпе
  // ========================================
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandProgress, setExpandProgress] = useState(0) // 0 = 16:9, 1 = 1:1
  const [isSwiping, setIsSwiping] = useState(false)
  const isCollapsingRef = useRef(false) // Флаг: идёт программное сворачивание
  const isMagnetScrollingRef = useRef(false) // Флаг: идёт программный скролл (магнит)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const scrollStartX = useRef(0)
  const hasMultiplePhotos = galleryPhotos.length > 1
  
  // Направление свайпа: 'horizontal' | 'vertical' | null
  const swipeDirection = useRef<'horizontal' | 'vertical' | null>(null)
  
  // Рассчитываем текущий aspect ratio на основе progress
  // 16:9 = 1.778, 1:1 = 1.0
  // aspectRatio = 16/9 - progress * (16/9 - 1) = 1.778 - progress * 0.778
  const currentAspectRatio = 16/9 - expandProgress * (16/9 - 1)

  // Функция плавного сворачивания карточки — СНАЧАЛА сужаем, ПОТОМ прокручиваем к первой фотке
  const collapseCard = useCallback(() => {
    // Устанавливаем флаг — идёт программное сворачивание
    isCollapsingRef.current = true
    
    // 1. Сужаем карточку
    setExpandProgress(0)
    setIsExpanded(false)
    lastProgressRef.current = 0
    
    // 2. Отключаем snap и МГНОВЕННО переставляем галерею на первую фотку
    // (карточка уже сужена, так что скачок не виден)
    if (carouselRef.current) {
      carouselRef.current.style.scrollSnapType = 'none'
      carouselRef.current.scrollLeft = 0  // Мгновенно, без анимации
    }
    setActivePhotoIndex(0)
    
    // 3. Через небольшую задержку включаем snap обратно и снимаем флаг
    setTimeout(() => {
      isCollapsingRef.current = false
      if (carouselRef.current) {
        carouselRef.current.style.scrollSnapType = 'x mandatory'
      }
    }, 100)
  }, [])

  // Touch handlers — определяем направление в первые 10px
  // Используем passive: false для touchmove чтобы иметь возможность блокировать скролл
  useEffect(() => {
    if (!enableSwipeExpand || !hasMultiplePhotos) return
    
    const carousel = carouselRef.current
    if (!carousel) return
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      scrollStartX.current = carousel.scrollLeft
      swipeDirection.current = null
      setIsSwiping(true)
      // Сбрасываем флаг — начался новый ручной свайп
      isCollapsingRef.current = false
      // Пока не определили направление — блокируем всё, потом разрешим нужное
      carousel.style.touchAction = 'none'
      // Отключаем snap пока палец на экране — убираем дёрганье
      carousel.style.scrollSnapType = 'none'
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = touch.clientY - touchStartY.current
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)
      
      // Определяем направление по первым 8px
      if (swipeDirection.current === null && (absDeltaX > 8 || absDeltaY > 8)) {
        if (absDeltaX > absDeltaY) {
          // Горизонтальный свайп — листаем галерею
          swipeDirection.current = 'horizontal'
          
          // Магнитим карточку к верху списка (чтобы увеличенная карточка была видна)
          const card = cardRef.current
          if (card) {
            const scrollParent = card.closest('[class*="overflow-y-auto"], [class*="overflow-auto"]') as HTMLElement
            const cardWrapper = card.closest('.block.relative') as HTMLElement || card.parentElement
            
            // Устанавливаем флаг — идёт программный скролл (не сворачивать карточку!)
            isMagnetScrollingRef.current = true
            
            if (scrollParent && cardWrapper) {
              // Есть родительский контейнер со скроллом (например, в списке карт)
              const parentRect = scrollParent.getBoundingClientRect()
              const cardRect = cardWrapper.getBoundingClientRect()
              const scrollTop = scrollParent.scrollTop
              const offset = cardRect.top - parentRect.top + scrollTop - 16
              scrollParent.scrollTo({ top: offset, behavior: 'smooth' })
            } else if (cardWrapper) {
              // Скролл на уровне window (например, на главной странице)
              // Ищем заголовок секции над карточкой
              const section = card.closest('section, [class*="mb-"]')
              const sectionHeader = section?.querySelector('h2, h3, [class*="font-bold"]')
              
              // Учитываем sticky header (~130px) + отступ
              const headerOffset = 140
              
              if (sectionHeader) {
                // Если есть заголовок секции — скроллим к нему
                const headerRect = sectionHeader.getBoundingClientRect()
                const targetY = window.scrollY + headerRect.top - headerOffset
                window.scrollTo({ top: targetY, behavior: 'smooth' })
              } else {
                // Иначе скроллим к самой карточке
                const cardRect = cardWrapper.getBoundingClientRect()
                const targetY = window.scrollY + cardRect.top - headerOffset
                window.scrollTo({ top: targetY, behavior: 'smooth' })
              }
            }
            
            // Снимаем флаг после завершения скролла
            setTimeout(() => {
              isMagnetScrollingRef.current = false
            }, 500)
          }
        } else {
          // Вертикальный свайп — разрешаем скролл страницы
          swipeDirection.current = 'vertical'
          setIsSwiping(false)
          // Отключаем карусель — пусть страница скроллится
          carousel.style.touchAction = 'pan-y'
          carousel.style.pointerEvents = 'none'
          
          // Если карточка расширена — сразу плавно сворачиваем
          if (isExpanded) {
            // Устанавливаем флаг СРАЗУ, до вызова collapseCard
            isCollapsingRef.current = true
            collapseCard()
          }
        }
      }
      
      // При горизонтальном свайпе — программно скроллим карусель
      if (swipeDirection.current === 'horizontal') {
        carousel.scrollLeft = scrollStartX.current - deltaX
      }
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      const wasHorizontal = swipeDirection.current === 'horizontal'
      
      // Восстанавливаем стили
      carousel.style.touchAction = ''
      carousel.style.pointerEvents = ''
      carousel.style.scrollSnapType = 'x mandatory' // Включаем snap — CSS сам примагнитит
      
      // При горизонтальном свайпе — позволяем CSS snap и handleScroll работать вместе
      if (wasHorizontal) {
        const cardWidth = carousel.clientWidth
        const currentScroll = carousel.scrollLeft
        const targetIndex = Math.round(currentScroll / cardWidth)
        const clampedIndex = Math.max(0, Math.min(targetIndex, galleryPhotos.length - 1))
        
        // Выключаем isSwiping — теперь handleScroll будет обновлять expandProgress
        // по мере того как CSS snap анимирует scrollLeft
        setIsSwiping(false)
        swipeDirection.current = null
        setActivePhotoIndex(clampedIndex)
      } else {
        setTimeout(() => {
          setIsSwiping(false)
          swipeDirection.current = null
        }, 100)
      }
    }
    
    carousel.addEventListener('touchstart', handleTouchStart, { passive: true })
    carousel.addEventListener('touchmove', handleTouchMove, { passive: true })
    carousel.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      carousel.removeEventListener('touchstart', handleTouchStart)
      carousel.removeEventListener('touchmove', handleTouchMove)
      carousel.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enableSwipeExpand, hasMultiplePhotos, galleryPhotos.length, isExpanded, collapseCard])
  

  // При скролле карусели — плавно меняем aspect ratio
  // Используем ref для хранения последнего значения progress (избегаем лишних ререндеров)
  const lastProgressRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  
  const handleScroll = useCallback(() => {
    if (!carouselRef.current || !enableSwipeExpand || !hasMultiplePhotos) return
    
    // Игнорируем скролл во время программного сворачивания
    if (isCollapsingRef.current) return
    
    // Используем requestAnimationFrame для оптимизации
    if (rafRef.current) return
    
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      if (!carouselRef.current) return
      
      const scrollLeft = carouselRef.current.scrollLeft
      const cardWidth = carouselRef.current.clientWidth
      
      // Прогресс расширения: 0 при scrollLeft=0, 1 при scrollLeft >= 66% ширины
      const threshold = cardWidth * 0.66
      const progress = Math.min(scrollLeft / threshold, 1)
      
      // Обновляем только если прогресс изменился значительно (> 0.01)
      if (Math.abs(progress - lastProgressRef.current) > 0.01) {
        lastProgressRef.current = progress
        setExpandProgress(progress)
        setIsExpanded(progress > 0.5)
      }
      
      // Обновляем активный индекс фото
      const newIndex = Math.round(scrollLeft / cardWidth)
      if (newIndex !== activePhotoIndex && newIndex >= 0 && newIndex < galleryPhotos.length) {
        setActivePhotoIndex(newIndex)
      }
    })
  }, [enableSwipeExpand, hasMultiplePhotos, activePhotoIndex, galleryPhotos.length])

  // Возврат к 16:9 после таймаута — очень плавно
  useEffect(() => {
    if (isExpanded && !isSwiping) {
      const timer = setTimeout(() => {
        collapseCard()
      }, 15000) // 15 секунд неактивности
      
      return () => clearTimeout(timer)
    }
  }, [isExpanded, isSwiping, collapseCard])
  
  // При скролле страницы — сворачиваем карточку сразу (предотвращает дёрганье)
  useEffect(() => {
    if (!isExpanded || !enableSwipeExpand) return
    
    const handlePageScroll = () => {
      // Игнорируем программный скролл (магнит к верху)
      if (isMagnetScrollingRef.current) return
      
      // Устанавливаем флаг СРАЗУ, до вызова collapseCard
      isCollapsingRef.current = true
      collapseCard()
    }
    
    window.addEventListener('scroll', handlePageScroll, { passive: true })
    return () => window.removeEventListener('scroll', handlePageScroll)
  }, [isExpanded, enableSwipeExpand, collapseCard])

  // Расчет расстояния
  let distanceDisplay = null
  if (coordinates && latitude && longitude) {
    const dist = calculateDistance(
      coordinates.latitude, 
      coordinates.longitude, 
      latitude, 
      longitude
    )
    distanceDisplay = `${dist} км`
  }

  // Hover-галерея: при движении мыши меняется фото (только на десктопе, отключено на touch)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Отключаем на touch-устройствах
    if (isTouchDevice) return
    if (!cardRef.current || galleryPhotos.length <= 1 || isExpanded) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const sectionWidth = width / galleryPhotos.length
    const newIndex = Math.min(Math.max(0, Math.floor(x / sectionWidth)), galleryPhotos.length - 1)
    
    // Обновляем только если индекс изменился (убирает мерцание)
    setActivePhotoIndex(prev => prev === newIndex ? prev : newIndex)
  }, [galleryPhotos.length, isExpanded, isTouchDevice])

  const handleMouseEnter = () => {
    // Отключаем на touch-устройствах
    if (isTouchDevice) return
    setIsHovering(true)
  }
  const handleMouseLeave = () => {
    if (isTouchDevice) return
    setIsHovering(false)
  }

  // Адаптивное округление: мобильные — плоские, десктоп — как промо-карусель
  const roundedClasses = roundedClassName ?? 'rounded-[28px]'
  
  return (
    <div className="block relative w-full">
      {/* Контейнер изображения с динамическим aspect-ratio */}
      <div 
        ref={cardRef}
        className={`relative w-full bg-gray-100 overflow-hidden shadow-none md:shadow-sm hover:shadow-md ${roundedClasses}`}
        style={{ 
          aspectRatio: `${currentAspectRatio} / 1`,
          // Плавный переход — медленнее когда сворачиваемся
          transition: isSwiping 
            ? 'none' 
            : `aspect-ratio ${expandProgress > 0 ? '0.6s' : '0.8s'} cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.2s`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link 
          href={`/profiles/${slug}`} 
          prefetch={true}
          className="block h-full" 
          onClick={(e) => {
            // Предотвращаем переход ТОЛЬКО если активно свайпим прямо сейчас
            if (isSwiping) {
              e.preventDefault()
            }
          }}
        >
          <div className="relative w-full h-full">
            {/* Режим свайпа: горизонтальная карусель */}
            {enableSwipeExpand && hasMultiplePhotos ? (
              <div 
                ref={carouselRef}
                className="absolute inset-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
                onScroll={handleScroll}
                style={{ 
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {galleryPhotos.map((photo, index) => (
                  <div 
                    key={index}
                    className="relative w-full h-full shrink-0 snap-center"
                    style={{ scrollSnapStop: 'always' }}
                  >
                    <Image
                      src={photo || '/placeholder-studio.jpg'}
                      alt={`${name} - фото ${index + 1}`}
                      fill
                      className="object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Обычный режим: одно фото с hover-переключением */
              <Image
                src={galleryPhotos[activePhotoIndex] || '/placeholder-studio.jpg'}
                alt={name}
                fill
                className="object-cover transition-opacity duration-200"
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
            
            {/* Лёгкая подсветка при hover на маркере карты */}
            {isHovered && (
              <div className={`absolute inset-0 ring-2 ring-inset ring-orange-400 z-[5] ${roundedClasses}`} />
            )}
            
            {/* Затемнение сверху — только при hover */}
            <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/10 to-transparent transition-opacity pointer-events-none ${isHovering ? 'opacity-100' : 'opacity-0'}`} />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

            {/* Индикаторы галереи — маленькие точки справа внизу */}
            {/* На мобильных (enableSwipeExpand) — всегда показываем, на десктопе — только при hover */}
            {galleryPhotos.length > 1 && (enableSwipeExpand || isHovering || isExpanded || expandProgress > 0) && (
              <div className="absolute bottom-2 right-2 flex gap-1 z-20 pointer-events-none">
                {galleryPhotos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      index === activePhotoIndex
                        ? 'bg-white w-3'
                        : 'bg-white/50 w-1.5'
                    }`}
                  />
                ))}
              </div>
            )}
            

            {/* Favorite Button — компактный как у Яндекса */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite(id)
              }}
              className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-95 z-20 pointer-events-auto ${
                isLiked
                  ? 'bg-gray-900 shadow-sm'
                  : 'bg-gray-900/70 backdrop-blur-sm'
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : 'text-white'
                }`}
              />
            </button>

            {/* Badges — Промо */}
            {featured && (
              <div className="absolute top-8 left-2 z-20 pointer-events-none">
                <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded-full">
                  Промо
                </span>
              </div>
            )}
            
            {/* Расстояние — компактный */}
            {distanceDisplay && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-white/95 text-gray-900 text-[10px] font-medium rounded-full flex items-center gap-0.5 z-20">
                <Navigation className="h-2.5 w-2.5" />
                {distanceDisplay}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Текст под карточкой */}
      <div className="mt-2 px-1">
        {/* Строка 1: Название + Рейтинг */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[16px] leading-tight font-bold text-gray-900 truncate flex-1 min-w-0">
            {name}
          </h3>
          {rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-[12px] font-medium text-gray-700">{typeof rating === 'number' ? rating.toFixed(1) : Number(rating || 0).toFixed(1)}</span>
            </div>
          )}
        </div>
        
        {/* Строка 2: Цена + Тип */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {priceFrom > 0 ? (
            <span className="text-[12px] text-gray-500">
              от {priceFrom.toLocaleString('ru-RU')} ₽
            </span>
          ) : (
            <span />
          )}
          {(category === 'venues' || category === 'venue') && (
            <span className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-500 rounded-full">
              {getVenueTypeName(venueType) || 'Площадка'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
