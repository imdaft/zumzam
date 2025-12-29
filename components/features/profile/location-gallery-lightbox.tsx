'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import Image from 'next/image'
import { getVideoEmbedUrl } from '@/lib/utils/video-embed'

interface LocationGalleryLightboxProps {
  photos: string[]
  videoUrl?: string | null
  isOpen: boolean
  initialIndex: number
  onClose: () => void
}

export function LocationGalleryLightbox({ 
  photos, 
  videoUrl, 
  isOpen, 
  initialIndex,
  onClose 
}: LocationGalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  
  // Создаем единый массив медиа (фото + видео)
  const mediaItems = [
    ...photos.map(url => ({ type: 'photo' as const, url })),
    ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : [])
  ]
  
  const totalItems = mediaItems.length

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1))
  }

  if (!isOpen) return null

  const currentItem = mediaItems[currentIndex]

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10001] p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Счетчик */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
        {currentIndex + 1} / {totalItems}
      </div>

      {/* Кнопки навигации */}
      {totalItems > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[10001] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[10001] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Контент */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {currentItem?.type === 'photo' ? (
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={currentItem.url}
              alt={`Фото ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 1920px) 100vw"
              quality={100}
            />
          </div>
        ) : (
          <div className="relative w-full max-w-5xl aspect-video">
            <iframe
              src={getVideoEmbedUrl(currentItem.url) || currentItem.url}
              className="w-full h-full rounded-xl border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Миниатюры (thumbnails) внизу */}
      {totalItems > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10001] flex gap-2 overflow-x-auto max-w-[90vw] px-4 py-2 bg-black/50 rounded-full scrollbar-hide">
          {mediaItems.map((item, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(index) }}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                index === currentIndex 
                  ? 'ring-2 ring-white scale-110' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {item.type === 'photo' ? (
                <Image
                  src={item.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}



