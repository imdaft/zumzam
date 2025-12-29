/**
 * Централизованная система логирования
 * 
 * Использование:
 *   import { logger } from '@/lib/logger'
 *   logger.debug('[Component] message', { data })
 *   logger.info('[API] request received')
 *   logger.warn('[Auth] session expiring')
 *   logger.error('[DB] query failed', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  // Показывать debug логи в продакшене
  showDebugInProd: boolean
  // Отправлять ошибки в внешний сервис (Sentry, LogRocket)
  sendToExternal: boolean
}

const config: LogConfig = {
  showDebugInProd: false,
  sendToExternal: false, // TODO: включить после интеграции Sentry
}

const isDev = process.env.NODE_ENV === 'development'
const isServer = typeof window === 'undefined'

// Цвета для консоли (только в браузере)
const styles = {
  debug: 'color: #6B7280; font-weight: normal;', // gray
  info: 'color: #3B82F6; font-weight: normal;',  // blue
  warn: 'color: #F59E0B; font-weight: bold;',    // amber
  error: 'color: #EF4444; font-weight: bold;',   // red
}

// Эмодзи для серверных логов
const emojis = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0] // HH:MM:SS
  return `[${timestamp}] ${message}`
}

function shouldLog(level: LogLevel): boolean {
  // В продакшене показываем только info, warn, error
  if (!isDev && level === 'debug' && !config.showDebugInProd) {
    return false
  }
  return true
}

function logToConsole(level: LogLevel, message: string, data?: any) {
  if (!shouldLog(level)) return

  const formattedMessage = formatMessage(level, message)
  // В dev Next.js показывает React Dev Overlay на console.error.
  // Для "ожидаемых" ошибок (таймауты/сеть) это слишком шумно — поэтому в браузере
  // логируем ошибки через console.log, но уровень "error" сохраняем в тексте/репортах.
  const browserMethod =
    !isServer && isDev && level === 'error' ? 'log' : (level === 'debug' ? 'log' : level)

  if (isServer) {
    // Серверные логи с эмодзи
    const prefix = emojis[level]
    if (data !== undefined) {
      console[level === 'debug' ? 'log' : level](`${prefix} ${formattedMessage}`, data)
    } else {
      console[level === 'debug' ? 'log' : level](`${prefix} ${formattedMessage}`)
    }
  } else {
    // Браузерные логи с цветами
    if (data !== undefined) {
      console[browserMethod](`%c${formattedMessage}`, styles[level], data)
    } else {
      console[browserMethod](`%c${formattedMessage}`, styles[level])
    }
  }
}

async function sendToExternalService(level: LogLevel, message: string, error?: Error | any) {
  // Отправляем ошибки на наш сервер (всегда, не только если включен внешний сервис)
  if (level === 'error' && !isServer) {
    try {
      const errorData: any = {
        message: error instanceof Error ? error.message : String(error || message),
        stack: error instanceof Error ? error.stack : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        errorType: 'other',
        additionalData: {
          loggerMessage: message,
          errorObject: error && typeof error === 'object' ? error : undefined,
        },
      }

      // Отправляем асинхронно, не ждем ответа
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch((err) => {
        // Игнорируем ошибки при отправке ошибок
        console.warn('[Logger] Failed to send error to server:', err)
      })
    } catch (err) {
      // Игнорируем ошибки при создании отчета
      console.warn('[Logger] Failed to create error report:', err)
    }
  }

  // Внешние сервисы (Sentry/LogRocket) - если включены
  if (!config.sendToExternal) return
  
  // TODO: Интеграция с Sentry/LogRocket
  // if (level === 'error' && error) {
  //   Sentry.captureException(error, { extra: { message } })
  // }
}

export const logger = {
  /**
   * Debug-сообщения (не показываются в продакшене)
   * Используйте для отладки, данных запросов, состояния
   */
  debug: (message: string, data?: any) => {
    logToConsole('debug', message, data)
  },

  /**
   * Информационные сообщения
   * Используйте для важных событий: запуск, инициализация, успешные операции
   */
  info: (message: string, data?: any) => {
    logToConsole('info', message, data)
  },

  /**
   * Предупреждения
   * Используйте для потенциальных проблем: deprecated, fallback, retry
   */
  warn: (message: string, data?: any) => {
    logToConsole('warn', message, data)
  },

  /**
   * Ошибки
   * Используйте для исключений, failed операций, критических проблем
   */
  error: (message: string, error?: Error | any) => {
    logToConsole('error', message, error)
    sendToExternalService('error', message, error)
  },

  /**
   * Группировка логов (только для браузера)
   */
  group: (label: string) => {
    if (!isServer && isDev) {
      console.group(label)
    }
  },

  groupEnd: () => {
    if (!isServer && isDev) {
      console.groupEnd()
    }
  },

  /**
   * Таблица данных (для отладки массивов/объектов)
   */
  table: (data: any) => {
    if (isDev) {
      console.table(data)
    }
  },

  /**
   * Замер времени выполнения
   */
  time: (label: string) => {
    if (isDev) {
      console.time(label)
    }
  },

  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(label)
    }
  },
}

export default logger

