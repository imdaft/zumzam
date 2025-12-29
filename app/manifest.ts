import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZumZam - Агрегатор детских праздников',
    short_name: 'ZumZam',
    description: 'Агрегатор детских праздников в Санкт-Петербурге. Найдём идеальный праздник за 5 минут ⚡',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ea580c',
    categories: ['kids', 'entertainment', 'lifestyle'],
    lang: 'ru',
    dir: 'ltr',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: 'Поиск',
        short_name: 'Поиск',
        url: '/search',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Мои заказы',
        short_name: 'Заказы',
        url: '/orders',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}


