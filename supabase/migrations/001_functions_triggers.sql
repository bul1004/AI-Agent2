-- 001_functions_triggers.sql
-- Helper functions, audit system, and triggers

BEGIN;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================
-- JWT HELPER FUNCTIONS (BetterAuth compatible)
-- ========================================

-- Get user ID from JWT
CREATE OR REPLACE FUNCTION current_jwt_user()
RETURNS TEXT AS $func$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'sub';
END;
$func$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Get organization role from JWT
CREATE OR REPLACE FUNCTION current_jwt_org_role()
RETURNS TEXT AS $func$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'org_role';
END;
$func$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Get organization ID from JWT
CREATE OR REPLACE FUNCTION get_betterauth_org_id()
RETURNS TEXT AS $$
DECLARE
  org_id TEXT;
  user_id TEXT;
BEGIN
  org_id := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    (SELECT auth.jwt() ->> 'org_id')
  );

  IF org_id IS NULL THEN
    user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    RETURN user_id;
  END IF;

  RETURN org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Get organization role from JWT (alias)
CREATE OR REPLACE FUNCTION get_betterauth_org_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_role',
    (SELECT auth.jwt() ->> 'org_role')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- ========================================
-- CONTEXT-AWARE USER/ORG ID FUNCTIONS
-- ========================================

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
DECLARE
    jwt_claims JSON;
BEGIN
    BEGIN
        jwt_claims := auth.jwt();
        RETURN NULLIF(jwt_claims ->> 'sub', '');
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE;

-- Get current organization ID from JWT (falls back to user ID for personal accounts)
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS TEXT AS $$
DECLARE
    jwt_claims JSON;
    org_id TEXT;
BEGIN
    BEGIN
        jwt_claims := auth.jwt();
        org_id := NULLIF(jwt_claims ->> 'org_id', '');
        IF org_id IS NOT NULL THEN
            RETURN org_id;
        END IF;
        -- Fallback to user ID for personal accounts
        RETURN NULLIF(jwt_claims ->> 'sub', '');
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE;

-- Get current organization role
CREATE OR REPLACE FUNCTION get_current_org_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_role',
    ''
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_org_role() TO authenticated;

COMMENT ON FUNCTION get_current_user_id() IS 'Returns current user ID from JWT claims.';
COMMENT ON FUNCTION get_current_org_id() IS 'Returns current organization ID from JWT claims.';
COMMENT ON FUNCTION get_current_org_role() IS 'Returns current organization role from JWT.';

-- ========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;
