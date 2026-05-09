-- Audit log + Clerk invitations + per-line sell currency.

CREATE TYPE "audit_action" AS ENUM (
  'user_role_change',
  'user_commission_change',
  'client_owner_reassign',
  'user_invited',
  'user_invitation_revoked'
);

CREATE TABLE "audit_log" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action"        audit_action NOT NULL,
  "target_type"   text NOT NULL,
  "target_id"     text,
  "before"        jsonb,
  "after"         jsonb,
  "note"          text,
  "created_at"    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "audit_log_created_idx" ON "audit_log" ("created_at" DESC);
CREATE INDEX "audit_log_actor_idx"   ON "audit_log" ("actor_user_id");

CREATE TABLE "user_invitations" (
  "id"                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerk_invitation_id"         text NOT NULL UNIQUE,
  "email"                       text NOT NULL,
  "intended_role"               user_role NOT NULL DEFAULT 'itd',
  "intended_commission_pct_base" numeric(5,4) NOT NULL DEFAULT 0.5000,
  "invited_by_user_id"          uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "status"                      text NOT NULL DEFAULT 'pending',
  "created_at"                  timestamptz NOT NULL DEFAULT now(),
  "accepted_at"                 timestamptz
);
CREATE INDEX "user_invitations_status_idx" ON "user_invitations" ("status");

-- Per-line sell currency on bookings.
ALTER TABLE "bookings" ADD COLUMN "sell_currency"     text;
ALTER TABLE "bookings" ADD COLUMN "sell_fx_to_base"   numeric(14,8);
