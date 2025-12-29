-- Создание основных таблиц для работы приложения

-- =====================================================
-- 1. PROFILE RELATIONS
-- =====================================================

-- Таблица связей профилей с активностями
CREATE TABLE IF NOT EXISTS public.profile_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_activities_profile_id ON public.profile_activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_activities_activity_id ON public.profile_activities(activity_id);

ALTER TABLE public.profile_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_activities: public read" ON public.profile_activities FOR SELECT TO public USING (true);
CREATE POLICY "profile_activities: owner manage" ON public.profile_activities FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Таблица связей профилей с услугами
CREATE TABLE IF NOT EXISTS public.profile_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_services_profile_id ON public.profile_services(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_services_service_id ON public.profile_services(service_id);

ALTER TABLE public.profile_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_services: public read" ON public.profile_services FOR SELECT TO public USING (true);
CREATE POLICY "profile_services: owner manage" ON public.profile_services FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- =====================================================
-- 2. SERVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  duration_minutes INTEGER,
  
  photos TEXT[] DEFAULT '{}',
  is_additional BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_profile_id ON public.services(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services: public read active" ON public.services FOR SELECT TO public USING (is_active = true);
CREATE POLICY "services: owner manage" ON public.services FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- =====================================================
-- 3. REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON public.reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: public read" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "reviews: authenticated create" ON public.reviews FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews: owner update" ON public.reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "reviews: owner delete" ON public.reviews FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 4. MASTER CLASS PROGRAMS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.master_class_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  photo TEXT,
  video_url TEXT,
  
  duration_minutes INTEGER,
  age_min INTEGER,
  age_max INTEGER,
  
  min_participants INTEGER,
  max_participants INTEGER,
  
  materials_included BOOLEAN DEFAULT FALSE,
  materials_list TEXT[] DEFAULT '{}',
  take_home BOOLEAN DEFAULT FALSE,
  certificate BOOLEAN DEFAULT FALSE,
  
  categories TEXT[] DEFAULT '{}',
  price NUMERIC,
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_class_programs_profile_id ON public.master_class_programs(profile_id);
CREATE INDEX IF NOT EXISTS idx_master_class_programs_active ON public.master_class_programs(active);

ALTER TABLE public.master_class_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_class_programs: public read active" ON public.master_class_programs FOR SELECT TO public USING (active = true);
CREATE POLICY "master_class_programs: owner manage" ON public.master_class_programs FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- =====================================================
-- 5. CATALOGS
-- =====================================================

-- Animator services catalog
CREATE TABLE IF NOT EXISTS public.animator_services_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Agency services catalog
CREATE TABLE IF NOT EXISTS public.agency_services_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Activity catalog
CREATE TABLE IF NOT EXISTS public.activity_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Service catalog
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Master class types catalog
CREATE TABLE IF NOT EXISTS public.masterclass_types_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Quest types catalog
CREATE TABLE IF NOT EXISTS public.quest_types_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Show types catalog
CREATE TABLE IF NOT EXISTS public.show_types_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Photographer styles catalog
CREATE TABLE IF NOT EXISTS public.photographer_styles_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);


-- =====================================================
-- 1. PROFILE RELATIONS
-- =====================================================

-- Таблица связей профилей с активностями
CREATE TABLE IF NOT EXISTS public.profile_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_activities_profile_id ON public.profile_activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_activities_activity_id ON public.profile_activities(activity_id);

ALTER TABLE public.profile_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_activities: public read" ON public.profile_activities FOR SELECT TO public USING (true);
CREATE POLICY "profile_activities: owner manage" ON public.profile_activities FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Таблица связей профилей с услугами
CREATE TABLE IF NOT EXISTS public.profile_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_services_profile_id ON public.profile_services(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_services_service_id ON public.profile_services(service_id);

ALTER TABLE public.profile_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_services: public read" ON public.profile_services FOR SELECT TO public USING (true);
CREATE POLICY "profile_services: owner manage" ON public.profile_services FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- =====================================================
-- 2. SERVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  duration_minutes INTEGER,
  
  photos TEXT[] DEFAULT '{}',
  is_additional BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_profile_id ON public.services(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services: public read active" ON public.services FOR SELECT TO public USING (is_active = true);
CREATE POLICY "services: owner manage" ON public.services FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- =====================================================
-- 3. REVIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON public.reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: public read" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "reviews: authenticated create" ON public.reviews FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews: owner update" ON public.reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "reviews: owner delete" ON public.reviews FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 4. MASTER CLASS PROGRAMS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.master_class_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  photo TEXT,
  video_url TEXT,
  
  duration_minutes INTEGER,
  age_min INTEGER,
  age_max INTEGER,
  
  min_participants INTEGER,
  max_participants INTEGER,
  
  materials_included BOOLEAN DEFAULT FALSE,
  materials_list TEXT[] DEFAULT '{}',
  take_home BOOLEAN DEFAULT FALSE,
  certificate BOOLEAN DEFAULT FALSE,
  
  categories TEXT[] DEFAULT '{}',
  price NUMERIC,
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_class_programs_profile_id ON public.master_class_programs(profile_id);
CREATE INDEX IF NOT EXISTS idx_master_class_programs_active ON public.master_class_programs(active);

ALTER TABLE public.master_class_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_class_programs: public read active" ON public.master_class_programs FOR SELECT TO public USING (active = true);
CREATE POLICY "master_class_programs: owner manage" ON public.master_class_programs FOR ALL TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- =====================================================
-- 5. CATALOGS
-- =====================================================

-- Animator services catalog
CREATE TABLE IF NOT EXISTS public.animator_services_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Agency services catalog
CREATE TABLE IF NOT EXISTS public.agency_services_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Activity catalog
CREATE TABLE IF NOT EXISTS public.activity_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Service catalog
CREATE TABLE IF NOT EXISTS public.service_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Master class types catalog
CREATE TABLE IF NOT EXISTS public.masterclass_types_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Quest types catalog
CREATE TABLE IF NOT EXISTS public.quest_types_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Show types catalog
CREATE TABLE IF NOT EXISTS public.show_types_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);

-- Photographer styles catalog
CREATE TABLE IF NOT EXISTS public.photographer_styles_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  icon TEXT,
  description TEXT
);




