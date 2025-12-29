# Стандарты базы данных ZumZam

## Общие принципы

База данных следует **мировым стандартам PostgreSQL** и должна быть понятна любому SQL-разработчику.

## Именование

### Таблицы
- **Формат**: `snake_case`, множественное число
- **Примеры**: `profiles`, `order_items`, `user_sources`
- **Схема**: Всегда явно указывать `public.<table_name>`

```sql
-- ✅ ПРАВИЛЬНО
CREATE TABLE IF NOT EXISTS public.profiles (
  ...
);

-- ❌ НЕПРАВИЛЬНО
CREATE TABLE IF NOT EXISTS profiles (
  ...
);
```

### Колонки
- **Формат**: `snake_case`
- **Примеры**: `user_id`, `created_at`, `is_active`
- **ID колонки**: Всегда `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`

### Индексы
- **Формат**: `idx_<table>_<column>`
- **Примеры**: `idx_profiles_user_id`, `idx_orders_created_at`
- **Составные индексы**: `idx_<table>_<col1>_<col2>`

```sql
-- ✅ ПРАВИЛЬНО
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);

-- ❌ НЕПРАВИЛЬНО
CREATE INDEX profiles_user_id_idx ON profiles(user_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id); -- без public.
```

### Foreign Keys
- PostgreSQL автоматически генерирует имена FK
- Всегда явно указывать схему в REFERENCES

```sql
-- ✅ ПРАВИЛЬНО
profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE

-- ❌ НЕПРАВИЛЬНО
profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
```

## Стиль SQL

### Регистр команд
- **Все SQL команды в UPPERCASE**
- **Имена таблиц/колонок в lowercase**

```sql
-- ✅ ПРАВИЛЬНО
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❌ НЕПРАВИЛЬНО
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  created_at timestamptz default now()
);
```

### Идемпотентность
- Все миграции должны быть идемпотентными
- Использовать `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`

```sql
-- ✅ ПРАВИЛЬНО
CREATE TABLE IF NOT EXISTS public.orders (...);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT;

-- ❌ НЕПРАВИЛЬНО
CREATE TABLE orders (...); -- упадет при повторном запуске
```

## Типы данных

### UUID
- Все ID используют `UUID` вместо `SERIAL`
- Генерация: `gen_random_uuid()` (встроенная функция PostgreSQL)

### Timestamps
- Всегда `TIMESTAMPTZ` (с часовым поясом)
- По умолчанию: `DEFAULT NOW()`

```sql
-- ✅ ПРАВИЛЬНО
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()

-- ❌ НЕПРАВИЛЬНО
created_at TIMESTAMP DEFAULT NOW(), -- без timezone
created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- можно, но NOW() короче
```

### JSONB
- Используется для гибких структур (`details`, `metadata`)
- Всегда с дефолтным значением: `DEFAULT '{}'::jsonb`

### Arrays
- Используется для списков (`photos`, `tags`)
- Дефолт: `DEFAULT ARRAY[]::TEXT[]` или `DEFAULT '{}'::TEXT[]`

## Constraints

### CHECK Constraints
- Используются для валидации значений
- Именуются явно для читаемости

```sql
-- ✅ ПРАВИЛЬНО
status TEXT NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))

-- Или с именем
CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed'))
```

### UNIQUE Constraints
- Для уникальных полей (`slug`, `email`)
- Могут быть составными

```sql
-- ✅ ПРАВИЛЬНО
slug TEXT UNIQUE NOT NULL,
CONSTRAINT unique_user_service UNIQUE (user_id, service_id)
```

## Индексы

### Когда создавать индексы
1. **Foreign Keys** - рекомендуется для производительности
2. **Поисковые поля** - `slug`, `email`, `phone`
3. **Временные поля** - `created_at` для сортировки
4. **Фильтры** - `status`, `category`, `is_active`
5. **Векторные поля** - специальные индексы для pgvector

### Примеры

```sql
-- Foreign key
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Поиск и сортировка
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Фильтры
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_published ON public.profiles(is_published);

-- Составной индекс
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
```

## Row Level Security (RLS)

### Обязательно для всех таблиц
- Все таблицы должны иметь включенный RLS
- Политики для SELECT, INSERT, UPDATE, DELETE

```sql
-- ✅ ПРАВИЛЬНО
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Service Role
- Для системных операций используется `service_role`
- Полный доступ через `USING (true)`

```sql
CREATE POLICY "Service role full access"
  ON public.orders FOR ALL
  TO service_role
  USING (true);
