# 🚀 НАСТРОЙКА REALTIME + PUSH (БЫСТРЫЙ СТАРТ)

## ⚡ ЧТО СДЕЛАНО

### ✅ Server-Sent Events (SSE) вместо Polling
- **Endpoint:** `/api/realtime/notifications`
- **События:** `notification-created`, `message-received`
- **Обновление:** Каждые 5 секунд (раньше было каждые 30 сек через polling)
- **Подключено в:** `app/(dashboard)/layout.tsx`

### ✅ Web Push API
- **API Routes:**
  - `POST /api/push/subscribe` - сохранить подписку
  - `DELETE /api/push/subscribe` - удалить подписку
  - `GET /api/push/vapid-public-key` - получить публичный ключ
  - `POST /api/push/send` - отправить push (для админов)
  
- **Service Worker:** `/public/sw.js`
- **UI Промпт:** `components/features/notifications/push-notification-prompt.tsx`

### ✅ Миграции БД
- `20251228_create_notifications_table.sql`
- `20251228_add_sender_role_to_messages.sql`
- `20251228_create_push_subscriptions.sql`

---

## 🔧 ИНСТРУКЦИЯ ПО ЗАПУСКУ

### 1. Сгенерировать VAPID ключи

```bash
npx web-push generate-vapid-keys
```

Пример вывода:
```
Public Key: BJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### 2. Добавить в `.env.local`

Создайте файл `.env.local` (если нет):

```env
# VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BJxxxxx..."
VAPID_PRIVATE_KEY="yyyyyyyy..."
VAPID_EMAIL="admin@zumzam.ru"
```

### 3. Применить миграции в БД

```sql
-- 1. Таблица notifications
\i supabase/migrations/20251228_create_notifications_table.sql

-- 2. Поле sender_role в messages
\i supabase/migrations/20251228_add_sender_role_to_messages.sql

-- 3. Таблица push_subscriptions
\i supabase/migrations/20251228_create_push_subscriptions.sql
```

### 4. Обновить Prisma Client

```bash
npx prisma generate
```

### 5. Добавить промпт в layout

В `app/(dashboard)/layout.tsx` (уже добавлено):

```tsx
import { PushNotificationPrompt } from '@/components/features/notifications/push-notification-prompt'

// В конце return
<PushNotificationPrompt />
```

### 6. Перезапустить сервер

```bash
npm run dev
```

---

## 🧪 КАК ПРОВЕРИТЬ

### Проверка SSE

1. Откройте DevTools → Network
2. Фильтр: "realtime"
3. Должно быть соединение типа `eventsource` к `/api/realtime/notifications`

### Проверка Push

1. Зайдите на сайт
2. Через 5 секунд появится промпт "Включить уведомления?"
3. Нажмите "Включить"
4. Проверьте в консоли: `[Push] Subscription saved`

### Тестовое уведомление

```bash
# Создайте тестовое уведомление через SQL
INSERT INTO notifications (user_id, type, title, message, link, created_at)
VALUES ('your-user-id', 'test', 'Тест', 'Это тестовое уведомление', '/notifications', NOW());
```

**Ожидание:**
- ✅ SSE отправит событие `notification-created`
- ✅ Счётчик в хедере обновится мгновенно
- ✅ Звук уведомления воспроизведется
- ✅ Push-уведомление появится в браузере (если разрешение дано)

---

## 📦 ФАЙЛЫ ПРОЕКТА

### API Routes
```
app/api/
├── realtime/
│   └── notifications/route.ts  # SSE endpoint
├── push/
│   ├── subscribe/route.ts      # Сохранение подписки
│   ├── send/route.ts           # Отправка push
│   └── vapid-public-key/route.ts
```

### Components
```
components/features/notifications/
└── push-notification-prompt.tsx  # UI для запроса разрешения
```

### Hooks
```
lib/hooks/
└── use-realtime-notifications.ts  # Хук для SSE (опциональный)
```

### Service Worker
```
public/
└── sw.js  # Обработка push-уведомлений
```

---

## 🎯 ПРЕИМУЩЕСТВА

### До (Polling каждые 30 сек):
- ❌ Задержка до 30 секунд
- ❌ Много лишних запросов
- ❌ Нагрузка на сервер

### После (SSE + Push):
- ✅ Мгновенные обновления (5 сек)
- ✅ Одно постоянное соединение
- ✅ Меньше нагрузки
- ✅ Браузерные push-уведомления

---

## 🔒 БЕЗОПАСНОСТЬ

- ✅ JWT авторизация для SSE
- ✅ Проверка владельца подписки
- ✅ VAPID ключи для шифрования push
- ✅ HTTPS обязателен в production

---

## 📊 ЧТО ДАЛЬШЕ

1. [ ] Применить миграции в production БД
2. [ ] Сгенерировать production VAPID ключи
3. [ ] Добавить в production `.env`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   VAPID_EMAIL="..."
   ```
4. [ ] Протестировать на staging
5. [ ] Deploy в production

---

**Готово! Realtime + Push настроены ✨**

Подробная документация: `docs/REALTIME_AND_PUSH_SETUP.md`

