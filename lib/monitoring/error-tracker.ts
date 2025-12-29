/**
 * Error Tracking для клиента
 * 
 * Перехватывает и отслеживает ошибки на клиентской стороне
 */

import { logger } from '@/lib/logger'

interface ErrorInfo {
  message: string
  stack?: string
  url: string
  userAgent: string
  timestamp: string
  componentStack?: string
}

// Хранилище ошибок в памяти (для отладки)
const errorHistory: ErrorInfo[] = []
const MAX_ERRORS = 50

export function getErrorHistory() {
  return errorHistory.slice()
}

export function clearErrorHistory() {
  errorHistory.length = 0
}

/**
 * Отслеживание необработанной ошибки
 */
export function trackError(error: Error | any, componentStack?: string) {
  const errorInfo: ErrorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString(),
    componentStack,
  }

  // Сохраняем в историю
  errorHistory.push(errorInfo)
  if (errorHistory.length > MAX_ERRORS) {
    errorHistory.shift()
  }

  // Логируем
  logger.error('[ErrorTracker] Ошибка перехвачена', {
    ...errorInfo,
    stack: errorInfo.stack?.split('\n').slice(0, 5).join('\n'), // Первые 5 строк стека
  })

  // Отправляем на сервер
  if (typeof window !== 'undefined') {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: errorInfo.message,
        stack: errorInfo.stack,
        url: errorInfo.url,
        userAgent: errorInfo.userAgent,
        errorType: 'client',
        additionalData: {
          componentStack,
        },
      }),
    }).catch(err => {
      console.warn('[ErrorTracker] Failed to send error to server:', err)
    })
  }
}

/**
 * Установка глобальных обработчиков ошибок
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  // Необработанные promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason)
    event.preventDefault()
  })

  // Глобальные ошибки
  window.addEventListener('error', (event) => {
    trackError(event.error || event.message)
  })

  logger.info('[ErrorTracker] ✅ Глобальные обработчики ошибок установлены')
}

