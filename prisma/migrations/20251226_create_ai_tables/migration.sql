-- CreateTable: ai_settings
CREATE TABLE IF NOT EXISTS "public"."ai_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "api_key" TEXT,
    "base_url" TEXT,
    "model_type" TEXT DEFAULT 'chat',
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT false,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ai_task_models
CREATE TABLE IF NOT EXISTS "public"."ai_task_models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_key" TEXT NOT NULL,
    "task_name" TEXT NOT NULL,
    "ai_setting_id" UUID,
    "is_enabled" BOOLEAN DEFAULT true,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_task_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ai_settings_active_unique" ON "public"."ai_settings"("is_active") WHERE "is_active" = true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_ai_settings_provider" ON "public"."ai_settings"("provider");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_ai_settings_active" ON "public"."ai_settings"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ai_task_models_task_key_key" ON "public"."ai_task_models"("task_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_ai_task_models_task_key" ON "public"."ai_task_models"("task_key");

-- AddForeignKey
ALTER TABLE "public"."ai_task_models" ADD CONSTRAINT "ai_task_models_ai_setting_id_fkey" 
    FOREIGN KEY ("ai_setting_id") REFERENCES "public"."ai_settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default AI tasks
INSERT INTO "public"."ai_task_models" ("task_key", "task_name", "is_enabled", "settings") VALUES
    ('chat', 'AI Чат', true, '{}'),
    ('transcribe', 'Транскрибация аудио', true, '{}'),
    ('request_draft', 'Генерация черновика заявки', true, '{}'),
    ('embeddings', 'Генерация эмбеддингов', true, '{}')
ON CONFLICT (task_key) DO NOTHING;



