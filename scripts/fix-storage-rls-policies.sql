-- ================================================================================
-- СОЗДАНИЕ RLS ПОЛИТИК ДЛЯ SUPABASE STORAGE
-- ================================================================================
-- Исправление: создаем политики через CREATE POLICY (правильный синтаксис)
-- ================================================================================

\echo '🔐 СОЗДАНИЕ RLS ПОЛИТИК ДЛЯ STORAGE'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- ==================== PUBLIC-IMAGES ====================
-- Все могут читать, authenticated могут загружать

-- SELECT (чтение)
DROP POLICY IF EXISTS "public-images: public read" ON storage.objects;
CREATE POLICY "public-images: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-images');

-- INSERT (загрузка)
DROP POLICY IF EXISTS "public-images: authenticated upload" ON storage.objects;
CREATE POLICY "public-images: authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-images');

-- UPDATE (обновление)
DROP POLICY IF EXISTS "public-images: authenticated update" ON storage.objects;
CREATE POLICY "public-images: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-images');

-- DELETE (удаление)
DROP POLICY IF EXISTS "public-images: authenticated delete" ON storage.objects;
CREATE POLICY "public-images: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-images');

\echo '✅ Политики для public-images созданы'

-- ==================== PORTFOLIO ====================
-- Все могут читать, пользователи могут управлять файлами в своей папке

-- SELECT (чтение)
DROP POLICY IF EXISTS "portfolio: public read" ON storage.objects;
CREATE POLICY "portfolio: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio');

-- INSERT (загрузка в свою папку)
DROP POLICY IF EXISTS "portfolio: user upload own" ON storage.objects;
CREATE POLICY "portfolio: user upload own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE (обновление своих файлов)
DROP POLICY IF EXISTS "portfolio: user update own" ON storage.objects;
CREATE POLICY "portfolio: user update own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE (удаление своих файлов)
DROP POLICY IF EXISTS "portfolio: user delete own" ON storage.objects;
CREATE POLICY "portfolio: user delete own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

\echo '✅ Политики для portfolio созданы'

-- ==================== SERVICES ====================
-- Все могут читать, пользователи могут управлять файлами в своей папке

-- SELECT (чтение)
DROP POLICY IF EXISTS "services: public read" ON storage.objects;
CREATE POLICY "services: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');

-- INSERT (загрузка в свою папку)
DROP POLICY IF EXISTS "services: user upload own" ON storage.objects;
CREATE POLICY "services: user upload own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE (обновление своих файлов)
DROP POLICY IF EXISTS "services: user update own" ON storage.objects;
CREATE POLICY "services: user update own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE (удаление своих файлов)
DROP POLICY IF EXISTS "services: user delete own" ON storage.objects;
CREATE POLICY "services: user delete own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

\echo '✅ Политики для services созданы'

-- ==================== ADVERTISING ====================
-- Все могут читать, authenticated могут загружать

-- SELECT (чтение)
DROP POLICY IF EXISTS "advertising: public read" ON storage.objects;
CREATE POLICY "advertising: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'advertising');

-- INSERT (загрузка)
DROP POLICY IF EXISTS "advertising: authenticated upload" ON storage.objects;
CREATE POLICY "advertising: authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'advertising');

-- UPDATE (обновление)
DROP POLICY IF EXISTS "advertising: authenticated update" ON storage.objects;
CREATE POLICY "advertising: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'advertising');

-- DELETE (удаление)
DROP POLICY IF EXISTS "advertising: authenticated delete" ON storage.objects;
CREATE POLICY "advertising: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'advertising');

\echo '✅ Политики для advertising созданы'

\echo ''
\echo '📊 ПРОВЕРКА СОЗДАННЫХ ПОЛИТИК'
\echo '─────────────────────────────────────────────────────────────────────────────'

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

