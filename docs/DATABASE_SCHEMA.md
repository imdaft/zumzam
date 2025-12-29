# Схема базы данных ZumZam

## Обзор

База данных построена на **PostgreSQL 15+** с использованием **Supabase** как Backend-as-a-Service. Схема следует стандартам PostgreSQL и использует современные возможности: векторный поиск (pgvector), геолокацию (PostGIS), RLS (Row Level Security).

## Стандарты именования

- **Таблицы**: `snake_case`, множественное число (например, `profiles`, `order_items`)
- **Колонки**: `snake_case` (например, `user_id`, `created_at`)
- **Индексы**: `idx_<table>_<column>` (например, `idx_profiles_user_id`)
- **Foreign Keys**: автоматически генерируются PostgreSQL
- **Схема**: все таблицы в схеме `public`

## Основные таблицы

### 1. Пользователи и аутентификация

#### `users` (public.users)
Расширенная информация о пользователях платформы.

**Связи:**
- `id` → `auth.users.id` (Supabase Auth)
- Один пользователь может иметь несколько профилей (`profiles.user_id`)

**Ключевые поля:**
- `role`: `client` | `provider` | `admin`
- `credits`: баланс кредитов для AI функций
- `first_name`, `last_name`, `phone`, `city`

#### `profiles` (public.profiles)
Публичные профили студий, аниматоров, агентств.

**Связи:**
- `user_id` → `auth.users.id`
- Связан с: `services`, `reviews`, `bookings`, `orders`, `profile_locations`

**Ключевые поля:**
- `category`: тип профиля (venue, animator, show, quest, etc.)
- `embedding`: векторное представление для AI поиска (768d)
- `verified`: статус верификации
- `details`: JSONB с категорийно-специфичными данными

### 2. Услуги и бронирования

#### `services` (public.services)
Услуги, предлагаемые профилями.

**Связи:**
- `profile_id` → `profiles.id`
- `category_id` → `service_categories.id` (опционально)
- Связан с: `cart_items`, `order_items`, `bookings`

**Ключевые поля:**
- `price`, `price_from`, `price_to`: ценовая информация
- `service_type`: `main` | `additional`
- `is_package`: флаг пакетной услуги
- `embedding`: вектор для AI поиска

#### `bookings` (public.bookings)
Бронирования услуг (старая система, используется для регулярных занятий).

**Связи:**
- `parent_id` → `users.id` (клиент)
- `profile_id` → `profiles.id`
- `service_id` → `services.id`
- `availability_id` → `availability.id`

#### `orders` (public.orders)
Заказы услуг (новая система для разовых мероприятий).

**Связи:**
- `client_id` → `auth.users.id`
- `provider_id` → `auth.users.id`
- `profile_id` → `profiles.id`
- `conversation_id` → `conversations.id`
- `pipeline_stage_id` → `pipeline_stages.id`
- Связан с: `order_items`, `order_messages`, `order_attachments`

**Статусы:**
- `status`: `pending` → `confirmed` → `in_progress` → `completed` (или `cancelled`/`rejected`)
- `payment_status`: `unpaid` → `partial` → `paid` (или `refunded`)

#### `order_items` (public.order_items)
Элементы заказа (отдельные услуги).

**Связи:**
- `order_id` → `orders.id`
- `service_id` → `services.id` (опционально, может быть удалена)

**Особенность:** Сохраняет снимок цены и описания услуги на момент заказа.

### 3. Корзина

#### `cart_items` (public.cart_items)
Временное хранилище выбранных услуг перед оформлением заказа.

**Связи:**
- `user_id` → `auth.users.id`
- `service_id` → `services.id`
- `profile_id` → `profiles.id`

**Особенность:** Сохраняет `price_snapshot` на момент добавления в корзину.

### 4. Отзывы и рейтинги

#### `reviews` (public.reviews)
Отзывы клиентов о профилях и услугах.

**Связи:**
- `profile_id` → `profiles.id`
- `author_id` → `users.id`
- `booking_id` → `bookings.id`

**Ключевые поля:**
- `rating`: общий рейтинг (1-5)
- `rating_quality`, `rating_punctuality`, `rating_communication`, `rating_value`: детальные оценки
- `embedding`: вектор для AI поиска по содержанию отзывов

### 5. Биржа заказов

#### `order_requests` (public.order_requests)
Открытые заявки от клиентов (биржа заказов).

**Связи:**
- `client_id` → `auth.users.id`
- `listing_plan_id` → `board_listing_plans.id`
- Связан с: `order_responses`, `telegram_request_posts`

**Ключевые поля:**
- `category`: категория услуги
- `status`: `active` | `in_progress` | `closed` | `cancelled`
- `is_urgent`: флаг срочности
- `details`: JSONB с категорийно-специфичными данными

