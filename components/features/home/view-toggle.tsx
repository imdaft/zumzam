'use client'

import { motion } from 'framer-motion'
import { Map as MapIcon, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  viewMode: 'grid' | 'map'
  onChange: (mode: 'grid' | 'map') => void
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="relative inline-flex items-center bg-gray-100 p-1.5 rounded-full isolate">
      {/* 
        Фоновая плашка. 
        Она позиционирована абсолютно внутри relative контейнера.
        Анимация x координаты происходит в локальной системе координат контейнера,
        поэтому скролл страницы на неё не влияет.
      */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-orange-500 shadow-sm -z-10"
        // Ширина плашки равна ширине кнопки (w-28 = 112px)
        style={{ width: '7rem' }} 
        animate={{
          // Если grid, смещение 0.
          // Если map, смещение равно ширине первой кнопки (w-28 = 7rem = 112px).
          x: viewMode === 'grid' ? 0 : '100%'
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      <button
        onClick={() => onChange('grid')}
        className={cn(
          "relative flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 w-28",
          viewMode === 'grid' ? "text-white" : "text-gray-500 hover:text-gray-700"
        )}
      >
        <List className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Список</span>
      </button>

      <button
        onClick={() => onChange('map')}
        className={cn(
          "relative flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 w-28",
          viewMode === 'map' ? "text-white" : "text-gray-500 hover:text-gray-700"
        )}
      >
        <MapIcon className="w-4 h-4 relative z-10" />
        <span className="relative z-10">На карте</span>
      </button>
    </div>
  )
}

















