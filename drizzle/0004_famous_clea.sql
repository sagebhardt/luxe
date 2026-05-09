ALTER TYPE "public"."log_avatar" ADD VALUE 'client';--> statement-breakpoint
CREATE TABLE "trip_share_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"token" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_visited_at" timestamp with time zone,
	CONSTRAINT "trip_share_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "trip_share_tokens" ADD CONSTRAINT "trip_share_tokens_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trip_share_tokens_trip_idx" ON "trip_share_tokens" USING btree ("trip_id");