'use client'

import { useEffect, useRef } from 'react'
import { tracker } from '@/lib/analytics/tracker'

/**
 * Трекер для публичной страницы профиля.
 * Важно: размещаем один раз на странице, чтобы не было дублей.
 */
export function ProfileAnalyticsTracker({
  profileId,
  profileSlug,
  profileName,
}: {
  profileId: string
  profileSlug: string
  profileName: string
}) {
  const sentRef = useRef(false)
  const startRef = useRef<number>(Date.now())
  const maxScrollRef = useRef<number>(0)

  useEffect(() => {
    if (sentRef.current) return
    sentRef.current = true
    tracker.trackProfileView(profileId, profileSlug, profileName)
  }, [profileId, profileSlug, profileName])

  useEffect(() => {
    startRef.current = Date.now()
    maxScrollRef.current = 0

    const onScroll = () => {
      const windowHeight = window.innerHeight || 1
      const docHeight = document.documentElement.scrollHeight || 1
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0
      const denom = Math.max(1, docHeight - windowHeight)
      const pct = Math.round((scrollTop / denom) * 100)
      if (pct > maxScrollRef.current) maxScrollRef.current = pct
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      const timeSeconds = Math.round((Date.now() - startRef.current) / 1000)
      // Пишем только если пользователь реально был на странице
      if (timeSeconds >= 5) {
        tracker.track('time_on_page', {
          profile_id: profileId,
          profile_slug: profileSlug,
          profile_name: profileName,
          time_seconds: timeSeconds,
          scroll_depth: maxScrollRef.current,
          page_kind: 'profile',
        })
      }
    }
  }, [profileId, profileSlug, profileName])

  return null
}






