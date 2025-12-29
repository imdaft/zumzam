-- =====================================================
-- СОЗДАНИЕ ТЕСТОВОГО КЛИЕНТА
-- =====================================================

-- Вариант 1: Установить ТВОЕМУ аккаунту роль admin
-- Замени на свой email!
UPDATE public.users
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'твой-email@example.com'
);

-- После этого ты сможешь переключаться между режимами Клиент/Сервис

-- =====================================================
-- Вариант 2: Создать отдельного тестового клиента
-- =====================================================

-- ВАЖНО: Это можно сделать только через Supabase Dashboard
-- Authentication → Users → Invite User

-- Или создай нового пользователя через регистрацию на сайте,
-- а потом установи ему роль 'client':

-- UPDATE public.users
-- SET role = 'client'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'test-client@example.com'
-- );

-- =====================================================
-- Проверка ролей
-- =====================================================
SELECT 
  au.email,
  u.role,
  u.full_name,
  u.created_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
ORDER BY u.created_at DESC;


