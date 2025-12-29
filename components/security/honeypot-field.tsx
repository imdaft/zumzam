/**
 * Honeypot field для защиты форм от ботов
 * Невидимое поле, которое боты заполняют, а люди - нет
 */

'use client'

import { useEffect, useRef } from 'react'

interface HoneypotFieldProps {
  onBotDetected?: () => void
}

export function HoneypotField({ onBotDetected }: HoneypotFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Проверяем, не заполнено ли поле (признак бота)
    const checkHoneypot = () => {
      if (inputRef.current && inputRef.current.value) {
        console.warn('[Security] Bot detected via honeypot')
        onBotDetected?.()
      }
    }

    // Проверяем периодически
    const interval = setInterval(checkHoneypot, 1000)
    return () => clearInterval(interval)
  }, [onBotDetected])

  return (
    <>
      {/* Honeypot field - невидимый для людей, но видимый для ботов */}
      <input
        ref={inputRef}
        type="text"
        name="website" // Типичное название, которое боты заполняют
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      
      {/* Второй honeypot (для продвинутых ботов) */}
      <div style={{ display: 'none' }}>
        <label htmlFor="confirm_email">Email Confirmation</label>
        <input
          type="email"
          name="confirm_email"
          id="confirm_email"
          autoComplete="off"
          tabIndex={-1}
        />
      </div>
    </>
  )
}

/**
 * Hook для валидации honeypot в formData
 */
export function validateHoneypot(formData: FormData): boolean {
  const website = formData.get('website')
  const confirmEmail = formData.get('confirm_email')

  // Если любое из полей заполнено - это бот
  if (website || confirmEmail) {
    console.warn('[Security] Bot detected via form honeypot', { website, confirmEmail })
    return false
  }

  return true
}

