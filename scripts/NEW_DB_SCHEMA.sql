-- 🗄️ НОВАЯ АРХИТЕКТУРА БД: Многомерная классификация площадок
-- Версия: 2.0
-- Дата: 20 декабря 2025

-- ============================================================================
-- 1. ENUM TYPES: Основные перечисления
-- ============================================================================

-- Основной тип деятельности (PRIMARY - обязательно, один)
CREATE TYPE primary_venue_type_enum AS ENUM (
  'active_entertainment',    -- Активные развлечения (батуты, лазертаг, скалодром)
  'quest_escape',           -- Квесты и головоломки
  'creative_studio',        -- Творческие занятия и мастер-классы
  'event_space',            -- Пространство для мероприятий
  'animal_interaction',     -- С животными и природой
  'vr_digital',             -- VR и цифровые развлечения
  'outdoor_recreation'      -- Загородный отдых
);

-- Бизнес-модель (можно несколько)
CREATE TYPE business_model_enum AS ENUM (
  'rental_only',            -- Только аренда пустого помещения
  'tickets_freeplay',       -- Билеты на свободное посещение
  'packages_turnkey',       -- Пакеты "под ключ" с программой
  'mobile_services',        -- Выездные программы (без своей площадки)
  'hybrid'                  -- Гибридная модель (несколько вариантов)
);

-- Тип помещения (один)
CREATE TYPE space_type_enum AS ENUM (
  'loft_studio',            -- Лофт / Студия
  'mall_venue',             -- Площадка в ТРЦ
  'closed_arena',           -- Закрытая арена / спортзал
  'outdoor',                -- Открытая площадка / природа
  'country_base',           -- База отдыха / загородный комплекс
  'mobile'                  -- Мобильная / выездная (нет своей площадки)
);

-- ============================================================================
-- 2. СПРАВОЧНИКИ: Активности и услуги (справочные таблицы)
-- ============================================================================

-- Справочник активностей
CREATE TABLE activity_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'active', 'creative', 'entertainment', 'other'
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Предзаполнение активностей
INSERT INTO activity_catalog (id, name_ru, name_en, category, icon) VALUES
  -- Активные
  ('trampolines', 'Батуты', 'Trampolines', 'active', '🦘'),
  ('lasertag', 'Лазертаг', 'Lasertag', 'active', '🔫'),
  ('vr_games', 'VR-игры', 'VR Games', 'active', '🥽'),
  ('climbing', 'Скалодром', 'Climbing', 'active', '🧗'),
  ('bowling', 'Боулинг', 'Bowling', 'active', '🎳'),
  ('karting', 'Картинг', 'Karting', 'active', '🏎️'),
  ('rope_park', 'Веревочный парк', 'Rope Park', 'active', '🌲'),
  ('water_park', 'Аквапарк', 'Water Park', 'active', '💦'),
  ('paintball', 'Пейнтбол', 'Paintball', 'active', '🎯'),
  ('roller_skating', 'Ролики/скейт', 'Roller Skating', 'active', '🛼'),
  ('archery', 'Стрельба из лука', 'Archery', 'active', '🏹'),
  
  -- Творческие
  ('cooking_classes', 'Кулинарные МК', 'Cooking Classes', 'creative', '👨‍🍳'),
  ('art_classes', 'Художественные МК', 'Art Classes', 'creative', '🎨'),
  ('pottery', 'Гончарное дело', 'Pottery', 'creative', '🏺'),
  ('science_shows', 'Научные шоу', 'Science Shows', 'creative', '🔬'),
  ('craft_diy', 'Рукоделие и DIY', 'Craft & DIY', 'creative', '✂️'),
  ('woodworking', 'Столярная мастерская', 'Woodworking', 'creative', '🪚'),
  
  -- Развлечения
  ('quest_room', 'Квест-комната', 'Quest Room', 'entertainment', '🔐'),
  ('board_games', 'Настольные игры', 'Board Games', 'entertainment', '🎲'),
  ('maze', 'Лабиринт', 'Maze', 'entertainment', '🌀'),
  ('ball_pit', 'Сухой бассейн с шариками', 'Ball Pit', 'entertainment', '🏐'),
  ('arcade', 'Игровые автоматы', 'Arcade', 'entertainment', '🕹️'),
  
  -- Животные
  ('horses', 'Лошади и пони', 'Horses', 'other', '🐴'),
  ('farm_animals', 'Фермерские животные', 'Farm Animals', 'other', '🐄'),
  ('petting_zoo', 'Контактный зоопарк', 'Petting Zoo', 'other', '🦙');

