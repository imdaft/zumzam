-- Инициализация расширений PostgreSQL
-- Этот файл выполнится автоматически при первом запуске контейнера

-- pgvector для векторного поиска
CREATE EXTENSION IF NOT EXISTS vector;

-- PostGIS для геолокации
CREATE EXTENSION IF NOT EXISTS postgis;

-- Другие полезные расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

