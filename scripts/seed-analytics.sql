-- Скрипт для генерации тестовых данных аналитики
-- Запустите этот SQL в Supabase Dashboard для создания примеров данных

-- Получаем ID первого пользователя (вашего админа)
DO $$
DECLARE
    test_user_id UUID;
    test_session_id UUID := gen_random_uuid();
    test_profile_id UUID;
BEGIN
    -- Получаем первого пользователя
    SELECT id INTO test_user_id FROM public.users LIMIT 1;
    
    -- Получаем первый профиль (если есть)
    SELECT id INTO test_profile_id FROM public.profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Добавляем источники трафика
        INSERT INTO public.user_sources (user_id, session_id, source, medium, campaign, utm_source, utm_medium, utm_campaign, referrer, landing_page, device_type, browser, os)
        VALUES 
            (test_user_id, test_session_id, 'google', 'cpc', 'summer_2024', 'google', 'cpc', 'summer_2024', 'https://google.com/search?q=детские+праздники', 'https://zumzam.ru/', 'desktop', 'Chrome', 'Windows'),
            (test_user_id, gen_random_uuid(), 'yandex', 'organic', NULL, 'yandex', 'organic', NULL, 'https://yandex.ru/search/?text=аниматоры', 'https://zumzam.ru/', 'mobile', 'Safari', 'iOS'),
            (test_user_id, gen_random_uuid(), 'vk', 'social', 'birthday_promo', 'vk', 'social', 'birthday_promo', 'https://vk.com/wall-12345_678', 'https://zumzam.ru/?utm_source=vk', 'mobile', 'Chrome', 'Android');

        -- Добавляем активность пользователя
        INSERT INTO public.user_activity (user_id, session_id, action_type, action_data, page_url, device_type)
        VALUES
            -- Просмотры страниц
            (test_user_id, test_session_id, 'page_view', '{"title": "Главная", "path": "/"}', 'https://zumzam.ru/', 'desktop'),
            (test_user_id, test_session_id, 'page_view', '{"title": "Поиск", "path": "/search"}', 'https://zumzam.ru/search', 'desktop'),
            (test_user_id, test_session_id, 'page_view', '{"title": "Аниматоры", "path": "/search?category=animator"}', 'https://zumzam.ru/search?category=animator', 'desktop'),
            
            -- Поисковые запросы
            (test_user_id, test_session_id, 'search', '{"query": "аниматор на день рождения", "filters": {"category": "animator"}}', 'https://zumzam.ru/search', 'desktop'),
            (test_user_id, test_session_id, 'search', '{"query": "клоуны москва", "filters": {"city": "Москва"}}', 'https://zumzam.ru/search', 'desktop'),
            (test_user_id, test_session_id, 'search', '{"query": "квест для детей 10 лет", "filters": {"category": "quest"}}', 'https://zumzam.ru/search', 'desktop'),
            
            -- Просмотры профилей
            (test_user_id, test_session_id, 'profile_view', format('{"profile_id": "%s", "profile_slug": "test-animator", "profile_name": "Веселые клоуны"}', test_profile_id), format('https://zumzam.ru/profiles/%s', test_profile_id), 'desktop'),
            (test_user_id, test_session_id, 'profile_view', format('{"profile_id": "%s", "profile_slug": "test-studio", "profile_name": "Детская студия"}', test_profile_id), format('https://zumzam.ru/profiles/%s', test_profile_id), 'desktop'),
            
            -- Клики по услугам
            (test_user_id, test_session_id, 'service_click', '{"service_id": "service-1", "service_name": "Детский праздник 2 часа", "profile_id": "profile-1"}', 'https://zumzam.ru/profiles/test-animator', 'desktop'),
            (test_user_id, test_session_id, 'service_click', '{"service_id": "service-2", "service_name": "Аквагрим", "profile_id": "profile-1"}', 'https://zumzam.ru/profiles/test-animator', 'desktop'),
            
            -- Добавление в корзину
            (test_user_id, test_session_id, 'cart_add', '{"item_id": "item-1", "item_name": "Детский праздник 2 часа", "item_price": 5000, "profile_id": "profile-1"}', 'https://zumzam.ru/profiles/test-animator', 'desktop'),
            
            -- Скроллинг
            (test_user_id, test_session_id, 'scroll_depth', '{"depth": 25}', 'https://zumzam.ru/', 'desktop'),
            (test_user_id, test_session_id, 'scroll_depth', '{"depth": 50}', 'https://zumzam.ru/', 'desktop'),
            (test_user_id, test_session_id, 'scroll_depth', '{"depth": 75}', 'https://zumzam.ru/', 'desktop'),
            
            -- Время на странице
            (test_user_id, test_session_id, 'time_on_page', '{"time_seconds": 45, "scroll_depth": 75}', 'https://zumzam.ru/', 'desktop'),
            
            -- Клики по кнопкам
            (test_user_id, test_session_id, 'button_click', '{"text": "Найти", "type": "button"}', 'https://zumzam.ru/search', 'desktop'),
            (test_user_id, test_session_id, 'button_click', '{"text": "Добавить в корзину", "type": "button"}', 'https://zumzam.ru/profiles/test-animator', 'desktop');

        -- Добавляем интересы
        INSERT INTO public.user_interests (user_id, interest_type, interest_value, interest_score)
        VALUES
            (test_user_id, 'category', 'animator', 8),
            (test_user_id, 'category', 'quest', 3),
            (test_user_id, 'category', 'show', 2),
            (test_user_id, 'service_type', 'Детский праздник', 5),
            (test_user_id, 'service_type', 'Аквагрим', 3),
            (test_user_id, 'service_type', 'Фотосессия', 2),
            (test_user_id, 'price_range', '5000-10000', 4),
            (test_user_id, 'price_range', '10000-20000', 2)
        ON CONFLICT (user_id, interest_type, interest_value) DO NOTHING;

        RAISE NOTICE 'Тестовые данные успешно добавлены для пользователя: %', test_user_id;
    ELSE
        RAISE NOTICE 'Пользователи не найдены. Создайте хотя бы одного пользователя.';
    END IF;
END $$;

-- Обновляем материализованное представление
REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_statistics;


