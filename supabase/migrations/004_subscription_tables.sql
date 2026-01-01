-- 004_subscription_tables.sql
-- Subscription and usage tracking for multi-tenant SaaS
-- プラン: none（未契約） / business（¥9,800/シート/月）
-- チャット履歴: 最終更新日から6ヶ月で削除

BEGIN;

-- ========================================
-- ENUMS
-- ========================================

CREATE TYPE subscription_status AS ENUM (
  'active', 'canceled', 'past_due', 'trialing', 'unpaid'
);

CREATE TYPE plan_type AS ENUM ('none', 'business');

-- ========================================
-- SUBSCRIPTION TABLES
-- ========================================

-- Subscriptions table (one per organization)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT UNIQUE NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan plan_type NOT NULL DEFAULT 'none',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking per organization per month
CREATE TABLE IF NOT EXISTS usage (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  month DATE NOT NULL,  -- First day of month (YYYY-MM-01)
  messages_count INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  files_uploaded INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  UNIQUE(organization_id, month)
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_org_month ON usage(organization_id, month);

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
      WHERE m."organizationId" = subscriptions.organization_id
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
      WHERE m."organizationId" = usage.organization_id
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
-- TRIGGER FUNCTION (snake_case version)
-- ========================================

-- Snake_case版のupdated_at更新関数
CREATE OR REPLACE FUNCTION update_updated_at_snake_case()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ========================================
-- TRIGGERS
-- ========================================

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_snake_case();

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
  INSERT INTO public.usage (id, organization_id, month, messages_count, tokens_used, files_uploaded, storage_bytes)
  VALUES (
    gen_random_uuid()::TEXT,
    p_organization_id,
    date_trunc('month', CURRENT_DATE)::DATE,
    p_messages,
    p_tokens,
    p_files,
    p_storage
  )
  ON CONFLICT (organization_id, month) DO UPDATE SET
    messages_count = public.usage.messages_count + p_messages,
    tokens_used = public.usage.tokens_used + p_tokens,
    files_uploaded = public.usage.files_uploaded + p_files,
    storage_bytes = public.usage.storage_bytes + p_storage;
END;
$$;

-- ========================================
-- CHAT HISTORY CLEANUP
-- ========================================

-- チャット履歴削除関数（最終更新日から指定月数経過したスレッドを削除）
CREATE OR REPLACE FUNCTION cleanup_old_chat_threads(
  p_months_threshold INTEGER DEFAULT 6
)
RETURNS TABLE(deleted_count INTEGER, deleted_thread_ids TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_deleted_ids TEXT[];
BEGIN
  -- 削除対象のスレッドIDを収集
  SELECT array_agg(id) INTO v_deleted_ids
  FROM public.chat_threads
  WHERE "updatedAt" < NOW() - (p_months_threshold || ' months')::INTERVAL;

  -- スレッドを削除（メッセージはON DELETE CASCADEで自動削除）
  DELETE FROM public.chat_threads
  WHERE "updatedAt" < NOW() - (p_months_threshold || ' months')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_count, COALESCE(v_deleted_ids, ARRAY[]::TEXT[]);
END;
$$;

-- 定期実行用のラッパー関数（pg_cronで使用）
-- 例: SELECT * FROM cron.schedule('cleanup-old-chats', '0 3 * * *', 'SELECT cleanup_old_chat_threads(6)');
CREATE OR REPLACE FUNCTION schedule_chat_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 6ヶ月経過したチャット履歴を削除
  PERFORM public.cleanup_old_chat_threads(6);
END;
$$;

COMMIT;
