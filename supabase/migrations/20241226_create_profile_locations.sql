-- Создание таблицы profile_locations
CREATE TABLE IF NOT EXISTS public.profile_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  city TEXT NOT NULL,
  address TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  
  geo_location GEOGRAPHY,
  
  is_main BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  
  details JSONB DEFAULT '{}'::JSONB,
  
  yandex_url TEXT,
  yandex_rating NUMERIC,
  yandex_review_count INTEGER DEFAULT 0,
  
  photos TEXT[] DEFAULT '{}',
  video_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_profile_locations_profile_id ON public.profile_locations(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_locations_city ON public.profile_locations(city);
CREATE INDEX IF NOT EXISTS idx_profile_locations_is_main ON public.profile_locations(is_main);
CREATE INDEX IF NOT EXISTS idx_profile_locations_active ON public.profile_locations(active);
CREATE INDEX IF NOT EXISTS idx_profile_locations_geo ON public.profile_locations USING GIST(geo_location);

-- RLS политики
ALTER TABLE public.profile_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_locations: public read active" ON public.profile_locations;
CREATE POLICY "profile_locations: public read active"
ON public.profile_locations FOR SELECT TO public
USING (active = true);

DROP POLICY IF EXISTS "profile_locations: owner can manage" ON public.profile_locations;
CREATE POLICY "profile_locations: owner can manage"
ON public.profile_locations FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Функция для обновления geo_location
CREATE OR REPLACE FUNCTION update_location_geo(location_id UUID, geo_wkt TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profile_locations
  SET geo_location = ST_GeogFromText(geo_wkt)
  WHERE id = location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.profile_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  city TEXT NOT NULL,
  address TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  
  geo_location GEOGRAPHY,
  
  is_main BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  
  details JSONB DEFAULT '{}'::JSONB,
  
  yandex_url TEXT,
  yandex_rating NUMERIC,
  yandex_review_count INTEGER DEFAULT 0,
  
  photos TEXT[] DEFAULT '{}',
  video_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_profile_locations_profile_id ON public.profile_locations(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_locations_city ON public.profile_locations(city);
CREATE INDEX IF NOT EXISTS idx_profile_locations_is_main ON public.profile_locations(is_main);
CREATE INDEX IF NOT EXISTS idx_profile_locations_active ON public.profile_locations(active);
CREATE INDEX IF NOT EXISTS idx_profile_locations_geo ON public.profile_locations USING GIST(geo_location);

-- RLS политики
ALTER TABLE public.profile_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_locations: public read active" ON public.profile_locations;
CREATE POLICY "profile_locations: public read active"
ON public.profile_locations FOR SELECT TO public
USING (active = true);

DROP POLICY IF EXISTS "profile_locations: owner can manage" ON public.profile_locations;
CREATE POLICY "profile_locations: owner can manage"
ON public.profile_locations FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Функция для обновления geo_location
CREATE OR REPLACE FUNCTION update_location_geo(location_id UUID, geo_wkt TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profile_locations
  SET geo_location = ST_GeogFromText(geo_wkt)
  WHERE id = location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




