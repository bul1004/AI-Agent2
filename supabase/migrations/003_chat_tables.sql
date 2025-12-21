-- 003_chat_tables.sql
-- Chat threads and messages for AI assistant

BEGIN;

-- ========================================
-- CHAT TABLES
-- ========================================

-- Chat threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Message roles
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  "threadId" TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_threads_org ON chat_threads("organizationId");
CREATE INDEX idx_threads_user ON chat_threads("userId");
CREATE INDEX idx_threads_updated ON chat_threads("updatedAt" DESC);
CREATE INDEX idx_messages_thread ON chat_messages("threadId");
CREATE INDEX idx_messages_created ON chat_messages("createdAt");

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Threads policies (user can access their own threads)
CREATE POLICY chat_threads_select ON chat_threads
  FOR SELECT USING (
    "userId" = current_jwt_user()
    OR EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = chat_threads."organizationId"
        AND m."userId" = current_jwt_user()
    )
  );

CREATE POLICY chat_threads_insert ON chat_threads
  FOR INSERT WITH CHECK (
    "userId" = current_jwt_user()
  );

CREATE POLICY chat_threads_update ON chat_threads
  FOR UPDATE USING (
    "userId" = current_jwt_user()
  );

CREATE POLICY chat_threads_delete ON chat_threads
  FOR DELETE USING (
    "userId" = current_jwt_user()
  );

-- Messages policies
CREATE POLICY chat_messages_select ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_threads t
      WHERE t.id = chat_messages."threadId"
        AND (
          t."userId" = current_jwt_user()
          OR EXISTS (
            SELECT 1 FROM member m
            WHERE m."organizationId" = t."organizationId"
              AND m."userId" = current_jwt_user()
          )
        )
    )
  );

CREATE POLICY chat_messages_insert ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_threads t
      WHERE t.id = chat_messages."threadId"
        AND t."userId" = current_jwt_user()
    )
  );

-- ========================================
-- TRIGGERS
-- ========================================

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
