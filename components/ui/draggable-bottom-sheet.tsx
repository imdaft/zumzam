'use client'

import { useRef, useState, useCallback, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SnapPoint {
  height: number
  name: string
}

interface DraggableBottomSheetProps {
  children: ReactNode
  snapPoints?: SnapPoint[]
  defaultSnapPoint?: number
  onSnapChange?: (snapIndex: number, snapName: string) => void
  showHandle?: boolean
  className?: string
  contentClassName?: string
  topOffset?: number
  bottomOffset?: number
  currentSnap?: number
  locked?: boolean
}

const DEFAULT_SNAP_POINTS: SnapPoint[] = [
  { height: 12, name: 'collapsed' },
  { height: 95, name: 'expanded' },
]

export function DraggableBottomSheet({
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  defaultSnapPoint = 0,
  onSnapChange,
  showHandle = true,
  className,
  contentClassName,
  topOffset = 0,
  bottomOffset = 0,
  currentSnap: controlledSnap,
  locked = false,
}: DraggableBottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [snapIndex, setSnapIndex] = useState(defaultSnapPoint)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Refs для handle
  const touchStartY = useRef(0)
  const touchStartTranslateY = useRef(0)
  const isDraggingRef = useRef(false)
  
  const currentSnapIndex = controlledSnap ?? snapIndex

  // Максимальная высота sheet (95% viewport)
  const maxSheetHeight = viewportHeight * 0.95

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight
      setViewportHeight(vh)
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('resize', updateHeight)
    
    return () => {
      window.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('resize', updateHeight)
    }
  }, [])

  // Вычисляем translateY для каждого snap point
  const getTranslateY = useCallback((snapPoint: SnapPoint): number => {
    const targetHeight = (snapPoint.height / 100) * viewportHeight
    return maxSheetHeight - targetHeight
  }, [viewportHeight, maxSheetHeight])

  const animateToSnap = useCallback((index: number) => {
    const targetTranslateY = getTranslateY(snapPoints[index])
    console.log('[BottomSheet] animateToSnap:', {
      index,
      snapPoint: snapPoints[index],
      targetTranslateY,
      currentTranslateY: translateY
    })
    setTranslateY(targetTranslateY)
    setSnapIndex(index)
    setIsDragging(false)
    isDraggingRef.current = false
    onSnapChange?.(index, snapPoints[index].name)
  }, [getTranslateY, snapPoints, onSnapChange, translateY])

  // Флаг инициализации — чтобы инициализация не перезаписывала контролируемое значение
  const isInitializedRef = useRef(false)

  // Инициализация — только один раз при первом рендере
  useEffect(() => {
    if (viewportHeight > 0 && !isInitializedRef.current) {
      isInitializedRef.current = true
      // Если есть controlledSnap, используем его, иначе defaultSnapPoint
      const initialSnap = controlledSnap !== undefined ? controlledSnap : defaultSnapPoint
      const initialTranslateY = getTranslateY(snapPoints[initialSnap])
      setTranslateY(initialTranslateY)
      setSnapIndex(initialSnap)
    }
  }, [viewportHeight, defaultSnapPoint, controlledSnap, snapPoints, getTranslateY])

  // Контролируемый snap — реагируем на изменение controlledSnap
  const lastProcessedSnapRef = useRef<{ snap: number; timestamp: number } | null>(null)

  useEffect(() => {
    if (controlledSnap === undefined || viewportHeight <= 0 || !snapPoints[controlledSnap]) {
      return
    }
    
    const targetTranslateY = getTranslateY(snapPoints[controlledSnap])
    const now = Date.now()
    
    // Анимируем если snap изменился или прошло больше 50ms
    const lastProcessed = lastProcessedSnapRef.current
    const shouldAnimate = !lastProcessed || 
      lastProcessed.snap !== controlledSnap ||
      (now - lastProcessed.timestamp) > 50
    
    if (shouldAnimate) {
      lastProcessedSnapRef.current = { snap: controlledSnap, timestamp: now }
      setTranslateY(targetTranslateY)
      setSnapIndex(controlledSnap)
      setIsDragging(false)
      isDraggingRef.current = false
    }
  }, [controlledSnap, viewportHeight, snapPoints, getTranslateY])

  const isExpanded = currentSnapIndex === snapPoints.length - 1
  const isCollapsed = currentSnapIndex === 0

  // ===============================
  // HANDLE TOUCH — только на ручке
  // ===============================
  
  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    const handleTouchStart = (e: TouchEvent) => {
      if (locked) return
      e.preventDefault()
      
      touchStartY.current = e.touches[0].clientY
      touchStartTranslateY.current = translateY
      isDraggingRef.current = true
      setIsDragging(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (locked || !isDraggingRef.current) return
      e.preventDefault()
      
      const touchY = e.touches[0].clientY
      const deltaY = touchY - touchStartY.current
      
      const minTranslateY = 0
      const maxTranslateYValue = getTranslateY(snapPoints[0])
      const newTranslateY = Math.max(minTranslateY, Math.min(maxTranslateYValue, touchStartTranslateY.current + deltaY))
      
      setTranslateY(newTranslateY)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchEndY - touchStartY.current
      
      isDraggingRef.current = false
      setIsDragging(false)
      
      const threshold = 30
      
      if (deltaY > threshold) {
        animateToSnap(0)
      } else if (deltaY < -threshold) {
        animateToSnap(snapPoints.length - 1)
      } else {
        animateToSnap(currentSnapIndex)
      }
    }

    handle.addEventListener('touchstart', handleTouchStart, { passive: false })
    handle.addEventListener('touchmove', handleTouchMove, { passive: false })
    handle.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      handle.removeEventListener('touchstart', handleTouchStart)
      handle.removeEventListener('touchmove', handleTouchMove)
      handle.removeEventListener('touchend', handleTouchEnd)
    }
  }, [locked, translateY, animateToSnap, snapPoints, getTranslateY, currentSnapIndex])

  // Клик по handle
  const handleHandleClick = useCallback(() => {
    if (locked) return
    
    if (isCollapsed) {
      animateToSnap(snapPoints.length - 1)
    } else {
      animateToSnap(0)
    }
  }, [locked, isCollapsed, animateToSnap, snapPoints.length])

  if (viewportHeight === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[100] flex flex-col',
        'bg-white dark:bg-slate-900',
        'rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)]',
        className
      )}
      style={{
        height: maxSheetHeight,
        maxHeight: `calc(100vh - ${topOffset}px)`,
        paddingBottom: bottomOffset,
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'transform',
      }}
    >
      {/* Handle — свайп работает только здесь */}
      {showHandle && (
        <div
          ref={handleRef}
          className={cn(
            'flex-shrink-0 flex items-center justify-center py-4 cursor-grab active:cursor-grabbing',
            'safe-area-inset-top select-none'
          )}
          style={{ touchAction: 'none' }}
          onClick={handleHandleClick}
        >
          <div className={cn(
            'w-12 h-1.5 rounded-full transition-colors',
            isDragging ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
          )} />
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          'flex-1 flex flex-col min-h-0',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function useBottomSheetSnap(initialSnap = 0) {
  const [snap, setSnap] = useState(initialSnap)
  
  const collapse = useCallback(() => setSnap(0), [])
  const expand = useCallback(() => setSnap(1), [])
  
  return {
    snap,
    setSnap,
    collapse,
    expand,
  }
}
