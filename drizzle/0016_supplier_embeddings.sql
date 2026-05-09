-- Supplier embeddings (pgvector). 768-dim matches Vertex
-- text-multilingual-embedding-002 (Spanish-capable).

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "suppliers"
  ADD COLUMN "embedding" vector(768),
  ADD COLUMN "embedding_updated_at" timestamptz;

-- HNSW index for cosine-distance search. m + ef_construction tuned for
-- the small-catalog (low thousands) regime; we can re-tune later.
CREATE INDEX "suppliers_embedding_hnsw_idx"
  ON "suppliers"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
