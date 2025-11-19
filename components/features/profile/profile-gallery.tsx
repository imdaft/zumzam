'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types'

interface ProfileGalleryProps {
  profile: Profile
}

/**
 * Галерея фото и видео профиля
 */
export function ProfileGallery({ profile }: ProfileGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)

  const photos = profile.photos || []
  const videos = profile.videos || []

  if (photos.length === 0 && videos.length === 0) {
    return null
  }

  const openLightbox = (url: string, index: number) => {
    setSelectedImage(url)
    setSelectedImageIndex(index)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    const nextIndex = (selectedImageIndex + 1) % photos.length
    setSelectedImageIndex(nextIndex)
    setSelectedImage(photos[nextIndex])
  }

  const prevImage = () => {
    const prevIndex = (selectedImageIndex - 1 + photos.length) % photos.length
    setSelectedImageIndex(prevIndex)
    setSelectedImage(photos[prevIndex])
  }

  return (
    <div className="space-y-6">
      {/* Фото */}
      {photos.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Фотографии</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
              <button
                key={photo}
                onClick={() => openLightbox(photo, index)}
                className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                <img
                  src={photo}
                  alt={`Фото ${index + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Видео */}
      {videos.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Видео</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {videos.map((video, index) => (
              <div
                key={video}
                className="relative aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                <video
                  src={video}
                  controls
                  className="h-full w-full object-cover"
                  preload="metadata"
                >
                  Ваш браузер не поддерживает воспроизведение видео.
                </video>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox для просмотра фото */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Навигация */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Изображение */}
          <img
            src={selectedImage}
            alt="Просмотр"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Счётчик */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
            {selectedImageIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  )
}