\echo ''
\echo '✅ ВСЕ RLS ПОЛИТИКИ СОЗДАНЫ!'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- СОЗДАНИЕ RLS ПОЛИТИК ДЛЯ SUPABASE STORAGE
-- ================================================================================
-- Исправление: создаем политики через CREATE POLICY (правильный синтаксис)
-- ================================================================================

\echo '🔐 СОЗДАНИЕ RLS ПОЛИТИК ДЛЯ STORAGE'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- ==================== PUBLIC-IMAGES ====================
-- Все могут читать, authenticated могут загружать

-- SELECT (чтение)
DROP POLICY IF EXISTS "public-images: public read" ON storage.objects;
CREATE POLICY "public-images: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-images');

-- INSERT (загрузка)
DROP POLICY IF EXISTS "public-images: authenticated upload" ON storage.objects;
CREATE POLICY "public-images: authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-images');

-- UPDATE (обновление)
DROP POLICY IF EXISTS "public-images: authenticated update" ON storage.objects;
CREATE POLICY "public-images: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-images');

-- DELETE (удаление)
DROP POLICY IF EXISTS "public-images: authenticated delete" ON storage.objects;
CREATE POLICY "public-images: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-images');

\echo '✅ Политики для public-images созданы'

-- ==================== PORTFOLIO ====================
-- Все могут читать, пользователи могут управлять файлами в своей папке

-- SELECT (чтение)
DROP POLICY IF EXISTS "portfolio: public read" ON storage.objects;
CREATE POLICY "portfolio: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portfolio');

-- INSERT (загрузка в свою папку)
DROP POLICY IF EXISTS "portfolio: user upload own" ON storage.objects;
CREATE POLICY "portfolio: user upload own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE (обновление своих файлов)
DROP POLICY IF EXISTS "portfolio: user update own" ON storage.objects;
CREATE POLICY "portfolio: user update own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE (удаление своих файлов)
DROP POLICY IF EXISTS "portfolio: user delete own" ON storage.objects;
CREATE POLICY "portfolio: user delete own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

\echo '✅ Политики для portfolio созданы'

-- ==================== SERVICES ====================
-- Все могут читать, пользователи могут управлять файлами в своей папке

-- SELECT (чтение)
DROP POLICY IF EXISTS "services: public read" ON storage.objects;
CREATE POLICY "services: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');

-- INSERT (загрузка в свою папку)
DROP POLICY IF EXISTS "services: user upload own" ON storage.objects;
CREATE POLICY "services: user upload own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE (обновление своих файлов)
DROP POLICY IF EXISTS "services: user update own" ON storage.objects;
CREATE POLICY "services: user update own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE (удаление своих файлов)
DROP POLICY IF EXISTS "services: user delete own" ON storage.objects;
CREATE POLICY "services: user delete own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'services' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

\echo '✅ Политики для services созданы'

-- ==================== ADVERTISING ====================
-- Все могут читать, authenticated могут загружать

-- SELECT (чтение)
DROP POLICY IF EXISTS "advertising: public read" ON storage.objects;
CREATE POLICY "advertising: public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'advertising');

-- INSERT (загрузка)
DROP POLICY IF EXISTS "advertising: authenticated upload" ON storage.objects;
CREATE POLICY "advertising: authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'advertising');

-- UPDATE (обновление)
DROP POLICY IF EXISTS "advertising: authenticated update" ON storage.objects;
CREATE POLICY "advertising: authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'advertising');

-- DELETE (удаление)
DROP POLICY IF EXISTS "advertising: authenticated delete" ON storage.objects;
CREATE POLICY "advertising: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'advertising');

\echo '✅ Политики для advertising созданы'

\echo ''
\echo '📊 ПРОВЕРКА СОЗДАННЫХ ПОЛИТИК'
\echo '─────────────────────────────────────────────────────────────────────────────'

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

\echo ''
\echo '✅ ВСЕ RLS ПОЛИТИКИ СОЗДАНЫ!'
\echo '─────────────────────────────────────────────────────────────────────────────'




