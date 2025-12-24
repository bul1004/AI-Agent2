-- ===========================================
-- E2Eテスト用シードデータ
-- ===========================================
--
-- 使用方法:
--   1. supabase db reset (ローカル) または
--   2. psql で直接実行
--
-- 注意:
--   - パスワードはBetterAuthのハッシュ形式が必要
--   - このseedはユーザー・組織の枠組みを作成
--   - パスワード設定は scripts/seed-e2e.ts を使用するか
--     UIからサインアップ後にDBで役割を更新
-- ===========================================

BEGIN;

-- ===========================================
-- E2E テスト組織
-- ===========================================
INSERT INTO "organization" (id, name, slug, "createdAt", "updatedAt")
VALUES (
  'e2e-test-org-001',
  'E2E Test Team',
  'e2e-test-team',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- E2E テストユーザー
-- ===========================================
-- オーナー
INSERT INTO "user" (id, name, email, "emailVerified", "lastActiveOrganizationId", "createdAt", "updatedAt")
VALUES (
  'e2e-user-owner-001',
  'E2E Owner',
  'e2e-owner@gibberishlab.com',
  true,
  'e2e-test-org-001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 管理者
INSERT INTO "user" (id, name, email, "emailVerified", "lastActiveOrganizationId", "createdAt", "updatedAt")
VALUES (
  'e2e-user-admin-001',
  'E2E Admin',
  'e2e-admin@gibberishlab.com',
  true,
  'e2e-test-org-001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- メンバー
INSERT INTO "user" (id, name, email, "emailVerified", "lastActiveOrganizationId", "createdAt", "updatedAt")
VALUES (
  'e2e-user-member-001',
  'E2E Member',
  'e2e-member@gibberishlab.com',
  true,
  'e2e-test-org-001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 組織メンバーシップ
-- ===========================================
INSERT INTO "member" (id, "userId", "organizationId", role, "createdAt", "updatedAt")
VALUES
  ('e2e-member-owner-001', 'e2e-user-owner-001', 'e2e-test-org-001', 'owner', NOW(), NOW()),
  ('e2e-member-admin-001', 'e2e-user-admin-001', 'e2e-test-org-001', 'admin', NOW(), NOW()),
  ('e2e-member-member-001', 'e2e-user-member-001', 'e2e-test-org-001', 'member', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- アカウント（パスワード認証用）
-- ===========================================
-- 注意: passwordフィールドはBetterAuthのハッシュ形式が必要
-- 以下は argon2id でハッシュ化された "E2eTestPassword123!" の例
-- 実際のハッシュはBetterAuthで生成する必要がある

-- オプション1: UIからサインアップしてからこのSQLでロールを更新
-- オプション2: scripts/seed-e2e.ts を使用（サーバー起動が必要）

-- プレースホルダーとしてアカウントを作成（パスワードなし）
-- 後でUIサインアップ or スクリプトで設定
INSERT INTO "account" (id, "userId", "accountId", "providerId", "createdAt", "updatedAt")
VALUES
  ('e2e-account-owner-001', 'e2e-user-owner-001', 'e2e-user-owner-001', 'credential', NOW(), NOW()),
  ('e2e-account-admin-001', 'e2e-user-admin-001', 'e2e-user-admin-001', 'credential', NOW(), NOW()),
  ('e2e-account-member-001', 'e2e-user-member-001', 'e2e-user-member-001', 'credential', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ===========================================
-- 確認クエリ
-- ===========================================
-- SELECT u.email, u.name, m.role, o.name as org_name
-- FROM "user" u
-- JOIN "member" m ON u.id = m."userId"
-- JOIN "organization" o ON m."organizationId" = o.id
-- WHERE u.email LIKE 'e2e-%';
