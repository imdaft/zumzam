-- Миграция: добавление RLS политик для profile_activities и profile_services
-- Дата: 2024-12-22
-- Описание: Разрешаем владельцам профилей и админам управлять связями с каталогом

-- ===================================
-- RLS политики для profile_activities
-- ===================================

-- INSERT: владелец профиля или админ
DROP POLICY IF EXISTS "profile_activities_insert_owner" ON profile_activities;
CREATE POLICY "profile_activities_insert_owner"
  ON profile_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_activities.profile_id
        AND profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- UPDATE: владелец профиля или админ
DROP POLICY IF EXISTS "profile_activities_update_owner" ON profile_activities;
CREATE POLICY "profile_activities_update_owner"
  ON profile_activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_activities.profile_id
        AND profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- DELETE: владелец профиля или админ
DROP POLICY IF EXISTS "profile_activities_delete_owner" ON profile_activities;
CREATE POLICY "profile_activities_delete_owner"
  ON profile_activities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_activities.profile_id
        AND profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- ===================================
-- RLS политики для profile_services
-- ===================================

-- INSERT: владелец профиля или админ
DROP POLICY IF EXISTS "profile_services_insert_owner" ON profile_services;
CREATE POLICY "profile_services_insert_owner"
  ON profile_services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_services.profile_id
        AND profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- UPDATE: владелец профиля или админ
DROP POLICY IF EXISTS "profile_services_update_owner" ON profile_services;
CREATE POLICY "profile_services_update_owner"
  ON profile_services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_services.profile_id
        AND profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- DELETE: владелец профиля или админ
DROP POLICY IF EXISTS "profile_services_delete_owner" ON profile_services;
CREATE POLICY "profile_services_delete_owner"
  ON profile_services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_services.profile_id
        AND profiles.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
