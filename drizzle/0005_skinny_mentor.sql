ALTER TABLE "trips" ADD COLUMN "client_narrative" jsonb;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "client_narrative_generated_at" timestamp with time zone;