'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

interface ErrorReport {
  message: string
  stack?: string
  source?: string
  lineno?: number
  colno?: number
  filename?: string
  url: string
  userAgent: string
  userId?: string
  userEmail?: string
  timestamp: string
  errorType: 'javascript' | 'unhandledrejection' | 'react' | 'other'
  componentStack?: string
  additionalData?: Record<string, any>
}

/**
 * Компонент для автоматического перехвата и отправки ошибок на сервер
 * 
 * Перехватывает:
 * - window.onerror (JavaScript ошибки)
 * - unhandledrejection (необработанные Promise rejections)
 * - console.error (опционально)
 */
export function ErrorReporter() {
  const { user, profile } = useAuth()

  useEffect(() => {
    // Функция для отправки ошибки на сервер
    const reportError = async (errorData: Omit<ErrorReport, 'timestamp'>) => {
      try {
        const report: ErrorReport = {
          ...errorData,
          timestamp: new Date().toISOString(),
          userId: user?.id,
          userEmail: user?.email || profile?.email,
        }

        // Отправляем на сервер (не ждем ответа, чтобы не блокировать)
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        }).catch((err) => {
          // Игнорируем ошибки при отправке ошибок (чтобы не было бесконечного цикла)
          console.warn('[ErrorReporter] Failed to send error report:', err)
        })
      } catch (err) {
        // Игнорируем ошибки при создании отчета
        console.warn('[ErrorReporter] Failed to create error report:', err)
      }
    }

    // Обработчик для window.onerror (JavaScript ошибки)
    const handleError = (
      event: ErrorEvent | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      const errorEvent = event as ErrorEvent
      const message = errorEvent.message || 'Unknown error'
      const filename = errorEvent.filename || source || 'unknown'
      const stack = error?.stack || errorEvent.error?.stack

      reportError({
        message,
        stack,
        source: filename,
        lineno: errorEvent.lineno || lineno,
        colno: errorEvent.colno || colno,
        filename,
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorType: 'javascript',
      })
    }

    // Обработчик для unhandledrejection (необработанные Promise rejections)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      let message = 'Unhandled Promise Rejection'
      let stack: string | undefined

      if (reason instanceof Error) {
        message = reason.message
        stack = reason.stack
      } else if (typeof reason === 'string') {
        message = reason
      } else if (reason && typeof reason === 'object') {
        message = JSON.stringify(reason)
      }

      reportError({
        message,
        stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorType: 'unhandledrejection',
        additionalData: {
          reason: reason instanceof Error ? {
            name: reason.name,
            message: reason.message,
          } : reason,
        },
      })
    }

    // Перехватываем window.onerror
    window.addEventListener('error', handleError, true)

    // Перехватываем unhandledrejection
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [user, profile])

  // Этот компонент не рендерит ничего
  return null
}
















