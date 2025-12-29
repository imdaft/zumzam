-- Миграция: Расширение таблицы services до полной схемы
-- Добавляем недостающие поля из старой базы Supabase

ALTER TABLE services ADD COLUMN IF NOT EXISTS price_from DECIMAL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_to DECIMAL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS age_from INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS age_to INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_participants INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS includes TEXT[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS booking_info TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_is_featured ON services(is_featured);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(sort_order);
