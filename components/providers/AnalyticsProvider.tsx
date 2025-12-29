'use client'

import { useEffect } from 'react'
import { useAnalytics } from '@/lib/analytics/useAnalytics'

/**
 * Провайдер аналитики
 * Инициализирует трекер при загрузке приложения
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Важно: хук подписывает нас на изменения маршрута и отправляет page_view
  useAnalytics()

  useEffect(() => {
    // Здесь оставляем место под будущие настройки аналитики (opt-out/sampling)
  }, [])

  return <>{children}</>
}

export default AnalyticsProvider


