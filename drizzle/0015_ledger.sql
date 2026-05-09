-- Ledger entries — money movement (single-table, not double-entry).

CREATE TYPE "ledger_entry_kind" AS ENUM (
  'client_invoice',
  'client_payment',
  'supplier_payment',
  'commission_received',
  'itd_payout'
);

CREATE TYPE "ledger_status" AS ENUM (
  'pending', 'completed', 'cancelled'
);

CREATE TABLE "ledger_entries" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id"          uuid REFERENCES "bookings"("id") ON DELETE SET NULL,
  "trip_id"             uuid REFERENCES "trips"("id") ON DELETE SET NULL,
  "itd_user_id"         uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "kind"                ledger_entry_kind NOT NULL,
  "amount"              numeric(14,2) NOT NULL,
  "currency"            text NOT NULL,
  "reference"           text,
  "status"              ledger_status NOT NULL DEFAULT 'pending',
  "occurred_on"         date NOT NULL,
  "notes"               text,
  "recorded_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at"          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "ledger_booking_idx" ON "ledger_entries" ("booking_id");
CREATE INDEX "ledger_trip_idx"    ON "ledger_entries" ("trip_id");
CREATE INDEX "ledger_itd_idx"     ON "ledger_entries" ("itd_user_id");
CREATE INDEX "ledger_kind_idx"    ON "ledger_entries" ("kind");
