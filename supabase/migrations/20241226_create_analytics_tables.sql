-- Создание таблицы user_activity для аналитики
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::JSONB,
  
  page_url TEXT,
  referrer_url TEXT,
  
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON public.user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON public.user_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- RLS политики
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать свою активность
DROP POLICY IF EXISTS "user_activity: users can read own" ON public.user_activity;
CREATE POLICY "user_activity: users can read own"
ON public.user_activity FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Любой может записывать (для анонимных пользователей)
DROP POLICY IF EXISTS "user_activity: anyone can insert" ON public.user_activity;
CREATE POLICY "user_activity: anyone can insert"
ON public.user_activity FOR INSERT TO public
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::JSONB,
  
  page_url TEXT,
  referrer_url TEXT,
  
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON public.user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON public.user_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- RLS политики
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Пользователи могут читать свою активность
DROP POLICY IF EXISTS "user_activity: users can read own" ON public.user_activity;
CREATE POLICY "user_activity: users can read own"
ON public.user_activity FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Любой может записывать (для анонимных пользователей)
DROP POLICY IF EXISTS "user_activity: anyone can insert" ON public.user_activity;
CREATE POLICY "user_activity: anyone can insert"
ON public.user_activity FOR INSERT TO public
WITH CHECK (true);




