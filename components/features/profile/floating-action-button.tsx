'use client'

import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  progress: number
  onClick: () => void
}

export function FloatingActionButton({ progress, onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 lg:hidden',
        'w-16 h-16 rounded-full shadow-2xl',
        'flex flex-col items-center justify-center',
        'transition-all duration-300 active:scale-95',
        progress === 100 ? 'bg-green-500 hover:bg-green-600' : 
        progress >= 50 ? 'bg-orange-500 hover:bg-orange-600' : 
        'bg-red-500 hover:bg-red-600'
      )}
    >
      <Save className="w-5 h-5 text-white mb-0.5" />
      <span className="text-[10px] font-bold text-white">{progress}%</span>
    </button>
  )
}















