'use client'

import { useRef, useState, MouseEvent } from 'react'
import Link from 'next/link'

interface GalleryItem {
  id: string
  profileId: string
  profileName: string
  profileSlug: string
  serviceTitle?: string
  image?: string
  price?: number
  rating?: number
}

interface DraggableGalleryProps {
  items: GalleryItem[]
  onItemClick: () => void
}

/**
 * Галерея с drag-to-scroll для десктопа
 * Зажми мышку и перетаскивай влево-вправо
 */
export function DraggableGallery({ items, onItemClick }: DraggableGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [hasMoved, setHasMoved] = useState(false) // Флаг реального движения

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return
    
    setIsDragging(true)
    setHasMoved(false) // Сбрасываем флаг движения
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
    
    // Меняем курсор
    scrollRef.current.style.cursor = 'grabbing'
    scrollRef.current.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return
    
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 2 // Множитель для скорости прокрутки
    
    // Если сдвинули больше 5px, считаем что был реальный drag
    if (Math.abs(walk) > 5) {
      setHasMoved(true)
    }
    
    scrollRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab'
      scrollRef.current.style.userSelect = 'auto'
    }
    
    // Сбрасываем hasMoved через небольшую задержку
    // чтобы onClick успел проверить его
    setTimeout(() => {
      setHasMoved(false)
    }, 100)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      if (scrollRef.current) {
        scrollRef.current.style.cursor = 'grab'
        scrollRef.current.style.userSelect = 'auto'
      }
      
      setTimeout(() => {
        setHasMoved(false)
      }, 100)
    }
  }

  return (
    <div 
      ref={scrollRef}
      className="overflow-x-auto cursor-grab select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div className="flex gap-3 pb-2">
        {items.map((item, gIndex) => (
          <Link
            key={gIndex}
            href={`/profiles/${item.profileSlug}`}
            onClick={(e) => {
              // Если был реальный drag (движение > 5px), не открываем ссылку
              if (hasMoved) {
                e.preventDefault()
                return
              }
              // Иначе это просто клик - открываем профиль
              onItemClick()
            }}
            onDragStart={(e) => e.preventDefault()} // Отключаем стандартный drag
            className="flex-shrink-0 w-48 bg-white rounded-[16px] shadow-md overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="relative aspect-square bg-gray-100">
              {item.image && (
                <img 
                  src={item.image}
                  alt={item.profileName}
                  className="w-full h-full object-cover pointer-events-none" // pointer-events-none важно!
                  loading="lazy"
                  draggable={false}
                />
              )}
              {item.rating && (
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <span>⭐</span>
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-sm text-slate-900 mb-1 line-clamp-1">{item.profileName}</h4>
              {item.serviceTitle && (
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">{item.serviceTitle}</p>
              )}
              {item.price && (
                <p className="text-sm font-bold text-orange-600">
                  {item.price.toLocaleString()} ₽
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

