-- 005_vector_tables.sql
-- Vector embeddings for RAG (Retrieval Augmented Generation)

BEGIN;

-- ========================================
-- EXTENSIONS
-- ========================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- DOCUMENT TABLES
-- ========================================

-- Documents table for uploaded files
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  "fileUrl" TEXT,                        -- R2 or Cloudflare Images URL
  "fileType" TEXT,                       -- 'pdf', 'image', 'text', etc.
  metadata JSONB DEFAULT '{}',
  "createdBy" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                -- Chunked text content
  embedding vector(1536),               -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_documents_org ON documents("organizationId");
CREATE INDEX idx_documents_type ON documents("fileType");
CREATE INDEX idx_documents_created_by ON documents("createdBy");
CREATE INDEX idx_embeddings_org ON embeddings("organizationId");
CREATE INDEX idx_embeddings_doc ON embeddings("documentId");

-- HNSW index for fast vector similarity search
CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Vector search function
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  p_organization_id TEXT,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id TEXT,
  document_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e."documentId",
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  WHERE e."organizationId" = p_organization_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY documents_select ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = documents."organizationId"
        AND m."userId" = current_jwt_user()
    )
  );

CREATE POLICY documents_insert ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = documents."organizationId"
        AND m."userId" = current_jwt_user()
    )
    AND "createdBy" = current_jwt_user()
  );

CREATE POLICY documents_update ON documents
  FOR UPDATE USING (
    "createdBy" = current_jwt_user()
    OR EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = documents."organizationId"
        AND m."userId" = current_jwt_user()
        AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY documents_delete ON documents
  FOR DELETE USING (
    "createdBy" = current_jwt_user()
    OR EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = documents."organizationId"
        AND m."userId" = current_jwt_user()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Embeddings policies
CREATE POLICY embeddings_select ON embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = embeddings."organizationId"
        AND m."userId" = current_jwt_user()
    )
  );

CREATE POLICY embeddings_insert ON embeddings
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM member m
      WHERE m."organizationId" = embeddings."organizationId"
        AND m."userId" = current_jwt_user()
    )
  );

CREATE POLICY embeddings_delete ON embeddings
  FOR DELETE USING (
    (SELECT auth.role()) = 'service_role'
  );

-- ========================================
-- TRIGGERS
-- ========================================

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
