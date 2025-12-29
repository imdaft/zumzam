-- ================================================================================
-- ДОБАВЛЕНИЕ ПОЛЕЙ В ТАБЛИЦУ master_class_programs
-- ================================================================================
-- Добавляем поля для хранения дополнительных параметров мастер-классов
-- ================================================================================

\echo '📝 ДОБАВЛЕНИЕ ПОЛЕЙ В master_class_programs'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- Добавляем поля для количества участников
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS min_participants integer,
ADD COLUMN IF NOT EXISTS max_participants integer;

-- Добавляем поля для материалов
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS materials_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS materials_list text[] DEFAULT '{}';

-- Добавляем поля для дополнительных опций
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS take_home boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate boolean DEFAULT false;

-- Добавляем поле для категорий (массив строк)
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Добавляем поле для видео URL
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS video_url text;

\echo '✅ Поля добавлены'

\echo ''
\echo '📊 ОБНОВЛЁННАЯ СТРУКТУРА ТАБЛИЦЫ'
\echo '─────────────────────────────────────────────────────────────────────────────'

\d master_class_programs;

\echo ''
\echo '✅ МИГРАЦИЯ ЗАВЕРШЕНА!'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- ДОБАВЛЕНИЕ ПОЛЕЙ В ТАБЛИЦУ master_class_programs
-- ================================================================================
-- Добавляем поля для хранения дополнительных параметров мастер-классов
-- ================================================================================

\echo '📝 ДОБАВЛЕНИЕ ПОЛЕЙ В master_class_programs'
\echo '─────────────────────────────────────────────────────────────────────────────'

-- Добавляем поля для количества участников
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS min_participants integer,
ADD COLUMN IF NOT EXISTS max_participants integer;

-- Добавляем поля для материалов
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS materials_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS materials_list text[] DEFAULT '{}';

-- Добавляем поля для дополнительных опций
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS take_home boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate boolean DEFAULT false;

-- Добавляем поле для категорий (массив строк)
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Добавляем поле для видео URL
ALTER TABLE master_class_programs 
ADD COLUMN IF NOT EXISTS video_url text;

\echo '✅ Поля добавлены'

\echo ''
\echo '📊 ОБНОВЛЁННАЯ СТРУКТУРА ТАБЛИЦЫ'
\echo '─────────────────────────────────────────────────────────────────────────────'

\d master_class_programs;

\echo ''
\echo '✅ МИГРАЦИЯ ЗАВЕРШЕНА!'
\echo '─────────────────────────────────────────────────────────────────────────────'




