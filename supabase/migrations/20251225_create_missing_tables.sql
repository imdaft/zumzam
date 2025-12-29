-- Миграция: Создание отсутствующих таблиц для полной функциональности
-- Дата: 25 декабря 2025

-- =====================================================
-- CONVERSATIONS & MESSAGES (Чаты и сообщения)
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;

-- =====================================================
-- ORDERS (Заказы - отличается от order_requests)
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES order_requests(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2),
  event_date DATE,
  event_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_profile ON orders(profile_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_event_date ON orders(event_date);

-- =====================================================
-- USER ANALYTICS & TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sources_user ON user_sources(user_id);
CREATE INDEX idx_user_sources_session ON user_sources(session_id);
CREATE INDEX idx_user_sources_source ON user_sources(source);
CREATE INDEX idx_user_sources_created ON user_sources(created_at DESC);

CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  interest_value TEXT NOT NULL,
  interest_score INTEGER DEFAULT 1,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest_type, interest_value)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_user_interests_type ON user_interests(interest_type);
CREATE INDEX idx_user_interests_score ON user_interests(interest_score DESC);

CREATE TABLE IF NOT EXISTS user_section_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, section)
);

CREATE INDEX idx_user_section_views_user ON user_section_views(user_id);

-- =====================================================
-- CART & BOOKINGS (Корзина и бронирования)
-- =====================================================

CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2),
  event_date DATE,
  event_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_profile ON cart(profile_id);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  duration_minutes INTEGER,
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_profile ON bookings(profile_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_event_date ON bookings(event_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- =====================================================
-- FOLDERS (Папки для организации)
-- =====================================================

CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_folders_user ON folders(user_id);
CREATE INDEX idx_folders_position ON folders(user_id, position);

CREATE TABLE IF NOT EXISTS folder_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES order_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (profile_id IS NOT NULL OR request_id IS NOT NULL)
);

CREATE INDEX idx_folder_items_folder ON folder_items(folder_id);
CREATE INDEX idx_folder_items_profile ON folder_items(profile_id);
CREATE INDEX idx_folder_items_request ON folder_items(request_id);

-- =====================================================
-- PIPELINES (Воронки продаж / CRM)
-- =====================================================

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pipelines_user ON pipelines(user_id);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX idx_pipeline_stages_position ON pipeline_stages(pipeline_id, position);

CREATE TABLE IF NOT EXISTS pipeline_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  request_id UUID REFERENCES order_requests(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value DECIMAL(10,2),
  probability INTEGER DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pipeline_deals_pipeline ON pipeline_deals(pipeline_id);
CREATE INDEX idx_pipeline_deals_stage ON pipeline_deals(stage_id);

-- =====================================================
-- BOARD SUBSCRIPTIONS (Подписки на доску объявлений)
-- =====================================================

CREATE TABLE IF NOT EXISTS board_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT,
  city TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  notification_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  telegram_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_board_subscriptions_user ON board_subscriptions(user_id);
CREATE INDEX idx_board_subscriptions_category ON board_subscriptions(category);

-- =====================================================
-- FAVORITES (Избранное)
-- =====================================================

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_profile ON favorites(profile_id);

-- =====================================================
-- Комментарий
-- =====================================================

COMMENT ON TABLE conversations IS 'Диалоги между пользователями';
COMMENT ON TABLE messages IS 'Сообщения в диалогах';
COMMENT ON TABLE orders IS 'Подтверждённые заказы (отличается от order_requests - заявок)';
COMMENT ON TABLE user_sources IS 'Источники трафика пользователей для аналитики';
COMMENT ON TABLE user_interests IS 'Интересы пользователей для рекомендаций';
COMMENT ON TABLE user_section_views IS 'Просмотры разделов для счётчиков "новое"';
COMMENT ON TABLE cart IS 'Корзина покупок';
COMMENT ON TABLE bookings IS 'Бронирования услуг';
COMMENT ON TABLE folders IS 'Папки для организации профилей/заявок';
COMMENT ON TABLE pipelines IS 'Воронки продаж / CRM';
COMMENT ON TABLE board_subscriptions IS 'Подписки на новые заявки';
COMMENT ON TABLE favorites IS 'Избранные профили';
