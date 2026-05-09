CREATE TYPE "public"."outreach_status" AS ENUM('draft', 'sent', 'scheduled', 'discarded');--> statement-breakpoint
ALTER TYPE "public"."agent_type" ADD VALUE 'client_insights';--> statement-breakpoint
ALTER TYPE "public"."agent_type" ADD VALUE 'client_briefing';--> statement-breakpoint
ALTER TYPE "public"."agent_type" ADD VALUE 'outreach_composer';--> statement-breakpoint
ALTER TYPE "public"."agent_type" ADD VALUE 'crm_query';--> statement-breakpoint
CREATE TABLE "outreach_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"insight_id" uuid,
	"channel" text DEFAULT 'email' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"tone" text,
	"status" "outreach_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_insight_id_ai_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."ai_insights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outreach_drafts_client_idx" ON "outreach_drafts" USING btree ("client_id","created_at");