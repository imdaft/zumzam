-- =====================================================
-- МИГРАЦИЯ: Создание ВСЕХ недостающих таблиц
-- Дата: 2024-12-26
-- Описание: Создаём таблицы, которые есть в старом Supabase, но нет в Managed PostgreSQL
-- =====================================================

-- 1. show_programs (для профилей-шоу)
CREATE TABLE IF NOT EXISTS public.show_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    age_min INTEGER,
    age_max INTEGER,
    min_participants INTEGER,
    max_participants INTEGER,
    price NUMERIC(10,2),
    photo TEXT,
    video_url TEXT,
    categories TEXT[],
    materials_included BOOLEAN DEFAULT FALSE,
    materials_list TEXT[],
    certificate BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_show_programs_profile_id ON public.show_programs(profile_id);
CREATE INDEX idx_show_programs_active ON public.show_programs(active);

COMMENT ON TABLE public.show_programs IS 'Программы шоу-агентств';

-- 2. quest_programs (для квестов)
CREATE TABLE IF NOT EXISTS public.quest_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    age_min INTEGER,
    age_max INTEGER,
    min_players INTEGER,
    max_players INTEGER,
    price NUMERIC(10,2),
    photo TEXT,
    video_url TEXT,
    categories TEXT[],
    difficulty_level TEXT, -- easy, medium, hard
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_quest_programs_profile_id ON public.quest_programs(profile_id);
CREATE INDEX idx_quest_programs_active ON public.quest_programs(active);

COMMENT ON TABLE public.quest_programs IS 'Программы квестов';

-- 3. animator_characters (персонажи аниматоров)
CREATE TABLE IF NOT EXISTS public.animator_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    age_min INTEGER,
    age_max INTEGER,
    price NUMERIC(10,2),
    photo TEXT,
    categories TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_animator_characters_profile_id ON public.animator_characters(profile_id);
CREATE INDEX idx_animator_characters_active ON public.animator_characters(active);

COMMENT ON TABLE public.animator_characters IS 'Персонажи аниматоров';

