-- Mid-trip companion + NPS post-trip
--
-- 1. trip_alerts gains client_visible (operator must opt-in to surface
--    on the share page) and signed_by (ITD's name, lets the alert read
--    as a personal note rather than a system warning).
-- 2. nps_responses keeps per-trip history; clients.nps_score remains
--    the cached latest read used by the proactive monitor.

ALTER TABLE "trip_alerts"
  ADD COLUMN "client_visible" boolean NOT NULL DEFAULT false,
  ADD COLUMN "signed_by" text;

CREATE TABLE "nps_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "score" integer NOT NULL,
  "comment" text,
  "submitted_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "nps_score_range" CHECK ("score" >= 0 AND "score" <= 10),
  CONSTRAINT "nps_one_per_trip" UNIQUE ("trip_id")
);

CREATE INDEX "nps_responses_client_idx" ON "nps_responses" ("client_id", "submitted_at");
