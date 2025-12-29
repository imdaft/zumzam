'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

/**
 * Галерея фото/видео
 */
export function ProfileGallery({
  photos,
  videos,
}: {
  photos: string[]
  videos?: string[]
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  if ((!photos || photos.length === 0) && (!videos || videos.length === 0)) {
    return null
  }
  
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Фотогалерея</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedIndex(idx)}
            className="relative aspect-square rounded-xl overflow-hidden hover:opacity-90 transition"
          >
            <Image
              src={photo}
              alt={`Фото ${idx + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
        
        {videos?.map((video, idx) => (
          <button
            key={`video-${idx}`}
            type="button"
            className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 hover:opacity-90 transition"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-12 h-12 text-white" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