-- 4. ad_campaigns (рекламные кампании)
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    status TEXT DEFAULT 'draft', -- draft, active, paused, completed
    moderation_status TEXT DEFAULT 'pending', -- pending, approved, rejected
    moderation_notes TEXT,
    metadata JSONB DEFAULT '{}',
    budget NUMERIC(10,2),
    spent NUMERIC(10,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ad_campaigns_profile_id ON public.ad_campaigns(profile_id);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_moderation_status ON public.ad_campaigns(moderation_status);

COMMENT ON TABLE public.ad_campaigns IS 'Рекламные кампании';

-- 5. ad_bookings (бронирования рекламных слотов)
CREATE TABLE IF NOT EXISTS public.ad_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    ad_slot_id TEXT REFERENCES public.ad_slots(id) ON DELETE CASCADE, -- TEXT, не UUID!
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
    price NUMERIC(10,2),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ad_bookings_campaign_id ON public.ad_bookings(campaign_id);
CREATE INDEX idx_ad_bookings_ad_slot_id ON public.ad_bookings(ad_slot_id);
CREATE INDEX idx_ad_bookings_status ON public.ad_bookings(status);
CREATE INDEX idx_ad_bookings_dates ON public.ad_bookings(start_date, end_date);

COMMENT ON TABLE public.ad_bookings IS 'Бронирования рекламных слотов';

-- 6. ad_impressions (показы рекламы)
CREATE TABLE IF NOT EXISTS public.ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    ad_slot_id TEXT REFERENCES public.ad_slots(id) ON DELETE CASCADE, -- TEXT, не UUID!
    user_id UUID, -- NULL для анонимных пользователей
    ip_address TEXT,
    user_agent TEXT,
    clicked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ad_impressions_campaign_id ON public.ad_impressions(campaign_id);
CREATE INDEX idx_ad_impressions_created_at ON public.ad_impressions(created_at);
CREATE INDEX idx_ad_impressions_clicked ON public.ad_impressions(clicked);

COMMENT ON TABLE public.ad_impressions IS 'Показы рекламы и клики';

-- =====================================================
-- RLS POLICIES (упрощённые для начала)
-- =====================================================

-- show_programs
ALTER TABLE public.show_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.show_programs FOR SELECT USING (active = true);
CREATE POLICY "Owner full access" ON public.show_programs FOR ALL USING (true);

-- quest_programs
ALTER TABLE public.quest_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.quest_programs FOR SELECT USING (active = true);
CREATE POLICY "Owner full access" ON public.quest_programs FOR ALL USING (true);

-- animator_characters
ALTER TABLE public.animator_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.animator_characters FOR SELECT USING (active = true);
CREATE POLICY "Owner full access" ON public.animator_characters FOR ALL USING (true);

-- ad_campaigns
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active approved" ON public.ad_campaigns FOR SELECT USING (status = 'active' AND moderation_status = 'approved');
CREATE POLICY "Owner full access" ON public.ad_campaigns FOR ALL USING (true);

-- ad_bookings
ALTER TABLE public.ad_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active" ON public.ad_bookings FOR SELECT USING (status = 'active');
CREATE POLICY "Owner full access" ON public.ad_bookings FOR ALL USING (true);

-- ad_impressions
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert only" ON public.ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.ad_impressions FOR ALL USING (true);


-- Дата: 2024-12-26
-- Описание: Создаём таблицы, которые есть в старом Supabase, но нет в Managed PostgreSQL
-- =====================================================

-- 1. show_programs (для профилей-шоу)
CREATE TABLE IF NOT EXISTS public.show_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    age_min INTEGER,
    age_max INTEGER,
    min_participants INTEGER,
    max_participants INTEGER,
    price NUMERIC(10,2),
    photo TEXT,
    video_url TEXT,
    categories TEXT[],
    materials_included BOOLEAN DEFAULT FALSE,
    materials_list TEXT[],
    certificate BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_show_programs_profile_id ON public.show_programs(profile_id);
CREATE INDEX idx_show_programs_active ON public.show_programs(active);

COMMENT ON TABLE public.show_programs IS 'Программы шоу-агентств';

-- 2. quest_programs (для квестов)
CREATE TABLE IF NOT EXISTS public.quest_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    age_min INTEGER,
    age_max INTEGER,
    min_players INTEGER,
    max_players INTEGER,
    price NUMERIC(10,2),
    photo TEXT,
    video_url TEXT,
    categories TEXT[],
    difficulty_level TEXT, -- easy, medium, hard
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_quest_programs_profile_id ON public.quest_programs(profile_id);
CREATE INDEX idx_quest_programs_active ON public.quest_programs(active);

COMMENT ON TABLE public.quest_programs IS 'Программы квестов';

-- 3. animator_characters (персонажи аниматоров)
CREATE TABLE IF NOT EXISTS public.animator_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    age_min INTEGER,
    age_max INTEGER,
    price NUMERIC(10,2),
    photo TEXT,
    categories TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_animator_characters_profile_id ON public.animator_characters(profile_id);
CREATE INDEX idx_animator_characters_active ON public.animator_characters(active);

COMMENT ON TABLE public.animator_characters IS 'Персонажи аниматоров';

-- 4. ad_campaigns (рекламные кампании)
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    status TEXT DEFAULT 'draft', -- draft, active, paused, completed
    moderation_status TEXT DEFAULT 'pending', -- pending, approved, rejected
    moderation_notes TEXT,
    metadata JSONB DEFAULT '{}',
    budget NUMERIC(10,2),
    spent NUMERIC(10,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ad_campaigns_profile_id ON public.ad_campaigns(profile_id);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_moderation_status ON public.ad_campaigns(moderation_status);

COMMENT ON TABLE public.ad_campaigns IS 'Рекламные кампании';

-- 5. ad_bookings (бронирования рекламных слотов)
CREATE TABLE IF NOT EXISTS public.ad_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    ad_slot_id TEXT REFERENCES public.ad_slots(id) ON DELETE CASCADE, -- TEXT, не UUID!
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
    price NUMERIC(10,2),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ad_bookings_campaign_id ON public.ad_bookings(campaign_id);
CREATE INDEX idx_ad_bookings_ad_slot_id ON public.ad_bookings(ad_slot_id);
CREATE INDEX idx_ad_bookings_status ON public.ad_bookings(status);
CREATE INDEX idx_ad_bookings_dates ON public.ad_bookings(start_date, end_date);

COMMENT ON TABLE public.ad_bookings IS 'Бронирования рекламных слотов';

-- 6. ad_impressions (показы рекламы)
CREATE TABLE IF NOT EXISTS public.ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    ad_slot_id TEXT REFERENCES public.ad_slots(id) ON DELETE CASCADE, -- TEXT, не UUID!
    user_id UUID, -- NULL для анонимных пользователей
    ip_address TEXT,
    user_agent TEXT,
    clicked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ad_impressions_campaign_id ON public.ad_impressions(campaign_id);
CREATE INDEX idx_ad_impressions_created_at ON public.ad_impressions(created_at);
CREATE INDEX idx_ad_impressions_clicked ON public.ad_impressions(clicked);

COMMENT ON TABLE public.ad_impressions IS 'Показы рекламы и клики';

-- =====================================================
-- RLS POLICIES (упрощённые для начала)
-- =====================================================

-- show_programs
ALTER TABLE public.show_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.show_programs FOR SELECT USING (active = true);
CREATE POLICY "Owner full access" ON public.show_programs FOR ALL USING (true);

-- quest_programs
ALTER TABLE public.quest_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.quest_programs FOR SELECT USING (active = true);
CREATE POLICY "Owner full access" ON public.quest_programs FOR ALL USING (true);

-- animator_characters
ALTER TABLE public.animator_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.animator_characters FOR SELECT USING (active = true);
CREATE POLICY "Owner full access" ON public.animator_characters FOR ALL USING (true);

-- ad_campaigns
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active approved" ON public.ad_campaigns FOR SELECT USING (status = 'active' AND moderation_status = 'approved');
CREATE POLICY "Owner full access" ON public.ad_campaigns FOR ALL USING (true);

-- ad_bookings
ALTER TABLE public.ad_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active" ON public.ad_bookings FOR SELECT USING (status = 'active');
CREATE POLICY "Owner full access" ON public.ad_bookings FOR ALL USING (true);

-- ad_impressions
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert only" ON public.ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.ad_impressions FOR ALL USING (true);

