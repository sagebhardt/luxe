-- Add extracted fields + original size to documents
ALTER TABLE "documents" ADD COLUMN "extracted_fields" jsonb;
ALTER TABLE "documents" ADD COLUMN "original_size_bytes" integer;
