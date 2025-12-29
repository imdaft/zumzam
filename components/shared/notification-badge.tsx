/**
 * Badge для уведомлений в стиле Авито
 * Красный кружок с цифрой
 */

'use client'

import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  max?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function NotificationBadge({ 
  count, 
  max = 99, 
  className,
  size = 'md'
}: NotificationBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count

  const sizeClasses = {
    sm: 'min-w-4 h-4 text-[10px]',
    md: 'min-w-5 h-5 text-xs',
    lg: 'min-w-6 h-6 text-sm'
  }

  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-bold px-1',
        sizeClasses[size],
        className
      )}
    >
      {displayCount}
    </div>
  )
}