-- Справочник дополнительных услуг
CREATE TABLE service_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'event', 'food', 'media', 'other'
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Предзаполнение услуг
INSERT INTO service_catalog (id, name_ru, name_en, category, icon) VALUES
  -- Организация мероприятия
  ('animator', 'Аниматоры и ведущие', 'Animators', 'event', '🤹'),
  ('show_programs', 'Шоу-программы', 'Show Programs', 'event', '✨'),
  ('decoration', 'Оформление и украшение', 'Decoration', 'event', '🎈'),
  ('costume_rental', 'Аренда костюмов', 'Costume Rental', 'event', '👗'),
  
  -- Питание
  ('catering', 'Организация кейтеринга', 'Catering', 'food', '🍽️'),
  ('own_kitchen', 'Своя кухня/повар', 'Own Kitchen', 'food', '👨‍🍳'),
  ('cake_order', 'Торт на заказ', 'Cake Order', 'food', '🎂'),
  ('bring_own_food', 'Можно со своей едой', 'BYO Food', 'food', '🥪'),
  
  -- Фото/видео
  ('photographer', 'Фотограф', 'Photographer', 'media', '📷'),
  ('videographer', 'Видеооператор', 'Videographer', 'media', '🎥'),
  ('photobooth', 'Фотобудка', 'Photo Booth', 'media', '📸'),
  
  -- Прочее
  ('parking', 'Парковка', 'Parking', 'other', '🅿️'),
  ('changing_room', 'Комната для переодевания', 'Changing Room', 'other', '🚪'),
  ('wifi', 'WiFi', 'WiFi', 'other', '📶'),
  ('sound_system', 'Звуковое оборудование', 'Sound System', 'other', '🔊');

-- ============================================================================
-- 3. ОБНОВЛЕНИЕ ТАБЛИЦЫ ПРОФИЛЕЙ
-- ============================================================================

-- Добавляем новые колонки к существующей таблице profiles
ALTER TABLE profiles
  -- Основной тип (обязательно)
  ADD COLUMN primary_venue_type primary_venue_type_enum,
  
  -- Дополнительные активности (массив ID из справочника)
  ADD COLUMN activities TEXT[] DEFAULT '{}',
  
  -- Бизнес-модели (массив, минимум одна)
  ADD COLUMN business_models business_model_enum[] DEFAULT '{}',
  
  -- Тип помещения (обязательно)
  ADD COLUMN space_type space_type_enum,
  
  -- Дополнительные услуги (массив ID из справочника)
  ADD COLUMN additional_services TEXT[] DEFAULT '{}',
  
  -- Метаданные для поиска
  ADD COLUMN search_vector tsvector,
  ADD COLUMN tags TEXT[] DEFAULT '{}';  -- Для быстрого фильтра

-- Индексы для оптимизации поиска
CREATE INDEX idx_profiles_primary_type ON profiles(primary_venue_type);
CREATE INDEX idx_profiles_business_models ON profiles USING GIN(business_models);
CREATE INDEX idx_profiles_space_type ON profiles(space_type);
CREATE INDEX idx_profiles_activities ON profiles USING GIN(activities);
CREATE INDEX idx_profiles_services ON profiles USING GIN(additional_services);
CREATE INDEX idx_profiles_search_vector ON profiles USING GIN(search_vector);
CREATE INDEX idx_profiles_tags ON profiles USING GIN(tags);

