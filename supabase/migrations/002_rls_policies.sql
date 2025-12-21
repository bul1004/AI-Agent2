-- 002_rls_policies.sql
-- Row Level Security policies for BetterAuth tables

BEGIN;

-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jwks" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- BETTERAUTH TABLE POLICIES
-- ========================================

-- user
CREATE POLICY user_select_self ON "user"
  FOR SELECT USING (current_jwt_user() = id);

CREATE POLICY user_update_self ON "user"
  FOR UPDATE USING (current_jwt_user() = id);

CREATE POLICY user_insert_service ON "user"
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY user_delete_service ON "user"
  FOR DELETE USING ((SELECT auth.role()) = 'service_role');

-- account
CREATE POLICY account_select_self ON "account"
  FOR SELECT USING (current_jwt_user() = "userId");

CREATE POLICY account_update_self ON "account"
  FOR UPDATE USING (current_jwt_user() = "userId");

CREATE POLICY account_insert_service ON "account"
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY account_delete_service ON "account"
  FOR DELETE USING ((SELECT auth.role()) = 'service_role');

-- session
CREATE POLICY session_select_self ON "session"
  FOR SELECT USING (current_jwt_user() = "userId");

CREATE POLICY session_update_self ON "session"
  FOR UPDATE USING (current_jwt_user() = "userId");

CREATE POLICY session_delete_self ON "session"
  FOR DELETE USING (current_jwt_user() = "userId");

CREATE POLICY session_insert_service ON "session"
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');

-- organization
CREATE POLICY organization_select_member ON "organization"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = organization.id
        AND m."userId" = current_jwt_user()
    )
  );

CREATE POLICY organization_update_admin ON "organization"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = organization.id
        AND m."userId" = current_jwt_user()
        AND m.role IN ('owner','admin')
    )
  );

CREATE POLICY organization_delete_admin ON "organization"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = organization.id
        AND m."userId" = current_jwt_user()
        AND m.role IN ('owner','admin')
    )
  );

CREATE POLICY organization_insert_service ON "organization"
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');

-- member
CREATE POLICY member_select_member ON member
  FOR SELECT USING (
    "userId" = current_jwt_user()
    OR EXISTS (
      SELECT 1 FROM member m2
      WHERE m2."organizationId" = member."organizationId"
        AND m2."userId" = current_jwt_user()
        AND m2.role IN ('owner','admin')
    )
  );

CREATE POLICY member_update_admin ON member
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM member m2
      WHERE m2."organizationId" = member."organizationId"
        AND m2."userId" = current_jwt_user()
        AND m2.role IN ('owner','admin')
    )
  );

CREATE POLICY member_delete_admin ON member
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM member m2
      WHERE m2."organizationId" = member."organizationId"
        AND m2."userId" = current_jwt_user()
        AND m2.role IN ('owner','admin')
    )
  );

CREATE POLICY member_insert_admin ON member
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM member m2
      WHERE m2."organizationId" = member."organizationId"
        AND m2."userId" = current_jwt_user()
        AND m2.role IN ('owner','admin')
    )
  );

-- invitation
CREATE POLICY invitation_select_allowed ON invitation
  FOR SELECT USING (
    invitation."email" = (SELECT current_setting('request.jwt.claims', true)::json->>'email')
    OR (SELECT current_jwt_user()) IN (
      SELECT m."userId" FROM member m
      WHERE m."organizationId" = invitation."organizationId"
        AND m.role IN ('owner','admin')
    )
  );

CREATE POLICY invitation_insert_admin ON invitation
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = invitation."organizationId"
        AND m."userId" = current_jwt_user()
        AND m.role IN ('owner','admin')
    )
  );

CREATE POLICY invitation_update_admin ON invitation
  FOR UPDATE USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = invitation."organizationId"
        AND m."userId" = current_jwt_user()
        AND m.role IN ('owner','admin')
    )
  );

CREATE POLICY invitation_delete_admin ON invitation
  FOR DELETE USING (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = invitation."organizationId"
        AND m."userId" = current_jwt_user()
        AND m.role IN ('owner','admin')
    )
  );

-- verification (service role only)
CREATE POLICY verification_service_only ON verification
  FOR ALL USING ((SELECT auth.role()) = 'service_role') WITH CHECK ((SELECT auth.role()) = 'service_role');

-- jwks (service role only - contains private keys)
CREATE POLICY jwks_service_only ON jwks
  FOR ALL USING ((SELECT auth.role()) = 'service_role') WITH CHECK ((SELECT auth.role()) = 'service_role');

COMMIT;
