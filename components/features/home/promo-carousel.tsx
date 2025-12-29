'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

// Дефолтные баннеры удалены - используем только рекламные кампании из базы

interface Banner {
  id: string
  title: string
  subtitle?: string
  image: string
  color?: string
  link: string
  isAd: boolean
  campaignId?: string
  slotId?: string
}

export function PromoCarousel(): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  
  // Количество карточек для показа: 1 на мобильных, 3 на десктопе
  const [cardsToShow, setCardsToShow] = useState(3)
  const [bannerWidth, setBannerWidth] = useState(0)
  const gap = 16
  
  // Загрузка рекламных баннеров
  useEffect(() => {
    loadActiveBanners()
  }, [])

  const loadActiveBanners = async () => {
    try {
      console.log('[PromoCarousel] 🔍 Fetching active banners...')
      const response = await fetch('/api/advertising/active-banners?slot=Карусель на главной')
      const data = await response.json()
      console.log('[PromoCarousel] 📦 Response:', data)

      if (data.banners && data.banners.length > 0) {
        console.log('[PromoCarousel] ✅ Found', data.banners.length, 'ad banners')
        // Преобразуем рекламные кампании в формат баннеров
        const adBanners: Banner[] = data.banners.map((booking: any) => ({
          id: booking.campaign.id,
          title: booking.campaign.title,
          subtitle: booking.campaign.description,
          image: booking.campaign.image_url,
          color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500',
          link: booking.campaign.link_url,
          isAd: true,
          campaignId: booking.campaign.id,
          slotId: booking.ad_slot_id
        }))

        console.log('[PromoCarousel] 🎨 Setting banners:', adBanners.length, 'total')
        setBanners(adBanners)
      } else {
        console.log('[PromoCarousel] ℹ️ No ad banners')
        setBanners([])
      }
    } catch (error) {
      console.error('[PromoCarousel] ❌ Error loading ad banners:', error)
      setBanners([])
    } finally {
      setIsLoading(false)
    }
  }

  // Получаем данные о пользователе для аналитики
  const getAnalyticsData = () => {
    const ua = navigator.userAgent
    
    // Device type
    let deviceType = 'desktop'
    if (/mobile/i.test(ua)) deviceType = 'mobile'
    else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'
    
    // Browser
    let browser = 'unknown'
    if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Chrome') && !ua.includes('Edge')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Edge')) browser = 'Edge'
    else if (ua.includes('Opera')) browser = 'Opera'
    
    // OS
    let os = 'unknown'
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
    
    return {
      deviceType,
      browser,
      os,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  // Отслеживание показа баннера
  const trackImpression = async (banner: Banner) => {
    if (!banner.isAd || !banner.campaignId || !banner.slotId) {
      console.log('[PromoCarousel] ⏭️ Skipping impression tracking (not an ad)')
      return
    }

    try {
      const analyticsData = getAnalyticsData()
      
      await fetch('/api/advertising/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: banner.campaignId,
          slotId: banner.slotId,
          action: 'impression',
          ...analyticsData
        })
      }).catch(() => null) // Игнорируем ошибки трекинга
    } catch (error) {
      // Silently fail - не засоряем консоль
    }
  }

  // Отслеживание клика по баннеру
  const trackClick = async (banner: Banner) => {
    if (!banner.isAd || !banner.campaignId || !banner.slotId) {
      console.log('[PromoCarousel] ⏭️ Skipping click tracking (not an ad)')
      return
    }

    try {
      console.log('[PromoCarousel] 🖱️ Tracking click:', banner.campaignId)
      
      const analyticsData = getAnalyticsData()
      
      const response = await fetch('/api/advertising/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: banner.campaignId,
          slotId: banner.slotId,
          action: 'click',
          previousPage: document.referrer,
          ...analyticsData
        })
      })
      
      console.log('[PromoCarousel] 📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[PromoCarousel] ❌ Click tracking failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
      } else {
        const result = await response.json()
        console.log('[PromoCarousel] ✅ Click tracked:', result)
      }
    } catch (error: any) {
      console.error('[PromoCarousel] ❌ Click tracking error:', error?.message || error)
    }
  }
  
  const updateDimensions = useCallback(() => {
    const mobile = window.innerWidth < 640
    setIsMobile(mobile)
    
    if (containerRef.current) {
      const containerWidth = mobile 
        ? window.innerWidth 
        : containerRef.current.clientWidth
      
      // Мобильные: ровно 1 карточка с отступами по краям (gap)
      // Десктоп: 3 карточки
      const cards = mobile ? 1 : 3
      setCardsToShow(cards)
      
      if (mobile) {
        // На мобильных: ширина карточки = viewport - отступы слева и справа
        const mobileHorizontalPadding = gap * 2 // 16px * 2 = 32px суммарно
        setBannerWidth(containerWidth - mobileHorizontalPadding)
      } else {
        const totalGaps = gap * (cards - 1)
        const width = (containerWidth - totalGaps) / cards
        setBannerWidth(width)
      }
    }
  }, [gap])

  useEffect(() => {
    updateDimensions()
    // Повторяем через небольшую задержку для надежности
    const timeoutId = setTimeout(updateDimensions, 100)
    
    window.addEventListener('resize', updateDimensions)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [updateDimensions])

  // Пересчитываем размеры после загрузки баннеров
  useEffect(() => {
    if (!isLoading && banners.length > 0) {
      updateDimensions()
    }
  }, [isLoading, banners.length, updateDimensions])
  
  const maxIndex = Math.max(0, banners.length - cardsToShow)
  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < maxIndex

  const animateScroll = useCallback((fromIndex: number, toIndex: number) => {
    if (!trackRef.current || bannerWidth === 0) return

    setIsAnimating(true)
    
    const startTranslate = fromIndex * (bannerWidth + gap)
    const endTranslate = toIndex * (bannerWidth + gap)
    const duration = 400
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentTranslate = startTranslate + (endTranslate - startTranslate) * easeOut
      
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${currentTranslate}px)`
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setCurrentIndex(toIndex)
      }
    }
    
    requestAnimationFrame(animate)
  }, [bannerWidth, gap])

  const scroll = (direction: 'left' | 'right') => {
    if (isAnimating) return
    
    const scrollBy = 3 // Смещаем на 3 баннера
    
    if (direction === 'left' && canScrollLeft) {
      const newIndex = Math.max(0, currentIndex - scrollBy)
      animateScroll(currentIndex, newIndex)
    } else if (direction === 'right' && canScrollRight) {
      const newIndex = Math.min(maxIndex, currentIndex + scrollBy)
      animateScroll(currentIndex, newIndex)
    }
  }

  // Автопрокрутка только на мобильных
  useEffect(() => {
    if (!isMobile || isHovered || isTouching || isLoading) return
    
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length
      setCurrentIndex(nextIndex)
      trackImpression(banners[nextIndex])
    }, 4000)
    
    return () => clearInterval(interval)
  }, [isHovered, isTouching, banners, isLoading, isMobile, currentIndex])

  // Отслеживаем показ первых баннеров при загрузке
  useEffect(() => {
    if (!isLoading && banners.length > 0) {
      for (let i = 0; i < Math.min(cardsToShow, banners.length); i++) {
        trackImpression(banners[i])
      }
    }
  }, [isLoading, banners, cardsToShow])
  

  if (isLoading) {
    return (
      <div className="relative -mx-2 sm:mx-0 mb-4 md:mb-6 h-[140px] sm:h-[160px] md:h-[180px] bg-gray-100 rounded-xl sm:rounded-[24px] animate-pulse" />
    )
  }

  // Если нет баннеров, не рендерим ничего
  if (banners.length === 0) {
    return null
  }

  const initialTranslateX = currentIndex * (bannerWidth + gap)

  return (
    <div 
      className="relative -mx-2 sm:mx-0 mb-4 md:mb-6 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Кнопки навигации — только на десктопе */}
      {!isMobile && (
        <>
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft || isAnimating}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg items-center justify-center transition-all border border-gray-100 ${
              canScrollLeft 
                ? 'hidden group-hover:flex bg-white hover:bg-gray-50 cursor-pointer' 
                : 'hidden'
            }`}
            aria-label="Предыдущий"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight || isAnimating}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg items-center justify-center transition-all border border-gray-100 ${
              canScrollRight 
                ? 'hidden group-hover:flex bg-white hover:bg-gray-50 cursor-pointer' 
                : 'hidden'
            }`}
            aria-label="Следующий"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Мобильная карусель — с отступами по краям и центрированием */}
      {isMobile ? (
        <div 
          ref={containerRef}
          className="overflow-x-auto scrollbar-hide px-2"
          style={{
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '8px',
            scrollPaddingRight: '8px'
          }}
        >
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ 
              gap: `${gap}px`
            }}
            onTouchStart={(e) => {
              setIsTouching(true)
            }}
            onTouchEnd={(e) => {
              setTimeout(() => setIsTouching(false), 3000)
            }}
          >
            {banners.map((banner, idx) => {
              const isExternal = banner.isAd && !banner.link.startsWith('/')

              const BannerContent = (
                <>
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    priority={idx < 2}
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 p-4 flex flex-col justify-center">
                    {banner.isAd && (
                      <Badge className="absolute bottom-2 right-2 bg-white/95 text-gray-600 border-0 text-[7px] px-1 py-0">
                        Реклама
                      </Badge>
                    )}
                  </div>
                </>
              )

              const bannerStyle = { 
                width: bannerWidth > 0 ? `${bannerWidth}px` : '100%',
                aspectRatio: '21/9',
                scrollSnapAlign: 'center'
              }

              if (isExternal) {
                return (
                  <a
                    key={banner.id}
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(banner)}
                    className="relative rounded-xl overflow-hidden shrink-0"
                    style={bannerStyle}
                  >
                    {BannerContent}
                  </a>
                )
              }

              return (
                <Link 
                  key={banner.id} 
                  href={banner.link}
                  onClick={() => trackClick(banner)}
                  className="relative rounded-xl overflow-hidden shrink-0"
                  style={bannerStyle}
                >
                  {BannerContent}
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        /* Десктопная карусель — с кнопками навигации */
        <div 
          ref={containerRef}
          className="overflow-hidden"
        >
          <div 
            ref={trackRef}
            className="flex gap-4"
            style={{ 
              transform: !isAnimating ? `translateX(-${initialTranslateX}px)` : undefined,
              transition: !isAnimating ? 'none' : undefined
            }}
          >
          {banners.map((banner, idx) => {
            const isExternal = banner.isAd && !banner.link.startsWith('/')

            const BannerContent = (
              <>
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  priority={idx < 3}
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center">
                  {/* Бэдж "Реклама" для платных баннеров */}
                  {banner.isAd && (
                    <Badge className="absolute bottom-2 right-2 bg-white/95 text-gray-600 border-0 text-[7px] px-1 py-0">
                      Реклама
                    </Badge>
                  )}
                </div>
              </>
            )

            if (isExternal) {
              return (
                <a
                  key={banner.id}
                  href={banner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick(banner)}
                  className="relative rounded-[24px] overflow-hidden shadow-none md:shadow-sm hover:shadow-md transition-all flex-shrink-0 group/card"
                  style={{ 
                    width: bannerWidth > 0 ? `${bannerWidth}px` : `calc((100% - ${(cardsToShow - 1) * gap}px) / ${cardsToShow})`,
                    aspectRatio: '21/9'
                  }}
                >
                  {BannerContent}
                </a>
              )
            }

            return (
              <Link 
                key={banner.id} 
                href={banner.link}
                onClick={() => trackClick(banner)}
                className="relative rounded-[24px] overflow-hidden shadow-none md:shadow-sm hover:shadow-md transition-all flex-shrink-0 group/card"
                style={{ 
                  width: bannerWidth > 0 ? `${bannerWidth}px` : `calc((100% - ${(cardsToShow - 1) * gap}px) / ${cardsToShow})`,
                  aspectRatio: '21/9'
                }}
              >
                {BannerContent}
              </Link>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}