```

## Триггеры

### Обновление updated_at
- Используется стандартная функция `moddatetime(updated_at)`
- Или кастомная функция `update_updated_at_column()`

```sql
-- ✅ ПРАВИЛЬНО (стандартная функция Supabase)
CREATE TRIGGER handle_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW 
  EXECUTE FUNCTION moddatetime(updated_at);

-- Или кастомная
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Комментарии

### Обязательные комментарии
- Описание таблицы: `COMMENT ON TABLE`
- Важные колонки: `COMMENT ON COLUMN`
- Функции: `COMMENT ON FUNCTION`

```sql
-- ✅ ПРАВИЛЬНО
COMMENT ON TABLE public.orders IS 'Заказы клиентов - содержат информацию о заказе и выбранных услугах';
COMMENT ON COLUMN public.orders.status IS 'pending=ожидает, confirmed=подтвержден, completed=выполнен';
COMMENT ON FUNCTION public.calculate_order_total IS 'Вычисляет общую сумму заказа на основе его элементов';
```

## Миграции

### Формат имени файла
- `YYYYMMDDHHMMSS_description.sql`
- Пример: `20251215120000_add_conversation_to_orders.sql`

### Структура миграции
```sql
-- Заголовок с описанием
-- Миграция: Описание изменений
-- Дата: YYYY-MM-DD
-- Автор: Команда

-- Разделители для читаемости
-- ============================================
-- 1. Создание таблицы
-- ============================================

CREATE TABLE IF NOT EXISTS public.new_table (
  ...
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_new_table_column ON public.new_table(column);

-- RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "..." ON public.new_table ...;

-- Комментарии
COMMENT ON TABLE public.new_table IS '...';
```

## Расширения PostgreSQL

### Используемые расширения
- **pgvector**: векторный поиск (embeddings)
- **PostGIS**: геолокация (geography/geometry)
- **uuid-ossp**: генерация UUID (но используем `gen_random_uuid()`)

### Включение расширений
```sql
-- В Supabase расширения уже включены
-- Для локальной разработки:
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Best Practices

### 1. Всегда явно указывать схему
```sql
public.profiles, public.orders, auth.users
```

### 2. Использовать транзакции в миграциях
```sql
BEGIN;
-- изменения
COMMIT;
```

### 3. Проверять существование перед созданием
```sql
CREATE TABLE IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
```

### 4. Документировать сложную логику
```sql
-- Сохраняем цену на момент заказа
-- (на случай если цена услуги изменится до оформления заказа)
price_snapshot NUMERIC NOT NULL,
```

### 5. Использовать CHECK constraints для валидации
```sql
status TEXT NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending', 'confirmed', 'completed'))
```

### 6. Индексировать часто используемые поля
- Foreign keys
- Поля для фильтрации
- Поля для сортировки

### 7. Использовать JSONB для гибких структур
- Но избегать излишней вложенности
- Документировать структуру в комментариях

## Пример правильной миграции

```sql
-- Миграция: Создание таблицы заказов
-- Дата: 2025-12-15
-- Автор: ZumZam Team

-- ============================================
-- 1. Создаем таблицу заказов
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected')),
  
  total_amount NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Индексы
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON public.orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================
-- 3. RLS политики
-- ============================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Providers can view orders for their services"
  ON public.orders FOR SELECT
  USING (auth.uid() = provider_id);

-- ============================================
-- 4. Триггеры
-- ============================================

CREATE TRIGGER handle_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW 
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================
-- 5. Комментарии
-- ============================================

COMMENT ON TABLE public.orders IS 'Заказы клиентов - содержат информацию о заказе и выбранных услугах';
COMMENT ON COLUMN public.orders.status IS 'pending=ожидает, confirmed=подтвержден, in_progress=в работе, completed=выполнен, cancelled=отменен клиентом, rejected=отклонен поставщиком';
```

## Чеклист для проверки миграции

- [ ] Все таблицы с префиксом `public.`
- [ ] Все REFERENCES с явной схемой
- [ ] Все индексы именуются через `idx_`
- [ ] Все SQL команды в UPPERCASE
- [ ] Миграция идемпотентна (`IF NOT EXISTS`)
- [ ] RLS включен на всех таблицах
- [ ] Политики RLS созданы
- [ ] Индексы созданы для FK и часто используемых полей
- [ ] Комментарии добавлены к таблицам и важным колонкам
- [ ] Триггеры для `updated_at` настроены
- [ ] CHECK constraints для валидации значений















