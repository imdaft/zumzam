'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { ProfileCard } from '@/components/features/profile/profile-card'

interface HorizontalSectionProps {
  title: string
  items: any[]
  categorySlug: string
  onShowAll: () => void
  showAllButton?: boolean
  /** Переопределение скругления карточек внутри секции */
  cardRoundedClassName?: string
}

export function HorizontalSection({ title, items, onShowAll, showAllButton = true, cardRoundedClassName }: HorizontalSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardWidth, setCardWidth] = useState(0)
  const [visibleCards, setVisibleCards] = useState(4)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [animatingCards, setAnimatingCards] = useState<'leaving' | 'entering' | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [gap, setGap] = useState(16) // 8px на мобиле, 16px на десктопе

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const mobile = window.innerWidth < 640
        setIsMobile(mobile)
        
        // Gap зависит от breakpoint: 8px (gap-2) для мобиле, 16px (gap-4) для десктопа
        const currentGap = mobile ? 8 : 16
        setGap(currentGap)

        // Для мобильных берём ширину viewport напрямую (без -mx-4)
        const containerWidth = mobile
          ? window.innerWidth
          : containerRef.current.clientWidth

        // Мобильные: 1 карточка + 1/4 следующей
        // Планшет: 2 карточки
        // Десктоп: 4 карточки
        let cards: number
        if (mobile) {
          cards = 1.25 // Показываем 1 карточку + 25% следующей (1/4)
        } else if (window.innerWidth < 1024) {
          cards = 2
        } else {
          cards = 4
        }

        setVisibleCards(Math.floor(cards))
        const totalGaps = currentGap * (Math.ceil(cards) - 1)

        // На мобильных: только левый padding влияет на видимую область
        // (правый padding виден только при скролле до конца)
        const padding = mobile ? 16 : 0
        const availableWidth = containerWidth - padding
        const width = (availableWidth - totalGaps) / cards
        setCardWidth(width)
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const maxIndex = Math.max(0, items.length - visibleCards)
  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < maxIndex

  const animateScroll = useCallback((
    direction: 'left' | 'right',
    fromIndex: number,
    toIndex: number
  ) => {
    if (!trackRef.current || cardWidth === 0) return

    setIsAnimating(true)
    setAnimatingCards(direction === 'right' ? 'leaving' : 'entering')
    
    const startTranslate = fromIndex * (cardWidth + gap)
    const endTranslate = toIndex * (cardWidth + gap)
    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentTranslate = startTranslate + (endTranslate - startTranslate) * easeOut
      
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${currentTranslate}px)`
      }
      
      setAnimationProgress(easeOut)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setAnimatingCards(null)
        setAnimationProgress(0)
        setCurrentIndex(toIndex)
      }
    }
    
    requestAnimationFrame(animate)
  }, [cardWidth, gap])

  const scroll = (direction: 'left' | 'right') => {
    if (isAnimating) return
    
    if (direction === 'left' && canScrollLeft) {
      const newIndex = Math.max(0, currentIndex - visibleCards)
      animateScroll('left', currentIndex, newIndex)
    } else if (direction === 'right' && canScrollRight) {
      const newIndex = Math.min(maxIndex, currentIndex + visibleCards)
      animateScroll('right', currentIndex, newIndex)
    }
  }

  const getCardOpacity = (index: number) => {
    if (!isAnimating || animatingCards === null) return 1
    
    const visibleStart = currentIndex
    const visibleEnd = currentIndex + visibleCards - 1
    
    if (animatingCards === 'leaving') {
      if (index >= visibleStart && index <= visibleEnd) {
        return Math.max(0, 1 - animationProgress)
      }
      return animationProgress
    }
    
    if (animatingCards === 'entering') {
      if (index >= visibleStart && index <= visibleEnd) {
        return Math.max(0, 1 - animationProgress)
      }
      return animationProgress
    }
    
    return 1
  }

  const initialTranslateX = currentIndex * (cardWidth + gap)

  if (items.length === 0) return null

  return (
    <section className="pb-3 mb-0">
      {/* Header — компактнее */}
      {title && showAllButton && (
        <div className="flex items-center justify-between mb-2 pt-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onShowAll}
            className="flex items-center gap-0.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Все
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="relative group lg:-mx-8">
        {/* Стрелки только на десктопе */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft || isAnimating}
          className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full shadow-md items-center justify-center transition-opacity duration-200 border border-gray-100 ${canScrollLeft ? 'bg-white hover:bg-gray-50 cursor-pointer opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Prev"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
        </button>

        {/* Контейнер карточек */}
        <div 
          ref={containerRef} 
          className={`lg:mx-8 ${isMobile ? 'overflow-x-auto scrollbar-hide scroll-snap-x' : 'overflow-hidden'}`}
        >
          <div
            ref={trackRef}
            className={`flex ${isMobile ? 'gap-2 px-4' : 'gap-4'}`}
            style={{
              transform: !isMobile && !isAnimating ? `translateX(-${initialTranslateX}px)` : undefined,
              // На мобильных — нативный скролл
            }}
          >
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className={`shrink-0 ${isMobile ? 'snap-start' : ''}`}
                style={{ 
                  width: cardWidth > 0 ? `${cardWidth}px` : `calc((100% - ${gap * (visibleCards - 1)}px) / ${visibleCards})`,
                  opacity: isMobile ? 1 : getCardOpacity(index),
                  transition: isAnimating ? 'none' : 'opacity 0.2s'
                }}
              >
                <ProfileCard {...item} roundedClassName={cardRoundedClassName} />
              </div>
            ))}
            {/* Отступ справа для последней карточки */}
            {isMobile && <div className="shrink-0 w-1" />}
          </div>
        </div>

        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight || isAnimating}
          className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full shadow-md items-center justify-center transition-opacity duration-200 border border-gray-100 ${canScrollRight ? 'bg-white hover:bg-gray-50 cursor-pointer opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </section>
  )
}
