-- Изменение таблицы pipelines: user_id -> profile_id

-- 1. Удаляем внешний ключ на users
ALTER TABLE "public"."pipelines" DROP CONSTRAINT IF EXISTS "pipelines_user_id_fkey";

-- 2. Удаляем индекс
DROP INDEX IF EXISTS "public"."idx_pipelines_user";

-- 3. Переименовываем колонку user_id в profile_id
ALTER TABLE "public"."pipelines" RENAME COLUMN "user_id" TO "profile_id";

-- 4. Добавляем новые колонки
ALTER TABLE "public"."pipelines" 
  ADD COLUMN IF NOT EXISTS "position" INTEGER,
  ADD COLUMN IF NOT EXISTS "card_settings" JSONB;

-- 5. Создаем новый внешний ключ на profiles
ALTER TABLE "public"."pipelines" 
  ADD CONSTRAINT "pipelines_profile_id_fkey" 
  FOREIGN KEY ("profile_id") 
  REFERENCES "public"."profiles"("id") 
  ON DELETE CASCADE 
  ON UPDATE NO ACTION;

-- 6. Создаем новый индекс
CREATE INDEX IF NOT EXISTS "idx_pipelines_profile" ON "public"."pipelines"("profile_id");