-- ============================================================================
-- 4. ФУНКЦИЯ: Автоматическое обновление search_vector
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Собираем все текстовые данные для полнотекстового поиска
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.primary_venue_type::TEXT, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(array_to_string(NEW.activities, ' '), '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_vector
  BEFORE INSERT OR UPDATE OF name, description, primary_venue_type, activities, tags
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_search_vector();

-- ============================================================================
-- 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- ============================================================================

-- Функция: Получить все активности профиля с названиями
CREATE OR REPLACE FUNCTION get_profile_activities(profile_id UUID)
RETURNS TABLE(id TEXT, name_ru TEXT, icon TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ac.id, ac.name_ru, ac.icon
  FROM activity_catalog ac
  WHERE ac.id = ANY(
    SELECT unnest(activities) FROM profiles WHERE profiles.id = profile_id
  );
END;
$$ LANGUAGE plpgsql;

-- Функция: Получить все услуги профиля с названиями
CREATE OR REPLACE FUNCTION get_profile_services(profile_id UUID)
RETURNS TABLE(id TEXT, name_ru TEXT, icon TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT sc.id, sc.name_ru, sc.icon
  FROM service_catalog sc
  WHERE sc.id = ANY(
    SELECT unnest(additional_services) FROM profiles WHERE profiles.id = profile_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ПРИМЕР: Запросы для поиска
-- ============================================================================

-- Поиск по основному типу
-- SELECT * FROM profiles WHERE primary_venue_type = 'active_entertainment';

-- Поиск по активностям (есть хотя бы одна из указанных)
-- SELECT * FROM profiles WHERE activities && ARRAY['trampolines', 'lasertag'];

-- Поиск по бизнес-модели
-- SELECT * FROM profiles WHERE 'packages_turnkey' = ANY(business_models);

-- Комплексный поиск: Лофт + кулинарные МК + пакеты под ключ
-- SELECT * FROM profiles 
-- WHERE space_type = 'loft_studio'
--   AND 'cooking_classes' = ANY(activities)
--   AND 'packages_turnkey' = ANY(business_models);

-- Полнотекстовый поиск
-- SELECT *, ts_rank(search_vector, query) AS rank
-- FROM profiles, to_tsquery('russian', 'батуты & праздник') query
-- WHERE search_vector @@ query
-- ORDER BY rank DESC;

-- ============================================================================
-- 7. МИГРАЦИЯ ДАННЫХ: Из старой схемы в новую
-- ============================================================================

-- Маппинг venue_type → primary_venue_type + activities
CREATE OR REPLACE FUNCTION migrate_venue_types()
RETURNS void AS $$
BEGIN
  -- Лофты для праздников
  UPDATE profiles 
  SET 
    primary_venue_type = 'event_space',
    space_type = 'loft_studio',
    business_models = ARRAY['packages_turnkey']::business_model_enum[]
  WHERE details->>'venue_type' = 'event_loft';
  
  UPDATE profiles 
  SET 
    primary_venue_type = 'event_space',
    space_type = 'loft_studio',
    business_models = ARRAY['packages_turnkey', 'rental_only', 'hybrid']::business_model_enum[]
  WHERE details->>'venue_type' = 'event_loft_hybrid';
  
  -- Развлекательные центры
  UPDATE profiles 
  SET 
    primary_venue_type = 'active_entertainment',
    activities = ARRAY['trampolines', 'maze', 'ball_pit'],
    business_models = ARRAY['tickets_freeplay', 'packages_turnkey']::business_model_enum[],
    space_type = 'mall_venue'
  WHERE details->>'venue_type' = 'entertainment_center';
  
  -- Лазертаг
  UPDATE profiles 
  SET 
    primary_venue_type = 'active_entertainment',
    activities = ARRAY['lasertag'],
    business_models = ARRAY['packages_turnkey']::business_model_enum[],
    space_type = 'closed_arena'
  WHERE details->>'venue_type' = 'lasertag';
  
  -- Квесты
  UPDATE profiles 
  SET 
    primary_venue_type = 'quest_escape',
    activities = ARRAY['quest_room'],
    business_models = ARRAY['packages_turnkey']::business_model_enum[]
  WHERE details->>'venue_type' = 'quest_room';
  
  -- VR-арены
  UPDATE profiles 
  SET 
    primary_venue_type = 'vr_digital',
    activities = ARRAY['vr_games'],
    business_models = ARRAY['packages_turnkey']::business_model_enum[],
    space_type = 'closed_arena'
  WHERE details->>'venue_type' = 'vr_arena';
  
  -- Кулинарные студии
  UPDATE profiles 
  SET 
    primary_venue_type = 'creative_studio',
    activities = ARRAY['cooking_classes'],
    business_models = ARRAY['packages_turnkey']::business_model_enum[]
  WHERE details->>'venue_type' = 'culinary_studio';
  
  -- ... остальные типы
  
END;
$$ LANGUAGE plpgsql;

-- Запустить миграцию
-- SELECT migrate_venue_types();

-- ============================================================================
-- 8. ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS)
-- ============================================================================

-- Чтение справочников доступно всем
ALTER TABLE activity_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activity catalog is public" ON activity_catalog FOR SELECT USING (true);

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service catalog is public" ON service_catalog FOR SELECT USING (true);

-- ============================================================================
-- ГОТОВО! 🎉
-- ============================================================================

-- ПРЕИМУЩЕСТВА НОВОЙ СХЕМЫ:
-- 
-- 1. ГИБКОСТЬ:
--    - Можно выбрать несколько активностей
--    - Поддержка гибридных бизнес-моделей
-- 
-- 2. МАСШТАБИРУЕМОСТЬ:
--    - Легко добавить новую активность (INSERT в справочник)
--    - Не нужно изменять ENUM
-- 
-- 3. ПОИСК:
--    - Полнотекстовый поиск по всем полям
--    - Быстрые индексы GIN
--    - Множественные фильтры
-- 
-- 4. АНАЛИТИКА:
--    - Можно группировать по любому измерению
--    - Понятная статистика
-- 
-- 5. UX:
--    - Поставщик честно описывает свой бизнес
--    - Клиент находит именно то, что ищет





