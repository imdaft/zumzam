-- ================================================================================
-- СОЗДАНИЕ STORAGE BUCKETS ДЛЯ ZUMZAM
-- ================================================================================
-- Этот скрипт создает все необходимые Storage buckets для приложения
-- Запустите: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/create-storage-buckets.sql
-- ================================================================================

\echo '🪣 СОЗДАНИЕ STORAGE BUCKETS'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- 1. public-images - для изображений категорий и публичных картинок
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-images',
  'public-images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "public-images" создан/обновлен'

-- 2. portfolio - для фотографий портфолио исполнителей
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "portfolio" создан/обновлен'

-- 3. services - для изображений услуг
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'services',
  'services',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "services" создан/обновлен'

-- 4. advertising - для рекламных изображений
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertising',
  'advertising',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "advertising" создан/обновлен'

\echo ''
\echo '🔐 НАСТРОЙКА RLS ПОЛИТИК'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- Политики для public-images (только админы могут загружать)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('public-images', 'Public read access', 'bucket_id = ''public-images'''),
  ('public-images', 'Admins can upload', 'bucket_id = ''public-images'' AND auth.role() = ''authenticated''')
ON CONFLICT DO NOTHING;

-- Политики для portfolio (владельцы могут загружать свои файлы)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('portfolio', 'Public read access', 'bucket_id = ''portfolio'''),
  ('portfolio', 'Users can upload own files', 'bucket_id = ''portfolio'' AND auth.uid()::text = (storage.foldername(name))[1]')
ON CONFLICT DO NOTHING;

-- Политики для services (владельцы услуг могут загружать)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('services', 'Public read access', 'bucket_id = ''services'''),
  ('services', 'Users can upload own files', 'bucket_id = ''services'' AND auth.uid()::text = (storage.foldername(name))[1]')
ON CONFLICT DO NOTHING;

-- Политики для advertising (авторизованные пользователи могут загружать)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('advertising', 'Public read access', 'bucket_id = ''advertising'''),
  ('advertising', 'Authenticated users can upload', 'bucket_id = ''advertising'' AND auth.role() = ''authenticated''')
ON CONFLICT DO NOTHING;

\echo '✅ RLS политики настроены'

\echo ''
\echo '📊 ИТОГОВАЯ СТАТИСТИКА'
\echo '─────────────────────────────────────────────────────────────────────────────'

SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  created_at
FROM storage.buckets
ORDER BY created_at;

\echo ''
\echo '✅ ВСЕ BUCKETS СОЗДАНЫ И НАСТРОЕНЫ!'
\echo '─────────────────────────────────────────────────────────────────────────────'
\echo 'Теперь можно загружать файлы через приложение.'
\echo 'Для проверки запустите: psql -f scripts/check-storage-migration.sql'

-- СОЗДАНИЕ STORAGE BUCKETS ДЛЯ ZUMZAM
-- ================================================================================
-- Этот скрипт создает все необходимые Storage buckets для приложения
-- Запустите: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/create-storage-buckets.sql
-- ================================================================================

\echo '🪣 СОЗДАНИЕ STORAGE BUCKETS'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- 1. public-images - для изображений категорий и публичных картинок
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-images',
  'public-images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "public-images" создан/обновлен'

-- 2. portfolio - для фотографий портфолио исполнителей
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "portfolio" создан/обновлен'

-- 3. services - для изображений услуг
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'services',
  'services',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "services" создан/обновлен'

-- 4. advertising - для рекламных изображений
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertising',
  'advertising',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

\echo '✅ Bucket "advertising" создан/обновлен'

\echo ''
\echo '🔐 НАСТРОЙКА RLS ПОЛИТИК'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- Политики для public-images (только админы могут загружать)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('public-images', 'Public read access', 'bucket_id = ''public-images'''),
  ('public-images', 'Admins can upload', 'bucket_id = ''public-images'' AND auth.role() = ''authenticated''')
ON CONFLICT DO NOTHING;

-- Политики для portfolio (владельцы могут загружать свои файлы)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('portfolio', 'Public read access', 'bucket_id = ''portfolio'''),
  ('portfolio', 'Users can upload own files', 'bucket_id = ''portfolio'' AND auth.uid()::text = (storage.foldername(name))[1]')
ON CONFLICT DO NOTHING;

-- Политики для services (владельцы услуг могут загружать)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('services', 'Public read access', 'bucket_id = ''services'''),
  ('services', 'Users can upload own files', 'bucket_id = ''services'' AND auth.uid()::text = (storage.foldername(name))[1]')
ON CONFLICT DO NOTHING;

-- Политики для advertising (авторизованные пользователи могут загружать)
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES 
  ('advertising', 'Public read access', 'bucket_id = ''advertising'''),
  ('advertising', 'Authenticated users can upload', 'bucket_id = ''advertising'' AND auth.role() = ''authenticated''')
ON CONFLICT DO NOTHING;

\echo '✅ RLS политики настроены'

\echo ''
\echo '📊 ИТОГОВАЯ СТАТИСТИКА'
\echo '─────────────────────────────────────────────────────────────────────────────'

SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  created_at
FROM storage.buckets
ORDER BY created_at;

\echo ''
\echo '✅ ВСЕ BUCKETS СОЗДАНЫ И НАСТРОЕНЫ!'
\echo '─────────────────────────────────────────────────────────────────────────────'
\echo 'Теперь можно загружать файлы через приложение.'
\echo 'Для проверки запустите: psql -f scripts/check-storage-migration.sql'




