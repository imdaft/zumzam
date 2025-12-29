'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotoGalleryProps {
  photos: string[]
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openGallery = (index: number) => {
    setSelectedIndex(index)
  }

  const closeGallery = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeGallery()
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {photos.map((url: string, i: number) => (
          <div
            key={i}
            onClick={() => openGallery(i)}
            className="relative aspect-square rounded-[24px] overflow-hidden group cursor-pointer bg-slate-100 hover:opacity-90 transition-opacity"
          >
            <Image
              src={url}
              alt={`Фото ${i + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={closeGallery}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Previous Button */}
          {selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next Button */}
          {selectedIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[selectedIndex]}
              alt={`Фото ${selectedIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}


