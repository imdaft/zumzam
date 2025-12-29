# 🚀 Настройка Realtime и Push-уведомлений

## 📦 Что реализовано

### 1. **Server-Sent Events (SSE)** для realtime обновлений
- ✅ Endpoint: `/api/realtime/notifications`
- ✅ События: `notification-created`, `message-received`
- ✅ Автоматическое переподключение при ошибках
- ✅ Keepalive каждые 30 секунд

### 2. **Web Push API** для браузерных уведомлений
- ✅ Поддержка Chrome, Firefox, Edge, Safari 16+
- ✅ Красивый промпт для запроса разрешения
- ✅ Service Worker для обработки уведомлений
- ✅ API для отправки push-уведомлений

### 3. **Миграция БД**
- ✅ Таблица `push_subscriptions` для хранения подписок
- ✅ Индексы для быстрого поиска

---

## 🔧 Настройка (Шаг за шагом)

### Шаг 1: Генерация VAPID ключей

```bash
# Установите web-push глобально (если ещё не установлен)
npm install -g web-push

# Сгенерируйте VAPID ключи
npx web-push generate-vapid-keys
```

**Пример вывода:**
```
=======================================

Public Key:
BJKj8kq_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Private Key:
yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

=======================================
```

### Шаг 2: Добавить ключи в `.env.local`

Создайте файл `.env.local` (если нет) и добавьте:

```bash
# VAPID Keys для Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BJKj8kq_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_PRIVATE_KEY="yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
VAPID_EMAIL="admin@zumzam.ru"
```

⚠️ **ВАЖНО:** 
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - будет доступен в браузере
- `VAPID_PRIVATE_KEY` - НЕ ДОЛЖЕН попадать в git (добавлен в `.gitignore`)

### Шаг 3: Применить миграцию БД

```sql
-- В Supabase Dashboard → SQL Editor или локально
\i supabase/migrations/20251228_create_push_subscriptions.sql
```

Или через psql:
```bash
psql -U postgres -d zumzam -f supabase/migrations/20251228_create_push_subscriptions.sql
```

### Шаг 4: Обновить Prisma Client

```bash
npx prisma generate
```

### Шаг 5: Подключить компонент в layout

В `app/(dashboard)/layout.tsx` или `app/(public)/layout.tsx` добавьте:

```tsx
import { PushNotificationPrompt } from '@/components/features/notifications/push-notification-prompt'

export default function Layout({ children }) {
  return (
    <>
      {children}
      
      {/* Промпт для включения push-уведомлений */}
      <PushNotificationPrompt />
    </>
  )
}
```

### Шаг 6: Перезапустить сервер

```bash
npm run dev
```

---

## 📱 Как это работает

### **Realtime через SSE**

1. Клиент подключается к `/api/realtime/notifications`
2. Сервер держит соединение открытым
3. Каждые 5 секунд сервер проверяет новые уведомления/сообщения
4. При обнаружении новых → отправляет событие клиенту
5. Клиент получает событие → обновляет UI мгновенно

**Преимущества:**
- ✅ Мгновенные обновления (без polling каждые 30 сек)
- ✅ Меньше нагрузки на сервер (одно соединение вместо постоянных запросов)
- ✅ Автоматическое переподключение

### **Web Push**

1. Пользователь заходит на сайт → видит промпт "Включить уведомления?"
2. Нажимает "Включить" → браузер запрашивает разрешение
3. После разрешения → регистрируется service worker
4. Service worker подписывается на push-уведомления
5. Подписка сохраняется в БД (`push_subscriptions`)
6. При создании нового уведомления → сервер отправляет push на все подписки пользователя
7. Service worker получает push → показывает нативное уведомление

**Поддержка браузеров:**
- ✅ Chrome/Edge (Desktop + Android)
- ✅ Firefox (Desktop + Android)
- ✅ Safari 16+ (macOS + iOS 16.4+)
- ❌ Safari < 16 (не поддерживает)

---

## 🎨 Кастомизация

### Изменить звук уведомления

Замените файлы:
- `/public/sounds/notification.mp3` - для уведомлений
- `/public/sounds/message.mp3` - для сообщений

### Изменить иконку уведомления

Замените файлы:
- `/public/icons/icon-192x192.png` - основная иконка
- `/public/icons/badge-72x72.png` - маленький badge

### Изменить текст промпта

Отредактируйте файл:
```
components/features/notifications/push-notification-prompt.tsx
```

---

## 🧪 Тестирование

### 1. Проверить SSE подключение

Откройте DevTools → Network → Filter: "realtime"

Должно быть активное соединение к `/api/realtime/notifications` типа `eventsource`

### 2. Проверить push-подписку

В консоли браузера:
```js
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Push subscription:', sub)
  })
})
```

### 3. Отправить тестовое push-уведомление

Через API (нужны права админа):
```bash
curl -X POST http://localhost:4000/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "userId": "user-id-here",
    "title": "Тест",
    "body": "Это тестовое push-уведомление",
    "url": "/notifications"
  }'
```

---

## 🐛 Troubleshooting

### Проблема: "Push notifications not configured"

**Решение:** Проверьте, что в `.env.local` добавлены VAPID ключи

### Проблема: Service Worker не регистрируется

**Решение:** 
1. Откройте DevTools → Application → Service Workers
2. Нажмите "Unregister" на всех старых
3. Перезагрузите страницу

### Проблема: SSE постоянно переподключается

**Решение:** Проверьте логи сервера - возможно ошибка в БД запросе

### Проблема: Push не приходят

**Чек-лист:**
- ✅ VAPID ключи добавлены в `.env.local`
- ✅ Разрешение на уведомления дано в браузере
- ✅ Подписка сохранена в БД (`SELECT * FROM push_subscriptions`)
- ✅ Service Worker активен

---

## 📊 Мониторинг

### Логи SSE

```bash
# В терминале сервера
grep "Realtime" logs.txt
```

### Количество активных подписок

```sql
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(DISTINCT user_id) as unique_users
FROM push_subscriptions;
```

### Статистика отправок

```sql
-- Добавьте в будущем таблицу push_logs для аналитики
```

---

## 🚀 Production Checklist

- [ ] VAPID ключи добавлены в production environment variables
- [ ] Миграция `20251228_create_push_subscriptions.sql` применена
- [ ] Service Worker (`/public/sw.js`) доступен
- [ ] HTTPS включён (обязательно для Push API)
- [ ] Monitoring SSE подключений настроен
- [ ] Rate limiting для `/api/push/send` настроен

---

## 📚 Дополнительные ресурсы

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)

