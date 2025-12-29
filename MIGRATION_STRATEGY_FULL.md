# 🎯 СТРАТЕГИЯ ПОЛНОЙ МИГРАЦИИ (136 API)

**Цель:** Мигрировать ВСЕ API на Prisma

**Текущий статус:** 27/163 API мигрировано (16.6%)

---

## 📊 ПРИОРИТИЗАЦИЯ

### ✅ ГОТОВО (27 API)
- Профили (CRUD)
- Отзывы
- Услуги
- Заявки
- Программы (show, quest, animator)
- Партнёры
- Локации

### 🔄 В РАБОТЕ (136 API)

**Группа H: Users (5 API)** - Управление пользователями
- `/api/users/me`
- `/api/user/route`
- `/api/user/counts`
- `/api/user/views`

**Группа I: Analytics (5 API)** - Базовая аналитика
- `/api/analytics/track` ✅ (уже мигрирован)
- `/api/analytics/source`
- `/api/analytics/interest`
- `/api/analytics/provider`
- `/api/analytics/provider/breakdowns`

**Группа J: Notifications (4 API)**
- `/api/notifications` (GET, POST)
- `/api/notifications/[id]` (GET, PATCH, DELETE)
- `/api/notifications/[id]/read`

**Группа K: Conversations (4 API)**
- `/api/conversations` (GET, POST)
- `/api/conversations/[id]/messages`
- `/api/conversations/[id]/mark-read`
- `/api/conversations/ensure-for-order`

**Группа L: Orders (7 API)**
- `/api/orders` (GET, POST)
- `/api/orders/[id]` (GET, PATCH, DELETE)
- `/api/orders/[id]/messages`
- `/api/orders/[id]/messages/read`
- `/api/orders/[id]/attachments`

**Группа M: Admin (30+ API)**
- Profiles, Users, Reviews, Analytics, AI Settings, etc.

**Группа N: Остальные (80+ API)**
- AI, Payments, Integrations, Settings, etc.

---

## ⚡ УСКОРЕННАЯ МИГРАЦИЯ

### Шаблон для простых CRUD:
```typescript
// GET
const data = await prisma.table.findMany({ where, orderBy, skip, take })

// POST
const item = await prisma.table.create({ data: body })

// PATCH
const item = await prisma.table.update({ where: { id }, data: body })

// DELETE
await prisma.table.delete({ where: { id } })
```

### Авторизация (единый паттерн):
```typescript
const token = request.cookies.get('auth-token')?.value
if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const payload = await verifyToken(token)
if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

const userId = payload.sub
```

---

## 🚧 СЛОЖНЫЕ КЕЙСЫ

1. **Storage** - требует Yandex Object Storage
2. **RPC функции** - переписать на Prisma
3. **Realtime** - пока не используется
4. **Auth callbacks** - уже мигрированы

---

## ⏱️ ОЦЕНКА ВРЕМЕНИ

- Простые CRUD (80 API): ~40 минут (30 сек/API)
- Средние (40 API): ~60 минут (1.5 мин/API)
- Сложные (16 API): ~40 минут (2.5 мин/API)

**Итого:** ~2.5 часа для полной миграции


**Цель:** Мигрировать ВСЕ API на Prisma

**Текущий статус:** 27/163 API мигрировано (16.6%)

---

## 📊 ПРИОРИТИЗАЦИЯ

### ✅ ГОТОВО (27 API)
- Профили (CRUD)
- Отзывы
- Услуги
- Заявки
- Программы (show, quest, animator)
- Партнёры
- Локации

### 🔄 В РАБОТЕ (136 API)

**Группа H: Users (5 API)** - Управление пользователями
- `/api/users/me`
- `/api/user/route`
- `/api/user/counts`
- `/api/user/views`

**Группа I: Analytics (5 API)** - Базовая аналитика
- `/api/analytics/track` ✅ (уже мигрирован)
- `/api/analytics/source`
- `/api/analytics/interest`
- `/api/analytics/provider`
- `/api/analytics/provider/breakdowns`

**Группа J: Notifications (4 API)**
- `/api/notifications` (GET, POST)
- `/api/notifications/[id]` (GET, PATCH, DELETE)
- `/api/notifications/[id]/read`

**Группа K: Conversations (4 API)**
- `/api/conversations` (GET, POST)
- `/api/conversations/[id]/messages`
- `/api/conversations/[id]/mark-read`
- `/api/conversations/ensure-for-order`

**Группа L: Orders (7 API)**
- `/api/orders` (GET, POST)
- `/api/orders/[id]` (GET, PATCH, DELETE)
- `/api/orders/[id]/messages`
- `/api/orders/[id]/messages/read`
- `/api/orders/[id]/attachments`

**Группа M: Admin (30+ API)**
- Profiles, Users, Reviews, Analytics, AI Settings, etc.

**Группа N: Остальные (80+ API)**
- AI, Payments, Integrations, Settings, etc.

---

## ⚡ УСКОРЕННАЯ МИГРАЦИЯ

### Шаблон для простых CRUD:
```typescript
// GET
const data = await prisma.table.findMany({ where, orderBy, skip, take })

// POST
const item = await prisma.table.create({ data: body })

// PATCH
const item = await prisma.table.update({ where: { id }, data: body })

// DELETE
await prisma.table.delete({ where: { id } })
```

### Авторизация (единый паттерн):
```typescript
const token = request.cookies.get('auth-token')?.value
if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const payload = await verifyToken(token)
if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

const userId = payload.sub
```

---

## 🚧 СЛОЖНЫЕ КЕЙСЫ

1. **Storage** - требует Yandex Object Storage
2. **RPC функции** - переписать на Prisma
3. **Realtime** - пока не используется
4. **Auth callbacks** - уже мигрированы

---

## ⏱️ ОЦЕНКА ВРЕМЕНИ

- Простые CRUD (80 API): ~40 минут (30 сек/API)
- Средние (40 API): ~60 минут (1.5 мин/API)
- Сложные (16 API): ~40 минут (2.5 мин/API)

**Итого:** ~2.5 часа для полной миграции




