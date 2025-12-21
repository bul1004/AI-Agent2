-- 004_subscription_tables.sql
-- Subscription and usage tracking for multi-tenant SaaS

BEGIN;

-- ========================================
-- ENUMS
-- ========================================

CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'past_due', 'trialing', 'unpaid'
);

CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');

-- ========================================
-- SUBSCRIPTION TABLES
-- ========================================

-- Subscriptions table (one per organization)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT UNIQUE NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  "stripeCustomerId" TEXT UNIQUE,
  "stripeSubscriptionId" TEXT UNIQUE,
  plan plan_type NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  "currentPeriodStart" TIMESTAMPTZ,
  "currentPeriodEnd" TIMESTAMPTZ,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking per organization per month
CREATE TABLE IF NOT EXISTS usage (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  month DATE NOT NULL,  -- First day of month (YYYY-MM-01)
  "messagesCount" INTEGER DEFAULT 0,
  "tokensUsed" BIGINT DEFAULT 0,
  "filesUploaded" INTEGER DEFAULT 0,
  "storageBytes" BIGINT DEFAULT 0,
  UNIQUE("organizationId", month)
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions("stripeCustomerId");
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions("stripeSubscriptionId");
CREATE INDEX idx_usage_org_month ON usage("organizationId", month);

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies (members can view their org's subscription)
CREATE POLICY subscriptions_select ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = subscriptions."organizationId"
        AND m."userId" = current_jwt_user()
    )
  );

CREATE POLICY subscriptions_insert ON subscriptions
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role'
  );

CREATE POLICY subscriptions_update ON subscriptions
  FOR UPDATE USING (
    (SELECT auth.role()) = 'service_role'
  );

CREATE POLICY subscriptions_delete ON subscriptions
  FOR DELETE USING (
    (SELECT auth.role()) = 'service_role'
  );

-- Usage policies
CREATE POLICY usage_select ON usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = usage."organizationId"
        AND m."userId" = current_jwt_user()
    )
  );

CREATE POLICY usage_insert ON usage
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role'
  );

CREATE POLICY usage_update ON usage
  FOR UPDATE USING (
    (SELECT auth.role()) = 'service_role'
  );

-- ========================================
-- TRIGGERS
-- ========================================

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_organization_id TEXT,
  p_messages INTEGER DEFAULT 0,
  p_tokens BIGINT DEFAULT 0,
  p_files INTEGER DEFAULT 0,
  p_storage BIGINT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.usage (id, "organizationId", month, "messagesCount", "tokensUsed", "filesUploaded", "storageBytes")
  VALUES (
    gen_random_uuid()::TEXT,
    p_organization_id,
    date_trunc('month', CURRENT_DATE)::DATE,
    p_messages,
    p_tokens,
    p_files,
    p_storage
  )
  ON CONFLICT ("organizationId", month) DO UPDATE SET
    "messagesCount" = usage."messagesCount" + p_messages,
    "tokensUsed" = usage."tokensUsed" + p_tokens,
    "filesUploaded" = usage."filesUploaded" + p_files,
    "storageBytes" = usage."storageBytes" + p_storage;
END;
$$;

COMMIT;
