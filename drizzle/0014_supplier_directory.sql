-- Supplier directory v1 (structured only; embeddings later).

CREATE TYPE "supplier_kind" AS ENUM (
  'hotel', 'dmc', 'restaurant', 'transfer',
  'experience', 'operator', 'airline', 'other'
);

CREATE TYPE "price_tier" AS ENUM (
  'luxury', 'premium', 'boutique', 'standard'
);

CREATE TABLE "suppliers" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"           text NOT NULL,
  "kind"           supplier_kind NOT NULL,
  "city"           text,
  "country"        text,
  "region"         text,
  "price_tier"     price_tier,
  "amenities"      text[] NOT NULL DEFAULT '{}',
  "notes"          text,
  "preferred"      boolean NOT NULL DEFAULT false,
  "virtuoso"       boolean NOT NULL DEFAULT false,
  "commission_pct" numeric(5,4),
  "contact"        text,
  "website"        text,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "suppliers_kind_idx"      ON "suppliers" ("kind");
CREATE INDEX "suppliers_city_idx"      ON "suppliers" ("city");
CREATE INDEX "suppliers_preferred_idx" ON "suppliers" ("preferred");

-- GIN index on amenities so containment queries are fast.
CREATE INDEX "suppliers_amenities_idx" ON "suppliers" USING GIN ("amenities");
