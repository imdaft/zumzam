-- Миграция: Таблица для хранения Push-подписок
-- Дата: 28 декабря 2025
-- Описание: Сохраняет Web Push API подписки пользователей

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Комментарии
COMMENT ON TABLE push_subscriptions IS 'Web Push API подписки для браузерных уведомлений';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push endpoint от браузера';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'Public key для шифрования (p256dh)';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Authentication secret';

