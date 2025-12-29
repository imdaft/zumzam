// Service Worker для обработки push-уведомлений
// Файл: public/sw.js

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(clients.claim())
})

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event)

  let data = {
    title: 'ZumZam',
    body: 'У вас новое уведомление',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: '/',
    timestamp: Date.now()
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e)
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: {
      url: data.url,
      timestamp: data.timestamp
    },
    vibrate: [200, 100, 200],
    tag: 'zumzam-notification',
    renotify: true,
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Обработка клика на уведомление
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Если есть открытая вкладка - фокусируемся на ней
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Иначе открываем новую вкладку
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event)
})
