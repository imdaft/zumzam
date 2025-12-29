-- =========================================
-- ТЕСТОВЫЕ ДАННЫЕ: Примеры профилей площадок
-- Для проверки новых типов
-- =========================================

-- Очистка тестовых данных (опционально)
-- DELETE FROM profiles WHERE display_name LIKE '%[ТЕСТ]%';

-- 1. Батутный центр
INSERT INTO profiles (
  user_id,
  slug,
  display_name,
  bio,
  city,
  address,
  category,
  details,
  is_published
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Замените на реальный user_id
  'test-trampoline-park',
  '[ТЕСТ] Батутный парк "Прыг-Скок"',
  'Крупнейший батутный центр Москвы с 15 зонами, поролоновой ямой и ниндзя-курсом',
  'Москва',
  'ул. Тестовая, 1',
  'venue',
  '{
    "subtype": "trampoline_park",
    "capacity_max": 50,
    "area_sqm": 800,
    "age_min": 5,
    "age_max": 99,
    "trampoline_zones_count": 15,
    "foam_pit": true,
    "climbing_wall": true,
    "ninja_course": true,
    "coaches_available": true,
    "parking": true,
    "parking_spots": 30,
    "wifi": true,
    "toilets": true,
    "toilets_count": 4,
    "changing_rooms": true,
    "cafe": true
  }'::jsonb,
  true
);

-- 2. VR-арена
INSERT INTO profiles (
  user_id,
  slug,
  display_name,
  bio,
  city,
  address,
  category,
  details,
  is_published
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test-vr-arena',
  '[ТЕСТ] VR-арена "Виртуальный мир"',
  'Современная VR-арена с 10 шлемами и 50+ играми для детей',
  'Санкт-Петербург',
  'пр. Тестовый, 5',
  'venue',
  '{
    "subtype": "vr_arena",
    "capacity_max": 20,
    "area_sqm": 200,
    "age_min": 7,
    "age_max": 18,
    "vr_sets_count": 10,
    "games_count": 50,
    "multiplayer_support": true,
    "game_categories": ["adventure", "sports", "educational"],
    "parking": true,
    "wifi": true,
    "toilets": true,
    "disabled_access": true
  }'::jsonb,
  true
);

-- 3. Кулинарная студия
INSERT INTO profiles (
  user_id,
  slug,
  display_name,
  bio,
  city,
  address,
  category,
  details,
  is_published
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test-culinary-studio',
  '[ТЕСТ] Кулинарная студия "Маленький шеф"',
  'Детская кулинарная студия: учим готовить пиццу, десерты и многое другое',
  'Москва',
  'ул. Кулинарная, 10',
  'venue',
  '{
    "subtype": "culinary_studio",
    "capacity_max": 15,
    "area_sqm": 120,
    "age_min": 5,
    "age_max": 14,
    "studio_type": "baking",
    "cuisine_types": ["european", "desserts"],
    "workstations": 8,
    "ingredients_included": true,
    "chef_supervision": true,
    "aprons_provided": true,
    "eat_on_site": true,
    "take_home_food": true,
    "kitchen": true,
    "kitchen_type": "full",
    "parking": false,
    "wifi": true
  }'::jsonb,
  true
);

-- 4. Аквапарк
INSERT INTO profiles (
  user_id,
  slug,
  display_name,
  bio,
  city,
  address,
  category,
  details,
  is_published
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test-water-park',
  '[ТЕСТ] Аквапарк "Волна"',
  'Семейный аквапарк с детским бассейном, горками и ленивой рекой',
  'Новосибирск',
  'ул. Водная, 25',
  'venue',
  '{
    "subtype": "water_park",
    "capacity_max": 300,
    "area_sqm": 2000,
    "age_min": 0,
    "age_max": 99,
    "facility_type": "water_park",
    "pools": {
      "kids_pool": true,
      "depth_min": 0.3,
      "depth_max": 1.8,
      "temperature": 28
    },
    "slides": {
      "count": 12,
      "types": ["kids", "family", "extreme"],
      "min_height": 100
    },
    "wave_pool": true,
    "lazy_river": true,
    "lifeguards": true,
    "parking": true,
    "parking_spots": 100,
    "cafe": true,
    "changing_rooms": true,
    "toilets": true,
    "lockers": true
  }'::jsonb,
  true
);

-- 5. Картинг-центр
INSERT INTO profiles (
  user_id,
  slug,
  display_name,
  bio,
  city,
  address,
  category,
  details,
  is_published
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test-karting',
  '[ТЕСТ] Картинг-центр "Скорость"',
  'Крытый картодром с детскими и взрослыми картами, проведение чемпионатов',
  'Екатеринбург',
  'ул. Гоночная, 7',
  'venue',
  '{
    "subtype": "karting",
    "capacity_max": 30,
    "area_sqm": 1500,
    "age_min": 7,
    "age_max": 99,
    "track_type": "indoor",
    "track_length": 450,
    "kart_types": ["kids", "adult", "electric"],
    "max_speed": 60,
    "min_height": 120,
    "championship_available": true,
    "instructor_available": true,
    "safety_equipment": true,
    "timing_system": true,
    "parking": true,
    "cafe": true,
    "toilets": true
  }'::jsonb,
  true
);

-- 6. Контактный зоопарк
INSERT INTO profiles (
  user_id,
  slug,
  display_name,
  bio,
  city,
  address,
  category,
  details,
  is_published
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test-contact-zoo',
  '[ТЕСТ] Контактный зоопарк "Дружок"',
  'Контактный зоопарк: погладь кролика, покорми козу, покатайся на пони',
  'Казань',
  'ул. Зоологическая, 15',
  'venue',
  '{
    "subtype": "zoo",
    "capacity_max": 40,
    "area_sqm": 500,
    "age_min": 2,
    "age_max": 99,
    "zoo_type": "contact_zoo",
    "animals_count": 25,
    "animal_types": ["mammals", "birds", "farm_animals"],
    "interaction": {
      "contact_allowed": true,
      "feeding_allowed": true,
      "pony_rides": true
    },
    "guided_tours": true,
    "parking": true,
    "toilets": true,
    "cafe": false,
    "gift_shop": true
  }'::jsonb,
  true
);

-- Проверка созданных профилей
SELECT 
  display_name,
  city,
  details->>'subtype' as venue_type,
  get_venue_type_label(details->>'subtype') as type_label_ru,
  is_published
FROM profiles 
WHERE display_name LIKE '%[ТЕСТ]%'
ORDER BY created_at DESC;

-- Статистика по типам (включая тестовые)
SELECT * FROM venue_types_stats;

COMMENT ON TABLE profiles IS 'Добавлено 6 тестовых профилей для новых типов площадок';

