-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table for uploaded files
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,                        -- R2 or Cloudflare Images URL
  file_type TEXT,                       -- 'pdf', 'image', 'text', etc.
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                -- Chunked text content
  embedding vector(1536),               -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(file_type);
CREATE INDEX idx_embeddings_org ON embeddings(organization_id);
CREATE INDEX idx_embeddings_doc ON embeddings(document_id);

-- HNSW index for fast vector similarity search
CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Vector search function
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  p_organization_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE e.organization_id = p_organization_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Documents RLS policies
CREATE POLICY "Members can view org documents"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create documents"
  ON documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Document creators can update"
  ON documents FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Document creators can delete"
  ON documents FOR DELETE
  USING (created_by = auth.uid());

-- Embeddings RLS policies
CREATE POLICY "Members can view org embeddings"
  ON embeddings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Update trigger for documents
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
