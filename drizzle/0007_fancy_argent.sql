CREATE TYPE "public"."proactive_alert_kind" AS ENUM('anniversary', 'trip_imminent', 'dormancy', 'nps_attention', 'high_value_inactive');--> statement-breakpoint
CREATE TYPE "public"."proactive_alert_severity" AS ENUM('info', 'warn', 'urgent');--> statement-breakpoint
CREATE TABLE "proactive_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"kind" "proactive_alert_kind" NOT NULL,
	"severity" "proactive_alert_severity" DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"suggested_action" text,
	"dedupe_key" text NOT NULL,
	"detail" jsonb,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "client_since" date;--> statement-breakpoint
ALTER TABLE "proactive_alerts" ADD CONSTRAINT "proactive_alerts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proactive_alerts_client_idx" ON "proactive_alerts" USING btree ("client_id","triggered_at");--> statement-breakpoint
CREATE INDEX "proactive_alerts_dedupe_idx" ON "proactive_alerts" USING btree ("client_id","kind","dedupe_key");