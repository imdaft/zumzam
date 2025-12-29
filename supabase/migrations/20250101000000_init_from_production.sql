-- Генератор SQL схемы для переноса
-- Этот файл создает полный дамп схемы из production

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

DROP TYPE IF EXISTS business_model_enum CASCADE;
CREATE TYPE business_model_enum AS ENUM ('rental_only', 'tickets_freeplay', 'packages_turnkey', 'mobile_services', 'hybrid');

DROP TYPE IF EXISTS primary_venue_type_enum CASCADE;
CREATE TYPE primary_venue_type_enum AS ENUM ('active_entertainment', 'quest_escape', 'creative_studio', 'event_space', 'vr_digital', 'animal_interaction', 'outdoor_recreation');

DROP TYPE IF EXISTS profile_category CASCADE;
CREATE TYPE profile_category AS ENUM ('venue', 'animator', 'agency', 'show', 'quest', 'master_class', 'photographer');

DROP TYPE IF EXISTS space_type_enum CASCADE;
CREATE TYPE space_type_enum AS ENUM ('loft_studio', 'mall_venue', 'closed_arena', 'outdoor', 'country_base', 'mobile');

DROP TYPE IF EXISTS venue_subtype CASCADE;
CREATE TYPE venue_subtype AS ENUM ('kids_center', 'loft', 'cafe', 'entertainment_center', 'outdoor', 'trampoline_park', 'karting', 'lasertag', 'climbing_park', 'bowling', 'water_park', 'museum', 'planetarium', 'theater', 'library', 'art_studio', 'pottery_workshop', 'culinary_studio', 'woodworking_workshop', 'sewing_workshop', 'zoo', 'aquarium', 'horse_club', 'farm', 'vr_arena', 'quest_room', 'cinema', 'retail_workshop', 'recreation_base', 'glamping', 'other');

DROP TYPE IF EXISTS venue_subtype_new CASCADE;
CREATE TYPE venue_subtype_new AS ENUM ('entertainment_center', 'trampoline_park', 'karting', 'lasertag', 'vr_arena', 'bowling', 'quest_room', 'climbing_park', 'cafe', 'loft', 'water_park', 'recreation_base', 'farm', 'horse_club', 'glamping', 'outdoor', 'cinema', 'culinary_studio', 'pottery_workshop', 'art_studio', 'woodworking_workshop', 'sewing_workshop', 'other');

DROP TYPE IF EXISTS venue_subtype_temp CASCADE;
CREATE TYPE venue_subtype_temp AS ENUM ('cafe', 'loft', 'banquet_hall', 'event_studio', 'entertainment_center', 'trampoline_park', 'karting', 'lasertag', 'climbing_park', 'bowling', 'water_park', 'vr_arena', 'quest_room', 'art_studio', 'pottery_workshop', 'culinary_studio', 'woodworking_workshop', 'sewing_workshop', 'horse_club', 'farm', 'recreation_base', 'glamping', 'outdoor', 'other');

-- =====================================================
-- 2. EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";

-- =====================================================
-- 3. TABLES
-- =====================================================

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user',
  is_blocked BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  credits INTEGER DEFAULT 0,
  telegram_chat_id BIGINT,
  telegram_username TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  telegram_notifications_enabled BOOLEAN DEFAULT TRUE
);

-- TABLE: profiles (main table)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  description TEXT,
  city TEXT NOT NULL,
  address TEXT,
  geo_location GEOGRAPHY,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  response_time_minutes INTEGER,
  price_range TEXT,
  embedding VECTOR,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  videos TEXT[] DEFAULT ARRAY[]::TEXT[],
  cover_photo TEXT,
  portfolio_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  email TEXT,
  phone TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  category profile_category DEFAULT 'venue'::profile_category,
  details JSONB DEFAULT '{}'::JSONB,
  main_photo TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  logo TEXT,
  section_order JSONB DEFAULT '["about", "packages", "turnkey", "services", "portfolio", "contacts"]'::JSONB,
  locations_menu_label TEXT DEFAULT 'Наши адреса',
  custom_fields_config JSONB DEFAULT '[]'::JSONB,
  faq JSONB DEFAULT '[]'::JSONB,
  legal_agreement_type TEXT DEFAULT 'generated',
  legal_agreement_url TEXT,
  legal_agreement_text TEXT,
  legal_agreement_generated_data JSONB DEFAULT '{}'::JSONB,
  legal_agreement_generated_text TEXT,
  booking_rules_type TEXT DEFAULT 'generated',
  booking_rules_text TEXT,
  booking_rules_generated_data JSONB DEFAULT '{}'::JSONB,
  booking_rules_generated_text TEXT,
  legal_docs_generated_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'draft',
  rejection_reason TEXT,
  legal_form TEXT DEFAULT 'private',
  claim_status TEXT DEFAULT 'claimed',
  claim_token UUID DEFAULT gen_random_uuid(),
  claimed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  secondary_categories TEXT[] DEFAULT '{}'::TEXT[],
  section_templates JSONB DEFAULT '{}'::JSONB,
  cover_photo_crop JSONB DEFAULT '{}'::JSONB,
  cover_photo_ai_expanded JSONB DEFAULT '{}'::JSONB,
  role TEXT DEFAULT 'user',
  video_cover TEXT,
  age_restrictions JSONB DEFAULT '{}'::JSONB,
  capacity_info JSONB DEFAULT '{}'::JSONB,
  payment_methods JSONB DEFAULT '{}'::JSONB,
  messenger_contacts JSONB DEFAULT '{}'::JSONB,
  working_hours JSONB DEFAULT '{}'::JSONB,
  metro_stations JSONB DEFAULT '[]'::JSONB,
  parking_info JSONB DEFAULT '{}'::JSONB,
  accessibility JSONB DEFAULT '{}'::JSONB,
  amenities JSONB DEFAULT '{}'::JSONB,
  prepayment_policy JSONB DEFAULT '{}'::JSONB,
  area_info JSONB DEFAULT '{}'::JSONB,
  structured_address JSONB DEFAULT '{}'::JSONB,
  primary_venue_type primary_venue_type_enum,
  activities TEXT[] DEFAULT '{}'::TEXT[],
  business_models business_model_enum[] DEFAULT '{}'::business_model_enum[],
  space_type space_type_enum,
  additional_services TEXT[] DEFAULT '{}'::TEXT[],
  search_vector TSVECTOR,
  primary_services TEXT[] DEFAULT '{}'::TEXT[]
);

-- Примечание: Это МИНИМАЛЬНАЯ схема для быстрого старта
-- Остальные таблицы будут добавлены автоматически при импорте данных

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_is_published ON profiles(is_published);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

-- =====================================================
-- 5. RLS POLICIES (базовые)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users: каждый видит только себя
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: все видят опубликованные, владельцы видят свои
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (
    is_published = true
    OR user_id = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Users can update own profiles" ON profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can delete own profiles" ON profiles
  FOR DELETE USING (
    user_id = auth.uid()
    OR created_by = auth.uid()
  );

-- =====================================================
-- ГОТОВО! Базовая схема создана
-- =====================================================

