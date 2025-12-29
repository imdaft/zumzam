-- Создание таблицы для персонажей аниматоров
CREATE TABLE IF NOT EXISTS animator_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Основная информация
  name VARCHAR(255) NOT NULL, -- Название персонажа (например, "Человек-паук")
  description TEXT, -- Описание программы с этим персонажем
  
  -- Медиа
  photos TEXT[] DEFAULT '{}', -- Массив URL фотографий
  video_url TEXT, -- Ссылка на видео (YouTube, Rutube, VK)
  
  -- Параметры программы
  age_range TEXT, -- Возрастная категория: '3-5', '5-7', '7-10', '10-14', 'universal'
  program_types TEXT[] DEFAULT '{}', -- Типы программы: ['interactive', 'show', 'quest', 'master_class', 'games']
  work_format TEXT, -- Формат работы: 'mobile', 'studio', 'both'
  
  -- Статус
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_animator_characters_profile_id ON animator_characters(profile_id);
CREATE INDEX IF NOT EXISTS idx_animator_characters_is_active ON animator_characters(is_active);

-- RLS (Row Level Security)
ALTER TABLE animator_characters ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать активные персонажи
CREATE POLICY "Anyone can view active characters"
  ON animator_characters FOR SELECT
  USING (is_active = true);

-- Политика: владелец профиля может управлять своими персонажами
CREATE POLICY "Profile owner can manage their characters"
  ON animator_characters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = animator_characters.profile_id
        AND profiles.user_id = auth.uid()
    )
  );

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_animator_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_animator_characters_updated_at
  BEFORE UPDATE ON animator_characters
  FOR EACH ROW
  EXECUTE FUNCTION update_animator_characters_updated_at();

COMMENT ON TABLE animator_characters IS 'Персонажи и программы аниматоров';
COMMENT ON COLUMN animator_characters.name IS 'Название персонажа (например, Человек-паук, Эльза)';
COMMENT ON COLUMN animator_characters.description IS 'Описание программы с этим персонажем';
COMMENT ON COLUMN animator_characters.photos IS 'Массив URL фотографий персонажа';
COMMENT ON COLUMN animator_characters.age_range IS 'Возрастная категория: 3-5, 5-7, 7-10, 10-14, universal';
COMMENT ON COLUMN animator_characters.program_types IS 'Типы программы: interactive, show, quest, master_class, games';
COMMENT ON COLUMN animator_characters.work_format IS 'Формат работы: mobile (выездной), studio (в студии), both (оба)';




