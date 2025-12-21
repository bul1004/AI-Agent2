-- 000_better_auth_tables.sql
-- BetterAuth authentication tables for multi-tenant SaaS

BEGIN;

-- ========================================
-- BETTERAUTH TABLES
-- ========================================

-- Users table
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  image TEXT,
  "lastActiveOrganizationId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table
CREATE TABLE "organization" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "activeOrganizationId" TEXT REFERENCES "organization"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table (for OAuth providers like Google)
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  "idToken" TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Verification tokens (for email verification, password reset)
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members table
CREATE TABLE "member" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "organizationId")
);

-- Organization Invitations table
CREATE TABLE "invitation" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  "inviterId" TEXT REFERENCES "user"(id),
  "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- JWKS (JSON Web Key Set) for JWT signing
CREATE TABLE "jwks" (
  id TEXT PRIMARY KEY,
  "publicKey" TEXT NOT NULL,
  "privateKey" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for user.lastActiveOrganizationId after organization table exists
ALTER TABLE "user"
  ADD CONSTRAINT user_last_active_organization_fkey
  FOREIGN KEY ("lastActiveOrganizationId")
  REFERENCES organization(id)
  ON DELETE SET NULL;

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_last_active_org ON "user"("lastActiveOrganizationId");

CREATE INDEX idx_session_user_id ON "session"("userId");
CREATE INDEX idx_session_token ON "session"(token);
CREATE INDEX idx_session_expires_at ON "session"("expiresAt");
CREATE INDEX idx_session_active_org ON "session"("activeOrganizationId");

CREATE INDEX idx_account_user_id ON "account"("userId");
CREATE INDEX idx_account_provider ON "account"("providerId", "accountId");

CREATE INDEX idx_member_user_id ON "member"("userId");
CREATE INDEX idx_member_org_id ON "member"("organizationId");

CREATE INDEX idx_invitation_email ON "invitation"(email);
CREATE INDEX idx_invitation_org_id ON "invitation"("organizationId");
CREATE INDEX idx_invitation_status ON "invitation"(status);

CREATE INDEX idx_verification_identifier ON "verification"(identifier);

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE "user" IS 'BetterAuth users table';
COMMENT ON TABLE "session" IS 'BetterAuth sessions table';
COMMENT ON TABLE "account" IS 'BetterAuth accounts table for OAuth and password auth';
COMMENT ON TABLE "verification" IS 'BetterAuth verification tokens for email/password reset';
COMMENT ON TABLE "organization" IS 'BetterAuth organizations for multi-tenancy';
COMMENT ON TABLE "member" IS 'BetterAuth organization members with roles';
COMMENT ON TABLE "invitation" IS 'BetterAuth organization invitations';
COMMENT ON TABLE "jwks" IS 'BetterAuth JWKS for JWT signing';
COMMENT ON COLUMN "user"."lastActiveOrganizationId" IS 'Stores the last active organization ID for session restoration after sign-in';

COMMIT;
