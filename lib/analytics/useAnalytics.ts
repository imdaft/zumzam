import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import tracker from './tracker'

/**
 * React Hook для автоматического отслеживания навигации
 */
export function useAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Отслеживаем просмотр страницы при изменении URL
    tracker.trackPageView()
  }, [pathname, searchParams])

  return {
    trackSearch: tracker.trackSearch.bind(tracker),
    trackProfileView: tracker.trackProfileView.bind(tracker),
    trackServiceClick: tracker.trackServiceClick.bind(tracker),
    trackCartAdd: tracker.trackCartAdd.bind(tracker),
    trackCartRemove: tracker.trackCartRemove.bind(tracker),
    trackCheckoutStart: tracker.trackCheckoutStart.bind(tracker),
    trackOrderCreate: tracker.trackOrderCreate.bind(tracker),
    track: tracker.track.bind(tracker),
  }
}

export default useAnalytics