#### `order_responses` (public.order_responses)
Отклики исполнителей на заявки.

**Связи:**
- `request_id` → `order_requests.id`
- `profile_id` → `profiles.id`
- `performer_id` → `auth.users.id`
- Связан с: `conversations`

### 6. Сообщения и чаты

#### `conversations` (public.conversations)
Диалоги между пользователями.

**Связи:**
- `participant_1_id`, `participant_2_id` → `auth.users.id`
- `profile_id` → `profiles.id`
- `response_id` → `order_responses.id`
- Связан с: `messages`, `orders`, `conversation_folder_links`

#### `messages` (public.messages)
Сообщения в диалогах.

**Связи:**
- `conversation_id` → `conversations.id`
- `sender_id` → `auth.users.id`
- Связан с: `message_reactions`

#### `order_messages` (public.order_messages)
Сообщения в чате заказов (старая система).

**Связи:**
- `order_id` → `orders.id`

### 7. Платежи

#### `payments` (public.payments)
История платежных транзакций.

**Связи:**
- `booking_id` → `bookings.id`

**Провайдеры:** `yookassa` (основной для РФ), `stripe`, `paypal`, `manual`

#### `platform_payments` (public.platform_payments)
Платежи за внутренние услуги платформы (подписки, реклама).

**Связи:**
- `user_id` → `auth.users.id`

**Типы:** `subscription`, `promotion`

### 8. Подписки и тарифы

#### `subscription_plans` (public.subscription_plans)
Тарифные планы для сервисов.

**Ключевые поля:**
- `features`: JSONB массив доступных функций
- `search_priority`: приоритет в поиске (0-10)

#### `subscriptions` (public.subscriptions)
Активные подписки пользователей.

**Связи:**
- `user_id` → `auth.users.id`
- `plan_id` → `subscription_plans.id`
- `profile_id` → `profiles.id`

### 9. Реклама

#### `ad_slots` (public.ad_slots)
Рекламные места на платформе.

#### `ad_campaigns` (public.ad_campaigns)
Рекламные кампании пользователей.

**Связи:**
- `user_id` → `auth.users.id`
- `profile_id` → `profiles.id`
- Связан с: `ad_bookings`, `ad_impressions`

#### `ad_impressions` (public.ad_impressions)
Статистика показов и кликов по рекламе.

### 10. CRM и воронки

#### `pipelines` (public.pipelines)
Кастомные воронки продаж для провайдеров.

**Связи:**
- `profile_id` → `profiles.id`
- Связан с: `pipeline_stages`

#### `pipeline_stages` (public.pipeline_stages)
Этапы воронок продаж.

**Связи:**
- `pipeline_id` → `pipelines.id`
- Связан с: `orders`

### 11. Локации

#### `profile_locations` (public.profile_locations)
Локации профилей (адреса филиалов/сетей).

**Связи:**
- `profile_id` → `profiles.id`
- Связан с: `yandex_reviews_cache`

**Ключевые поля:**
- `geo_location`: PostGIS geography для геопоиска
- `working_hours`: JSONB с расписанием работы
- `is_main`: главный адрес

#### `work_geography` (public.work_geography)
География работы для мобильных категорий.

**Связи:**
- `profile_id` → `profiles.id`

### 12. Категорийно-специфичные таблицы

#### `animator_characters` (public.animator_characters)
Персонажи и программы аниматоров.

**Связи:**
- `profile_id` → `profiles.id`

#### `show_programs` (public.show_programs)
Виды шоу-программ.

**Связи:**
- `profile_id` → `profiles.id`

#### `quest_programs` (public.quest_programs)
Квесты.

**Связи:**
- `profile_id` → `profiles.id`

#### `master_class_programs` (public.master_class_programs)
Мастер-классы.

**Связи:**
- `profile_id` → `profiles.id`

#### `photography_styles` (public.photography_styles)
Стили съемки.

**Связи:**
- `profile_id` → `profiles.id`

#### `agency_partners` (public.agency_partners)
Партнеры агентства.

**Связи:**
- `agency_profile_id` → `profiles.id`
- `partner_profile_id` → `profiles.id` (опционально)

### 13. Аналитика

#### `analytics_events` (public.analytics_events)
Все аналитические события платформы.

**Ключевые поля:**
- `event_type`: `page_view`, `profile_view`, `search`, `click`, etc.
- `session_id`: уникальный идентификатор сессии
- `metadata`: JSONB с дополнительными данными

#### `user_sources` (public.user_sources)
Источники трафика и UTM метки.

**Связи:**
- `user_id` → `auth.users.id`

#### `user_activity` (public.user_activity)
Активность пользователей.

**Связи:**
- `user_id` → `auth.users.id`

### 14. Уведомления

#### `notifications` (public.notifications)
Уведомления пользователей о событиях.

