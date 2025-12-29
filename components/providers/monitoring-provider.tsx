/**
 * Monitoring Provider
 * 
 * Инициализирует систему мониторинга на клиенте:
 * - Глобальные обработчики ошибок
 * - Error tracking
 */

'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandlers } from '@/lib/monitoring/error-tracker'
import { logger } from '@/lib/logger'

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Инициализируем глобальные обработчики ошибок
    setupGlobalErrorHandlers()
    
    logger.info('[MonitoringProvider] ✅ Система мониторинга инициализирована')
  }, [])

  return <>{children}</>
}

