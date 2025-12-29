-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."pages_status" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "section" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "desktop_ready" BOOLEAN NOT NULL DEFAULT false,
    "mobile_ready" BOOLEAN NOT NULL DEFAULT false,
    "tablet_ready" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "pages_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_pages_status_section" ON "public"."pages_status"("section");
CREATE INDEX IF NOT EXISTS "idx_pages_status_priority" ON "public"."pages_status"("priority");

-- Seed initial data
INSERT INTO "public"."pages_status" ("section", "name", "path", "desktop_ready", "mobile_ready", "tablet_ready", "priority") VALUES
('admin', 'Админ панель', '/admin', true, false, false, 100),
('admin', 'Пользователи', '/admin/users', true, false, false, 90),
('admin', 'Профили', '/admin/profiles', true, false, false, 90),
('admin', 'Заявки на подтверждение', '/admin/claim-requests', true, false, false, 85),
('admin', 'Отзывы', '/admin/reviews', true, false, false, 80),
('admin', 'Ошибки', '/admin/errors', true, false, false, 75),
('admin', 'AI настройки', '/admin/ai-settings', true, false, false, 70),
('admin', 'Статусы страниц', '/admin/pages-status', true, false, false, 65),
('dashboard', 'Главная', '/', true, true, true, 100),
('dashboard', 'Профиль', '/profile', true, true, true, 95),
('dashboard', 'Мои заявки', '/my-requests', true, true, true, 90),
('dashboard', 'Уведомления', '/notifications', true, true, true, 85),
('dashboard', 'Аналитика', '/analytics', true, false, false, 80),
('dashboard', 'CRM', '/crm', true, false, false, 75),
('dashboard', 'Реклама', '/advertising', true, false, false, 70),
('public', 'Доска заявок', '/board', true, true, true, 100),
('public', 'Каталог профилей', '/profiles', true, true, true, 95),
('public', 'Страница профиля', '/profiles/[slug]', true, true, true, 90)
ON CONFLICT DO NOTHING;



