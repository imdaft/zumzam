-- Создание таблиц для профилей типа Agency
-- Дата: 2024-12-25

-- =====================================================
-- Таблица: agency_partners (Специалисты агентства)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agency_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Если это профиль с ZumZam
  partner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Или ручное добавление
  custom_name TEXT,
  custom_specialization TEXT,
  custom_photo TEXT,
  custom_description TEXT,
  custom_contacts TEXT,
  
  -- Метаданные
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_agency_partners_agency_profile_id ON public.agency_partners(agency_profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_partners_partner_profile_id ON public.agency_partners(partner_profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_partners_is_active ON public.agency_partners(is_active);

-- =====================================================
-- Таблица: agency_cases (Кейсы агентства)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agency_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Основная информация
  title TEXT NOT NULL,
  description TEXT,
  
  -- Галерея
  photos TEXT[] DEFAULT '{}',
  
  -- Характеристики
  event_type TEXT,
  guest_count INTEGER,
  budget_tier TEXT,
  included_services TEXT[] DEFAULT '{}',
  
  -- Метаданные
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_agency_cases_profile_id ON public.agency_cases(profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_cases_is_active ON public.agency_cases(is_active);
CREATE INDEX IF NOT EXISTS idx_agency_cases_event_type ON public.agency_cases(event_type);

-- =====================================================
-- RLS Policies для agency_partners
-- =====================================================

-- Включаем RLS
ALTER TABLE public.agency_partners ENABLE ROW LEVEL SECURITY;

-- Публичное чтение активных партнеров
CREATE POLICY "agency_partners: public read active"
ON public.agency_partners FOR SELECT
TO public
USING (is_active = true);

-- Владелец агентства может управлять своими партнерами
CREATE POLICY "agency_partners: owner full access"
ON public.agency_partners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = agency_partners.agency_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Админы могут управлять всеми партнерами
CREATE POLICY "agency_partners: admin full access"
ON public.agency_partners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- =====================================================
-- RLS Policies для agency_cases
-- =====================================================

-- Включаем RLS
ALTER TABLE public.agency_cases ENABLE ROW LEVEL SECURITY;

-- Публичное чтение активных кейсов
CREATE POLICY "agency_cases: public read active"
ON public.agency_cases FOR SELECT
TO public
USING (is_active = true);

-- Владелец профиля может управлять своими кейсами
CREATE POLICY "agency_cases: owner full access"
ON public.agency_cases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = agency_cases.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Админы могут управлять всеми кейсами
CREATE POLICY "agency_cases: admin full access"
ON public.agency_cases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Дата: 2024-12-25

-- =====================================================
-- Таблица: agency_partners (Специалисты агентства)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agency_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Если это профиль с ZumZam
  partner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Или ручное добавление
  custom_name TEXT,
  custom_specialization TEXT,
  custom_photo TEXT,
  custom_description TEXT,
  custom_contacts TEXT,
  
  -- Метаданные
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_agency_partners_agency_profile_id ON public.agency_partners(agency_profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_partners_partner_profile_id ON public.agency_partners(partner_profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_partners_is_active ON public.agency_partners(is_active);

-- =====================================================
-- Таблица: agency_cases (Кейсы агентства)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agency_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Основная информация
  title TEXT NOT NULL,
  description TEXT,
  
  -- Галерея
  photos TEXT[] DEFAULT '{}',
  
  -- Характеристики
  event_type TEXT,
  guest_count INTEGER,
  budget_tier TEXT,
  included_services TEXT[] DEFAULT '{}',
  
  -- Метаданные
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_agency_cases_profile_id ON public.agency_cases(profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_cases_is_active ON public.agency_cases(is_active);
CREATE INDEX IF NOT EXISTS idx_agency_cases_event_type ON public.agency_cases(event_type);

-- =====================================================
-- RLS Policies для agency_partners
-- =====================================================

-- Включаем RLS
ALTER TABLE public.agency_partners ENABLE ROW LEVEL SECURITY;

-- Публичное чтение активных партнеров
CREATE POLICY "agency_partners: public read active"
ON public.agency_partners FOR SELECT
TO public
USING (is_active = true);

-- Владелец агентства может управлять своими партнерами
CREATE POLICY "agency_partners: owner full access"
ON public.agency_partners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = agency_partners.agency_profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Админы могут управлять всеми партнерами
CREATE POLICY "agency_partners: admin full access"
ON public.agency_partners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- =====================================================
-- RLS Policies для agency_cases
-- =====================================================

-- Включаем RLS
ALTER TABLE public.agency_cases ENABLE ROW LEVEL SECURITY;

-- Публичное чтение активных кейсов
CREATE POLICY "agency_cases: public read active"
ON public.agency_cases FOR SELECT
TO public
USING (is_active = true);

-- Владелец профиля может управлять своими кейсами
CREATE POLICY "agency_cases: owner full access"
ON public.agency_cases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = agency_cases.profile_id
    AND profiles.user_id = auth.uid()
  )
);

-- Админы могут управлять всеми кейсами
CREATE POLICY "agency_cases: admin full access"
ON public.agency_cases FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);




