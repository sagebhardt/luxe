-- Multi-tenant: introduce users (ITDs + admins) and ownership on clients.

CREATE TYPE "user_role" AS ENUM ('itd', 'admin');

CREATE TABLE "users" (
  "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerk_user_id"        text NOT NULL UNIQUE,
  "name"                 text,
  "email"                text,
  "role"                 user_role NOT NULL DEFAULT 'itd',
  "commission_pct_base"  numeric(5,4) NOT NULL DEFAULT 0.5000,
  "created_at"           timestamptz NOT NULL DEFAULT now(),
  "updated_at"           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "users_clerk_idx" ON "users" ("clerk_user_id");

ALTER TABLE "clients"
  ADD COLUMN "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
CREATE INDEX "clients_owner_idx" ON "clients" ("owner_id");
