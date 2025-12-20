-- Chat threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message roles
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_threads_org ON chat_threads(organization_id);
CREATE INDEX idx_threads_user ON chat_threads(user_id);
CREATE INDEX idx_threads_updated ON chat_threads(updated_at DESC);
CREATE INDEX idx_messages_thread ON chat_messages(thread_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at);

-- RLS
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Threads RLS policies
CREATE POLICY "Users can view own threads"
  ON chat_threads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create threads"
  ON chat_threads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own threads"
  ON chat_threads FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own threads"
  ON chat_threads FOR DELETE
  USING (user_id = auth.uid());

-- Messages RLS policies
CREATE POLICY "Users can view messages in own threads"
  ON chat_messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own threads"
  ON chat_messages FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

-- Update trigger for threads
CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
