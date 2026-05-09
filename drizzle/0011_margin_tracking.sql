-- Margin tracking: per-line supplier cost + sell price, FX-locked at booking.

-- Trip-level base currency (the currency the trip is priced to the client in)
ALTER TABLE "trips" ADD COLUMN "base_currency" text NOT NULL DEFAULT 'USD';

-- Bookings cost/sell columns. NUMERIC(14,2) handles currencies with 0
-- decimals (CLP/JPY) without the "minor units" trap.
ALTER TABLE "bookings" ADD COLUMN "sell_amount" numeric(14,2);
ALTER TABLE "bookings" ADD COLUMN "cost_amount" numeric(14,2);
ALTER TABLE "bookings" ADD COLUMN "cost_currency" text;
ALTER TABLE "bookings" ADD COLUMN "cost_fx_to_base" numeric(14,8);
ALTER TABLE "bookings" ADD COLUMN "cost_locked" boolean NOT NULL DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN "cost_locked_at" timestamptz;

-- Backfill sell_amount from legacy price_cents (USD assumption)
UPDATE "bookings"
SET "sell_amount" = ROUND(price_cents::numeric / 100, 2)
WHERE price_cents IS NOT NULL AND sell_amount IS NULL;

-- FX rates cache
CREATE TABLE "fx_rates" (
  "from_currency" text NOT NULL,
  "to_currency"   text NOT NULL,
  "rate"          numeric(14,8) NOT NULL,
  "as_of"         date NOT NULL,
  "fetched_at"    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "fx_rates_pair_idx" ON "fx_rates" ("from_currency", "to_currency", "as_of");
CREATE UNIQUE INDEX "fx_rates_pair_unique" ON "fx_rates" ("from_currency", "to_currency", "as_of");

-- App settings (singleton row). Enforce id=1 with a check.
CREATE TABLE "app_settings" (
  "id"                 integer PRIMARY KEY DEFAULT 1 CHECK ("id" = 1),
  "reporting_currency" text NOT NULL DEFAULT 'USD',
  "updated_at"         timestamptz NOT NULL DEFAULT now()
);
INSERT INTO "app_settings" ("id", "reporting_currency") VALUES (1, 'USD')
  ON CONFLICT ("id") DO NOTHING;
