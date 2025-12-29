-- Миграция: Создание таблицы notifications
-- Дата: 28 декабря 2025
-- Описание: Таблица для хранения уведомлений пользователей

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'order', 'message', 'request', 'system', 'response'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL для перехода (action_url в фронтенде)
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;

-- Комментарий
COMMENT ON TABLE notifications IS 'Уведомления пользователей о событиях в системе';
COMMENT ON COLUMN notifications.type IS 'Тип уведомления: order, message, request, system, response';
COMMENT ON COLUMN notifications.link IS 'URL для перехода (маппится на action_url в API)';
COMMENT ON COLUMN notifications.read IS 'Флаг прочтения (дублирует read_at для удобства запросов)';

