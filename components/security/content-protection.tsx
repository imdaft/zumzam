/**
 * Защита контента от копирования
 * Затрудняет скрейпинг данных конкурентами
 */

'use client'

import { useEffect } from 'react'

/**
 * Компонент для защиты контента от копирования
 */
export function ContentProtection({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Отключаем контекстное меню (правый клик)
    const handleContextMenu = (e: MouseEvent) => {
      // Разрешаем в dev mode
      if (process.env.NODE_ENV === 'development') return
      
      e.preventDefault()
      return false
    }

    // Отключаем выделение через Ctrl+A
    const handleSelectAll = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'development') return
      
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        return false
      }
    }

    // Отключаем DevTools (F12, Ctrl+Shift+I)
    const handleDevTools = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'development') return
      
      // F12
      if (e.keyCode === 123) {
        e.preventDefault()
        return false
      }
      
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) {
        e.preventDefault()
        return false
      }
      
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleSelectAll)
    document.addEventListener('keydown', handleDevTools)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleSelectAll)
      document.removeEventListener('keydown', handleDevTools)
    }
  }, [])

  return <>{children}</>
}

/**
 * Обфускация email (защита от спам-ботов)
 */
export function ObfuscatedEmail({ email }: { email: string }) {
  const [user, domain] = email.split('@')
  
  return (
    <a
      href={`mailto:${email}`}
      onClick={(e) => {
        e.preventDefault()
        window.location.href = `mailto:${email}`
      }}
      className="hover:underline"
    >
      {user}
      <span style={{ display: 'none' }}>REMOVE</span>
      @
      <span style={{ display: 'none' }}>THIS</span>
      {domain}
    </a>
  )
}

/**
 * Обфускация телефона
 */
export function ObfuscatedPhone({ phone }: { phone: string }) {
  // Удаляем все кроме цифр
  const cleanPhone = phone.replace(/\D/g, '')
  
  return (
    <a
      href={`tel:+${cleanPhone}`}
      onClick={(e) => {
        e.preventDefault()
        window.location.href = `tel:+${cleanPhone}`
      }}
      className="hover:underline"
    >
      {phone}
    </a>
  )
}

/**
 * Водяной знак на изображениях (CSS-based)
 */
export function WatermarkedImage({
  src,
  alt,
  watermarkText = 'ZumZam',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { watermarkText?: string }) {
  return (
    <div className="relative inline-block">
      <img src={src} alt={alt} {...props} />
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{
          background: 'transparent',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.2)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          transform: 'rotate(-45deg)',
        }}
      >
        {watermarkText}
      </div>
    </div>
  )
}

