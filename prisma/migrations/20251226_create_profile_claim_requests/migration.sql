-- CreateTable: profile_claim_requests
CREATE TABLE IF NOT EXISTS "public"."profile_claim_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "admin_id" UUID,
    "rejection_reason" TEXT,
    "claim_token" TEXT,
    "verification_method" TEXT,
    "verification_data" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_claim_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_profile_claim_requests_profile_id" ON "public"."profile_claim_requests"("profile_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_profile_claim_requests_user_id" ON "public"."profile_claim_requests"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_profile_claim_requests_status" ON "public"."profile_claim_requests"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_profile_claim_requests_token" ON "public"."profile_claim_requests"("claim_token");

-- AddForeignKey
ALTER TABLE "public"."profile_claim_requests" 
    ADD CONSTRAINT "profile_claim_requests_profile_id_fkey" 
    FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_claim_requests" 
    ADD CONSTRAINT "profile_claim_requests_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_claim_requests" 
    ADD CONSTRAINT "profile_claim_requests_admin_id_fkey" 
    FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;



