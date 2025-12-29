/**
 * Система отслеживания аналитики
 * Отправляет события на бэкенд для анализа поведения пользователей
 */

import Cookies from 'js-cookie'
import { v4 as uuidv4 } from 'uuid'

// Типы событий
export type EventType =
  | 'page_view'
  | 'search'
  | 'profile_view'
  | 'service_click'
  | 'cart_add'
  | 'cart_remove'
  | 'checkout_start'
  | 'order_create'
  | 'profile_create'
  | 'review_submit'
  | 'button_click'
  | 'form_submit'
  | 'video_play'
  | 'image_view'
  | 'link_click'
  | 'scroll_depth'
  | 'time_on_page'

interface EventData {
  [key: string]: any
}

interface TrackerConfig {
  enabled: boolean
  debug: boolean
  batchSize: number
  batchInterval: number
}

class AnalyticsTracker {
  private config: TrackerConfig
  private sessionId: string
  private eventQueue: any[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private startTime: number = Date.now()
  private scrollDepth: number = 0
  private maxScrollDepth: number = 0

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = {
      enabled: true,
      debug: false,
      batchSize: 10,
      batchInterval: 5000, // 5 секунд
      ...config,
    }

    // Получаем или создаем session ID
    this.sessionId = this.getOrCreateSessionId()

    // Инициализируем отслеживание
    if (typeof window !== 'undefined' && this.config.enabled) {
      this.init()
    }
  }

  private init() {
    try {
      // Page view для SPA отслеживаем через React hook (useAnalytics),
      // чтобы не было дублей и чтобы работало на route transitions.

      // Отслеживаем прокрутку
      this.initScrollTracking()

      // Отслеживаем время на странице
      this.initTimeTracking()

      // Отслеживаем клики
      this.initClickTracking()

      // Отслеживаем UTM метки и источники при первом заходе
      this.trackUserSource().catch(() => {
        // Silently fail
      })

      // Отправляем события перед закрытием страницы
      window.addEventListener('beforeunload', () => {
        this.trackTimeOnPage()
        this.flush().catch(() => {
          // Silently fail on page unload
        })
      })

      // Отправляем batch периодически
      this.startBatchTimer()

      if (this.config.debug) {
        console.log('[Analytics] Tracker initialized with session:', this.sessionId)
      }
    } catch (error) {
      if (this.config.debug) {
        // В dev Next.js показывает оверлей на console.error — не используем его здесь
        console.log('[Analytics] Initialization error:', error)
      }
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = Cookies.get('analytics_session_id')
    if (!sessionId) {
      sessionId = uuidv4()
      // Сессия живет 30 минут без активности
      Cookies.set('analytics_session_id', sessionId, { expires: 1 / 48 }) // 30 минут
    }
    return sessionId
  }

  private getDeviceInfo() {
    const ua = navigator.userAgent
    let deviceType = 'desktop'

    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|webOS|Opera Mini/i.test(ua)) {
      deviceType = 'mobile'
    } else if (/Tablet|iPad/i.test(ua)) {
      deviceType = 'tablet'
    }

    let browser = 'Unknown'
    if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('Edge')) browser = 'Edge'
    else if (ua.includes('Opera')) browser = 'Opera'

    let os = 'Unknown'
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS')) os = 'iOS'

