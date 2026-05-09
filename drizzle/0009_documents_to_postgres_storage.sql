-- Switch document storage from Vercel Blob URLs to in-Postgres bytea.
-- The documents table has no rows yet, so this is a clean replace.

ALTER TABLE "documents" DROP COLUMN IF EXISTS "blob_url";
ALTER TABLE "documents" DROP COLUMN IF EXISTS "blob_pathname";
ALTER TABLE "documents" ADD COLUMN "content" bytea NOT NULL;
