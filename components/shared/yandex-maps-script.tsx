'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

/**
 * Глобальная подгрузка Яндекс.Карт — но ТОЛЬКО там, где они реально нужны.
 * Это резко ускоряет кабинет и страницы без карты (favorites/orders/etc).
 */
export function YandexMapsScript() {
  const pathname = usePathname()
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''

  if (!apiKey) return null

  const needsMaps =
    pathname === '/' ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/profiles/')

  if (!needsMaps) return null

  return (
    <Script
      src={`https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`}
      strategy="lazyOnload"
    />
  )
}






