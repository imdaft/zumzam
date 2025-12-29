-- Drop old table
DROP TABLE IF EXISTS "order_requests" CASCADE;

-- Create new order_requests table with correct structure
CREATE TABLE "order_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "event_date" DATE NOT NULL,
  "event_time" TIME,
  "duration_minutes" INTEGER,
  "city" TEXT NOT NULL DEFAULT 'Санкт-Петербург',
  "district" TEXT,
  "venue_type" TEXT,
  "venue_name" TEXT,
  "children_count" INTEGER,
  "children_age_from" INTEGER,
  "children_age_to" INTEGER,
  "birthday_child_name" TEXT,
  "birthday_child_age" INTEGER,
  "budget" INTEGER,
  "budget_negotiable" BOOLEAN DEFAULT false,
  "details" JSONB DEFAULT '{}'::jsonb,
  "contact_phone" TEXT,
  "contact_method" TEXT DEFAULT 'chat',
  "preferred_contact_time" TEXT,
  "status" TEXT DEFAULT 'active',
  "is_urgent" BOOLEAN DEFAULT false,
  "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "views_count" INTEGER DEFAULT 0,
  "responses_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ,
  "closed_at" TIMESTAMPTZ,
  "client_type" TEXT NOT NULL DEFAULT 'parent',
  "client_name" TEXT,
  "company_name" TEXT,
  "address" TEXT,
  "metro" TEXT,
  "adults_count" INTEGER,
  "payment_type" TEXT DEFAULT 'any',
  "contact_name" TEXT,
  "listing_plan_id" UUID,
  "listing_paid_at" TIMESTAMPTZ,
  "pinned_until" TIMESTAMPTZ,
  "priority_score" INTEGER DEFAULT 0,
  "highlight_color" TEXT,
  "telegram_posted_at" TIMESTAMPTZ,
  "subscribers_notified_at" TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX "idx_order_requests_client_id" ON "order_requests"("client_id");
CREATE INDEX "idx_order_requests_status" ON "order_requests"("status");
CREATE INDEX "idx_order_requests_category" ON "order_requests"("category");
CREATE INDEX "idx_order_requests_event_date" ON "order_requests"("event_date");
CREATE INDEX "idx_order_requests_city" ON "order_requests"("city");
CREATE INDEX "idx_order_requests_created_at" ON "order_requests"("created_at");

-- Enable RLS
ALTER TABLE "order_requests" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow_public_read_active_requests" 
  ON "order_requests" FOR SELECT 
  USING (status = 'active');

CREATE POLICY "allow_client_manage_own_requests" 
  ON "order_requests" FOR ALL 
  USING (auth.uid() = client_id);



