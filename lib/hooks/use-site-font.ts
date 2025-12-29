'use client'

import { useEffect } from 'react'

export function useSiteFont() {
  useEffect(() => {
    // Загружаем сохранённый шрифт из localStorage
    const savedFont = localStorage.getItem('site-font') || 'Onest'
    
    // Применяем шрифт глобально
    document.documentElement.style.setProperty('--font-family', savedFont)
    document.body.style.fontFamily = `'${savedFont}', system-ui, sans-serif`
    
    // Слушаем изменения в localStorage (если админ меняет шрифт в другой вкладке)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'site-font' && e.newValue) {
        document.documentElement.style.setProperty('--font-family', e.newValue)
        document.body.style.fontFamily = `'${e.newValue}', system-ui, sans-serif`
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
}