    return { deviceType, browser, os, userAgent: ua }
  }

  private getPageContext() {
    if (typeof window === 'undefined') return {}
    try {
      const url = new URL(window.location.href)
      const referrer = document.referrer || ''
      let referrerHost = ''
      if (referrer) {
        try {
          referrerHost = new URL(referrer).host
        } catch {
          referrerHost = ''
        }
      }
      return {
        page: {
          url: url.href,
          path: url.pathname,
          search: url.search,
          title: document.title,
        },
        referrer: {
          url: referrer,
          host: referrerHost,
        },
        viewport: {
          w: window.innerWidth,
          h: window.innerHeight,
        },
        screen: {
          w: window.screen?.width,
          h: window.screen?.height,
        },
        locale: navigator.language,
        tz_offset_min: new Date().getTimezoneOffset(),
      }
    } catch {
      return {}
    }
  }

  private getUTMParams(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    
    const params = new URLSearchParams(window.location.search)
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || '',
    }
  }

  private async trackUserSource() {
    try {
      // Проверяем, записывали ли мы источник для этой сессии
      const sourceTracked = Cookies.get('source_tracked')
      if (sourceTracked) return

      const utm = this.getUTMParams()
      const hasUTM = Object.values(utm).some(v => v)

      if (!hasUTM && !document.referrer) return // Нечего отслеживать

      const deviceInfo = this.getDeviceInfo()

      const sourceData = {
        session_id: this.sessionId,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        referrer: document.referrer,
        landing_page: window.location.href,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        user_agent: deviceInfo.userAgent,
      }

      const response = await fetch('/api/analytics/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData),
      }).catch(() => null) // Игнорируем сетевые ошибки

      if (response?.ok) {
        Cookies.set('source_tracked', '1', { expires: 1 / 48 }) // 30 минут
      }
    } catch (error) {
      // Silently fail - не логируем чтобы не засорять консоль
    }
  }

  private initScrollTracking() {
    let ticking = false

    const updateScrollDepth = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      const scrollPercent = Math.round(
        (scrollTop / (documentHeight - windowHeight)) * 100
      )

      this.scrollDepth = scrollPercent
      this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent)

      ticking = false
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth)
        ticking = true
      }
    })

    // Отправляем глубину прокрутки при достижении определенных меток
    const milestones = [25, 50, 75, 100]
    const trackedMilestones = new Set<number>()

    setInterval(() => {
      milestones.forEach(milestone => {
        if (this.maxScrollDepth >= milestone && !trackedMilestones.has(milestone)) {
          trackedMilestones.add(milestone)
          this.track('scroll_depth', { depth: milestone })
        }
      })
    }, 1000)
  }

  private initTimeTracking() {
    // Отслеживаем видимость страницы
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackTimeOnPage()
        this.startTime = Date.now()
      }
    })
  }

  private trackTimeOnPage() {
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000) // секунды
    if (timeSpent > 5) { // Записываем только если больше 5 секунд
      this.track('time_on_page', {
        time_seconds: timeSpent,
        scroll_depth: this.maxScrollDepth,
      })
    }
  }

  private initClickTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      
      // Отслеживаем клики по ссылкам
      const link = target.closest('a')
      if (link && link.href) {
        this.track('link_click', {
          url: link.href,
          text: link.textContent?.trim(),
          external: !link.href.startsWith(window.location.origin),
        })
      }

      // Отслеживаем клики по кнопкам
      const button = target.closest('button')
      if (button) {
        this.track('button_click', {
          text: button.textContent?.trim(),
          type: button.type,
          id: button.id,
          class: button.className,
        })
      }
    })
  }

  private startBatchTimer() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
    }

    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush().catch(() => {
          // Silently fail for periodic flush
        })
      }
    }, this.config.batchInterval)
  }

  public track(eventType: EventType, data: EventData = {}) {
    if (!this.config.enabled) return

    // Продлеваем "сессию" cookie на активность
    try {
      Cookies.set('analytics_session_id', this.sessionId, { expires: 1 / 48 }) // 30 минут
    } catch {
      // ignore
    }

    const event = {
      event_type: eventType,
      event_url: window.location.href,
      referrer_url: document.referrer,
      session_id: this.sessionId,
      action_data: data,
      ...this.getDeviceInfo(),
      context: this.getPageContext(),
      timestamp: new Date().toISOString(),
    }

    this.eventQueue.push(event)

    if (this.config.debug) {
      console.log('[Analytics] Tracked event:', eventType, data)
    }

    // Отправляем сразу, если набралось достаточно событий
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush().catch(() => {
        // Silently fail
      })
    }
  }

  public trackPageView() {
    this.track('page_view', {
      title: document.title,
      path: window.location.pathname,
      search: window.location.search,
    })
  }

  public trackSearch(query: string, filters: any = {}) {
    this.track('search', {
      query,
      filters,
    })
  }

  public trackProfileView(profileId: string, profileSlug: string, profileName: string) {
    this.track('profile_view', {
      profile_id: profileId,
      profile_slug: profileSlug,
      profile_name: profileName,
    })

    // Обновляем интересы пользователя
    this.updateInterest('profile_viewed', profileId)
  }

  public trackServiceClick(serviceId: string, serviceName: string, profileId: string) {
    this.track('service_click', {
      service_id: serviceId,
      service_name: serviceName,
      profile_id: profileId,
    })

    this.updateInterest('service_type', serviceName)
  }

  public trackCartAdd(item: any) {
    this.track('cart_add', {
      item_id: item.id,
      item_name: item.name,
      item_price: item.price,
      profile_id: item.profile_id,
    })
  }

  public trackCartRemove(item: any) {
    this.track('cart_remove', {
      item_id: item.id,
      item_name: item.name,
    })
  }

  public trackCheckoutStart(totalAmount: number, itemsCount: number) {
    this.track('checkout_start', {
      total_amount: totalAmount,
      items_count: itemsCount,
    })
  }

  public trackCheckoutStartWithProfile(totalAmount: number, itemsCount: number, profileId?: string) {
    this.track('checkout_start', {
      total_amount: totalAmount,
      items_count: itemsCount,
      profile_id: profileId,
    })
  }

  public trackOrderCreate(orderId: string, totalAmount: number, profileId: string) {
    this.track('order_create', {
      order_id: orderId,
      total_amount: totalAmount,
      profile_id: profileId,
    })

    this.updateInterest('price_range', this.getPriceRange(totalAmount))
  }

  private getPriceRange(amount: number): string {
    if (amount < 5000) return '0-5000'
    if (amount < 10000) return '5000-10000'
    if (amount < 20000) return '10000-20000'
    if (amount < 50000) return '20000-50000'
    return '50000+'
  }

  private async updateInterest(interestType: string, interestValue: string) {
    try {
      const response = await fetch('/api/analytics/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          interest_type: interestType,
          interest_value: interestValue,
        }),
      })

      if (!response.ok && this.config.debug) {
        // В dev Next.js показывает оверлей на console.error — не используем его здесь
        console.log('[Analytics] Failed to update interest: HTTP', response.status)
      }
    } catch (error) {
      // Silently fail to avoid breaking user experience
      if (this.config.debug) {
        // В dev Next.js показывает оверлей на console.error — не используем его здесь
        console.log('[Analytics] Failed to update interest:', error)
      }
    }
  }

  public async flush() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
        },
        body: JSON.stringify({ events }),
        keepalive: true, // Важно для отправки при закрытии страницы
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error body')
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      if (this.config.debug) {
        console.log('[Analytics] Flushed', events.length, 'events')
      }
    } catch (error) {
      // Silently fail to avoid breaking the user experience
      if (this.config.debug) {
        // В dev Next.js показывает оверлей на console.error — не используем его здесь
        console.log('[Analytics] Failed to send events:', error instanceof Error ? error.message : error)
        if (error instanceof Error && error.stack) {
          console.debug('[Analytics] Error stack:', error.stack)
        }
      }
      // Возвращаем события обратно в очередь только в development
      if (this.config.debug) {
        this.eventQueue.unshift(...events)
      }
    }
  }

  public setConfig(config: Partial<TrackerConfig>) {
    this.config = { ...this.config, ...config }
  }

  public getSessionId(): string {
    return this.sessionId
  }
}

// Экспортируем singleton instance
export const tracker = new AnalyticsTracker({
  // По умолчанию включаем аналитику везде, кроме тестов.
  // Можно отключать через NEXT_PUBLIC_ANALYTICS_ENABLED="false"
  enabled:
    process.env.NODE_ENV !== 'test' &&
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false',
  debug:
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development',
})

export default tracker


