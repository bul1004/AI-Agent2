-- Subscription status
CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'past_due', 'trialing', 'unpaid'
);

-- Plan types
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan plan_type NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking per organization per month
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month DATE NOT NULL,  -- First day of month (YYYY-MM-01)
  messages_count INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  files_uploaded INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  UNIQUE(organization_id, month)
);

-- Indexes
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_org_month ON usage(organization_id, month);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS policies
CREATE POLICY "Members can view subscription"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Usage RLS policies
CREATE POLICY "Members can view usage"
  ON usage FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Update trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_organization_id UUID,
  p_messages INTEGER DEFAULT 0,
  p_tokens BIGINT DEFAULT 0,
  p_files INTEGER DEFAULT 0,
  p_storage BIGINT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO usage (organization_id, month, messages_count, tokens_used, files_uploaded, storage_bytes)
  VALUES (
    p_organization_id,
    date_trunc('month', CURRENT_DATE)::DATE,
    p_messages,
    p_tokens,
    p_files,
    p_storage
  )
  ON CONFLICT (organization_id, month) DO UPDATE SET
    messages_count = usage.messages_count + p_messages,
    tokens_used = usage.tokens_used + p_tokens,
    files_uploaded = usage.files_uploaded + p_files,
    storage_bytes = usage.storage_bytes + p_storage;
END;
$$;
