-- ================================================================================
-- ИСПРАВЛЕНИЕ СХЕМ ВСЕХ ТАБЛИЦ ДЛЯ ИНДИВИДУАЛЬНЫХ БЛОКОВ
-- ================================================================================
-- Добавляем недостающие поля во все таблицы программ/персонажей
-- ================================================================================

\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  1. SHOW_PROGRAMS'
\echo '════════════════════════════════════════════════════════════════════════════'

ALTER TABLE show_programs 
ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS performers_count integer,
ADD COLUMN IF NOT EXISTS requires_sound boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stage_requirements text,
ADD COLUMN IF NOT EXISTS requires_light boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS additional_requirements text,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}';

-- Переименовываем поля для консистентности с мастер-классами
-- (если нужно, можно оставить старые названия)

\echo '✅ show_programs обновлена'

\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  2. QUEST_PROGRAMS'
\echo '════════════════════════════════════════════════════════════════════════════'

ALTER TABLE quest_programs 
ADD COLUMN IF NOT EXISTS themes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS activity_type text,
ADD COLUMN IF NOT EXISTS props_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS actor_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS venue_requirements text,
ADD COLUMN IF NOT EXISTS video_url text;

\echo '✅ quest_programs обновлена'

\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  3. ANIMATOR_CHARACTERS'
\echo '════════════════════════════════════════════════════════════════════════════'

ALTER TABLE animator_characters 
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS program_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS work_format text;

\echo '✅ animator_characters обновлена'

\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  ИТОГОВЫЕ СХЕМЫ'
\echo '════════════════════════════════════════════════════════════════════════════'

\d show_programs;
\echo ''
\d quest_programs;
\echo ''
\d animator_characters;

\echo ''
\echo '✅ ВСЕ МИГРАЦИИ ЗАВЕРШЕНЫ!'
\echo '════════════════════════════════════════════════════════════════════════════'

-- ИСПРАВЛЕНИЕ СХЕМ ВСЕХ ТАБЛИЦ ДЛЯ ИНДИВИДУАЛЬНЫХ БЛОКОВ
-- ================================================================================
-- Добавляем недостающие поля во все таблицы программ/персонажей
-- ================================================================================

\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  1. SHOW_PROGRAMS'
\echo '════════════════════════════════════════════════════════════════════════════'

ALTER TABLE show_programs 
ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS performers_count integer,
ADD COLUMN IF NOT EXISTS requires_sound boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stage_requirements text,
ADD COLUMN IF NOT EXISTS requires_light boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS additional_requirements text,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}';

-- Переименовываем поля для консистентности с мастер-классами
-- (если нужно, можно оставить старые названия)

\echo '✅ show_programs обновлена'

\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  2. QUEST_PROGRAMS'
\echo '════════════════════════════════════════════════════════════════════════════'

ALTER TABLE quest_programs 
ADD COLUMN IF NOT EXISTS themes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS activity_type text,
ADD COLUMN IF NOT EXISTS props_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS actor_included boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS venue_requirements text,
ADD COLUMN IF NOT EXISTS video_url text;

\echo '✅ quest_programs обновлена'

\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  3. ANIMATOR_CHARACTERS'
\echo '════════════════════════════════════════════════════════════════════════════'

ALTER TABLE animator_characters 
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS program_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS work_format text;

\echo '✅ animator_characters обновлена'

\echo ''
\echo '════════════════════════════════════════════════════════════════════════════'
\echo '  ИТОГОВЫЕ СХЕМЫ'
\echo '════════════════════════════════════════════════════════════════════════════'

\d show_programs;
\echo ''
\d quest_programs;
\echo ''
\d animator_characters;

\echo ''
\echo '✅ ВСЕ МИГРАЦИИ ЗАВЕРШЕНЫ!'
\echo '════════════════════════════════════════════════════════════════════════════'




