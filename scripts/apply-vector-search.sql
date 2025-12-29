-- Скрипт для применения векторного поиска к Yandex Cloud PostgreSQL
-- Дата: 2025-01-29
-- Применить через: psql или pgAdmin

-- =====================================================
-- 1. ПРОВЕРКА И УСТАНОВКА РАСШИРЕНИЯ pgvector
-- =====================================================

-- Проверяем, установлено ли расширение vector
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE NOTICE 'Расширение vector не установлено. Устанавливаем...';
    CREATE EXTENSION vector;
  ELSE
    RAISE NOTICE 'Расширение vector уже установлено';
  END IF;
END $$;

-- =====================================================
-- 2. ФУНКЦИЯ ВЕКТОРНОГО ПОИСКА
-- =====================================================

CREATE OR REPLACE FUNCTION search_profiles_by_vector(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 8,
  filter_category text DEFAULT NULL,
  filter_city text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  display_name text,
  bio text,
  description text,
  category text,
  city text,
  rating numeric,
  reviews_count int,
  price_range text,
  cover_photo text,
  photos text[],
  videos text[],
  details jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.display_name,
    p.bio,
    p.description,
    p.category::text,
    p.city,
    p.rating,
    p.reviews_count,
    p.price_range,
    p.cover_photo,
    p.photos,
    p.videos,
    p.details,
    (1 - (p.embedding <=> query_embedding))::float AS similarity
  FROM profiles p
  WHERE 
    p.is_published = true
    AND p.embedding IS NOT NULL
    AND (1 - (p.embedding <=> query_embedding)) >= match_threshold
    AND (filter_category IS NULL OR p.category::text = filter_category)
    AND (filter_city IS NULL OR p.city = filter_city)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- 3. ИНДЕКС ДЛЯ ВЕКТОРНОГО ПОИСКА
-- =====================================================

-- Удаляем старый индекс если существует
DROP INDEX IF EXISTS idx_profiles_embedding_vector;

-- Создаем индекс для ускорения векторного поиска
-- Используем ivfflat для больших датасетов
CREATE INDEX idx_profiles_embedding_vector 
ON profiles 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =====================================================
-- 4. КОММЕНТАРИИ
-- =====================================================

COMMENT ON FUNCTION search_profiles_by_vector IS 
'Векторный поиск профилей по embedding с использованием косинусного расстояния. 
Используется для AI-ассистента и семантического поиска.
Параметры:
- query_embedding: вектор запроса (768 размерность от Gemini text-embedding-004)
- match_threshold: минимальная схожесть (0.0-1.0, по умолчанию 0.3)
- match_count: максимальное количество результатов (по умолчанию 8)
- filter_category: фильтр по категории (опционально)
- filter_city: фильтр по городу (опционально)';

COMMENT ON INDEX idx_profiles_embedding_vector IS 
'Индекс для ускорения векторного поиска через косинусное расстояние';

-- =====================================================
-- 5. ПРОВЕРКА
-- =====================================================

-- Проверяем, что функция создана
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc 
WHERE proname = 'search_profiles_by_vector';

-- Проверяем, что индекс создан
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE indexname = 'idx_profiles_embedding_vector';

-- Проверяем количество профилей с embedding
SELECT 
  COUNT(*) AS total_profiles,
  COUNT(embedding) AS profiles_with_embedding,
  COUNT(*) FILTER (WHERE is_published = true AND embedding IS NOT NULL) AS searchable_profiles
FROM profiles;

-- =====================================================
-- ГОТОВО!
-- =====================================================

RAISE NOTICE 'Векторный поиск успешно настроен!';

