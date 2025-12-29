'use client'

import { useState, useEffect } from 'react'

/**
 * Хук для отслеживания media queries
 * @param query - CSS media query строка, например '(min-width: 768px)'
 * @returns boolean - соответствует ли текущий viewport запросу
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Используем addEventListener для современных браузеров
    mediaQuery.addEventListener('change', handler)
    
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  // Возвращаем false на сервере и при первом рендере
  if (!mounted) return false
  
  return matches
}

/**
 * Проверка на мобильное устройство (ширина < 768px)
 * Стандартный breakpoint для большинства компонентов
 * Для отдельных страниц можно использовать индивидуальные breakpoints
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)')
}

/**
 * Проверка на мобильное устройство для сообщений (ширина < 1024px)
 * На планшетах сообщения показываются как на мобильных (без двух панелей)
 */
export function useIsMobileOrTablet(): boolean {
  return !useMediaQuery('(min-width: 1024px)')
}

/**
 * Проверка на планшет (768px - 1024px)
 */
export function useIsTablet(): boolean {
  const isMinTablet = useMediaQuery('(min-width: 768px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isMinTablet && !isDesktop
}

/**
 * Проверка на десктоп (ширина >= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Проверка на touch-устройство
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)')
}






