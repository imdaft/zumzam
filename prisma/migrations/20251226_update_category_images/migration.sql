-- Обновляем таблицу category_images для поддержки адаптивных изображений
-- Добавляем поля для desktop/mobile/original версий и crop данных

-- Переименовываем старое поле category в category_id для соответствия Supabase
ALTER TABLE "public"."category_images" 
  RENAME COLUMN "category" TO "category_id";

-- Переименовываем старое поле image_url в desktop_image_url
ALTER TABLE "public"."category_images" 
  RENAME COLUMN "image_url" TO "desktop_image_url";

-- Удаляем RLS политики которые зависят от старых полей
DROP POLICY IF EXISTS "category_images_select_active" ON "public"."category_images";

-- Удаляем старые ненужные поля
ALTER TABLE "public"."category_images" 
  DROP COLUMN IF EXISTS "title" CASCADE,
  DROP COLUMN IF EXISTS "description" CASCADE,
  DROP COLUMN IF EXISTS "display_order" CASCADE,
  DROP COLUMN IF EXISTS "active" CASCADE;

-- Добавляем новые поля
ALTER TABLE "public"."category_images" 
  ADD COLUMN IF NOT EXISTS "mobile_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "original_image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "desktop_crop" JSONB,
  ADD COLUMN IF NOT EXISTS "mobile_crop" JSONB,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- Обновляем индекс
DROP INDEX IF EXISTS "idx_category_images_category";
CREATE INDEX IF NOT EXISTS "idx_category_images_category_id" ON "public"."category_images"("category_id");

-- Обновляем unique constraint
ALTER TABLE "public"."category_images" 
  DROP CONSTRAINT IF EXISTS "category_images_category_key";
ALTER TABLE "public"."category_images" 
  ADD CONSTRAINT "category_images_category_id_key" UNIQUE ("category_id");

