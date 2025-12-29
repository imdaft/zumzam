-- Миграция: Добавление поля sender_role в таблицу messages
-- Дата: 28 декабря 2025
-- Описание: Добавляет роль отправителя для правильной идентификации в чатах заказов

-- Добавляем поле sender_role
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_role TEXT CHECK (sender_role IN ('client', 'provider'));

-- Индекс для фильтрации по роли
CREATE INDEX IF NOT EXISTS idx_messages_sender_role ON messages(sender_role);

-- Комментарий
COMMENT ON COLUMN messages.sender_role IS 'Роль отправителя сообщения: client или provider (для чатов заказов)';

-- Обновляем существующие сообщения (опционально, если нужно заполнить NULL значения)
-- Это можно пропустить, если старые сообщения не критичны
-- UPDATE messages SET sender_role = 'client' WHERE sender_role IS NULL AND sender_id IN (SELECT id FROM users WHERE role = 'client');
-- UPDATE messages SET sender_role = 'provider' WHERE sender_role IS NULL AND sender_id IN (SELECT id FROM users WHERE role = 'provider');

