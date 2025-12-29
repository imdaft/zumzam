-- Добавление полей is_system и system_status в pipeline_stages

ALTER TABLE "public"."pipeline_stages" 
  ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "system_status" TEXT;



