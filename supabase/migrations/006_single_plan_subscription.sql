-- 006_single_plan_subscription.sql
-- 単一プラン型サブスクリプションへの移行
-- - プラン: none（未契約） / business（¥9,800/シート/月）
-- - チャット履歴: 最終更新日から6ヶ月で削除

BEGIN;

-- ========================================
-- PLAN TYPE MIGRATION
-- ========================================

-- 1. 新しいplan_type enumを作成
CREATE TYPE plan_type_new AS ENUM ('none', 'business');

-- 2. 既存データを移行
-- free → none, pro/enterprise → business
ALTER TABLE subscriptions
  ALTER COLUMN plan DROP DEFAULT;

ALTER TABLE subscriptions
  ALTER COLUMN plan TYPE plan_type_new
  USING (
    CASE plan::text
      WHEN 'free' THEN 'none'::plan_type_new
      WHEN 'pro' THEN 'business'::plan_type_new
      WHEN 'enterprise' THEN 'business'::plan_type_new
      ELSE 'none'::plan_type_new
    END
  );

-- 3. デフォルト値を設定
ALTER TABLE subscriptions
  ALTER COLUMN plan SET DEFAULT 'none'::plan_type_new;

-- 4. 古いenumを削除し、新しいものをリネーム
DROP TYPE plan_type;
ALTER TYPE plan_type_new RENAME TO plan_type;

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

-- ========================================
-- USAGE TABLE UPDATE
-- ========================================

-- トークン使用量のカラム名をより明確に
-- （既存のtokensUsedカラムは保持、将来の拡張用）

COMMIT;