**Связи:**
- `user_id` → `users.id`

#### `notification_settings` (public.notification_settings)
Настройки уведомлений пользователей.

**Связи:**
- `user_id` → `auth.users.id` (UNIQUE)

#### `push_subscriptions` (public.push_subscriptions)
Подписки на push-уведомления (Web Push API).

**Связи:**
- `user_id` → `auth.users.id`

### 15. Telegram интеграция

#### `telegram_users` (public.telegram_users)
Пользователи Telegram-бота.

**Связи:**
- `user_id` → `auth.users.id`

#### `telegram_request_posts` (public.telegram_request_posts)
Опубликованные заявки в Telegram-каналах.

**Связи:**
- `request_id` → `order_requests.id`

### 16. Прочее

#### `favorites` (public.favorites)
Избранные профили у пользователей.

**Связи:**
- `user_id` → `users.id`
- `profile_id` → `profiles.id`

#### `errors` (public.errors)
Логи ошибок клиентской части.

**Связи:**
- `user_id` → `auth.users.id`

#### `credit_transactions` (public.credit_transactions)
История операций с кредитами.

**Связи:**
- `user_id` → `auth.users.id`

## Индексы

Все индексы следуют стандарту `idx_<table>_<column>`:

- **Primary Keys**: автоматически создают индекс
- **Foreign Keys**: рекомендуется создавать индекс для производительности
- **Поисковые поля**: `slug`, `email`, `phone` - уникальные индексы
- **Временные поля**: `created_at`, `updated_at` - индексы для сортировки
- **Векторные поля**: `embedding` - специальные индексы для pgvector

## Row Level Security (RLS)

Все таблицы имеют включенный RLS для безопасности:

- **Политики SELECT**: пользователи видят только свои данные или публичные данные
- **Политики INSERT/UPDATE/DELETE**: пользователи могут изменять только свои данные
- **Service Role**: полный доступ для системных операций

## Триггеры

- **updated_at**: автоматическое обновление `updated_at` при изменении записи
- **calculate_order_total**: автоматический пересчет суммы заказа при изменении `order_items`

## Функции

- `calculate_order_total(uuid)`: вычисляет общую сумму заказа
- `validate_cart(uuid)`: проверяет валидность корзины
- `refresh_analytics_daily_stats()`: обновляет материализованное представление аналитики

## Материализованные представления

- `analytics_daily_stats`: агрегированная статистика по дням

## Расширения PostgreSQL

- **pgvector**: векторный поиск (embeddings)
- **PostGIS**: геолокация (geography/geometry)
- **uuid-ossp**: генерация UUID (используется `gen_random_uuid()`)

## Миграции

Все изменения схемы выполняются через миграции в `supabase/migrations/`:

- Формат имени: `YYYYMMDDHHMMSS_description.sql`
- Все миграции должны быть идемпотентными (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)
- Используется явное указание схемы: `public.<table_name>`
- Все SQL команды в UPPERCASE для консистентности

## Связи между основными сущностями

```
auth.users (Supabase Auth)
  ├── users (public.users)
  │   ├── profiles (public.profiles)
  │   │   ├── services (public.services)
  │   │   ├── reviews (public.reviews)
  │   │   ├── bookings (public.bookings)
  │   │   ├── orders (public.orders)
  │   │   │   ├── order_items (public.order_items)
  │   │   │   ├── order_messages (public.order_messages)
  │   │   │   └── order_attachments (public.order_attachments)
  │   │   ├── profile_locations (public.profile_locations)
  │   │   ├── animator_characters (public.animator_characters)
  │   │   ├── show_programs (public.show_programs)
  │   │   ├── quest_programs (public.quest_programs)
  │   │   ├── master_class_programs (public.master_class_programs)
  │   │   ├── photography_styles (public.photography_styles)
  │   │   └── agency_partners (public.agency_partners)
  │   ├── cart_items (public.cart_items)
  │   ├── favorites (public.favorites)
  │   ├── subscriptions (public.subscriptions)
  │   ├── notifications (public.notifications)
  │   └── notification_settings (public.notification_settings)
  ├── order_requests (public.order_requests)
  │   └── order_responses (public.order_responses)
  └── conversations (public.conversations)
      └── messages (public.messages)
```

## Примечания для разработчиков

1. **Всегда используйте `public.` префикс** при создании таблиц и обращении к ним
2. **Индексы именуются через `idx_`** для консистентности
3. **RLS включен на всех таблицах** - не забывайте создавать политики
4. **Векторные поля** требуют специальных индексов для производительности
5. **JSONB поля** (`details`, `metadata`) используются для гибкости, но старайтесь избегать излишней вложенности
6. **Временные метки** всегда `TIMESTAMPTZ` (с часовым поясом)
7. **UUID** используется для всех ID вместо SERIAL для распределенности















