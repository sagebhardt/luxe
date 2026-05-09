CREATE TYPE "public"."activity_type" AS ENUM('call', 'email', 'booking', 'agent_action', 'review', 'note', 'trip_event');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('waiting', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('flight', 'hotel', 'itinerary', 'dining');--> statement-breakpoint
CREATE TYPE "public"."booking_kind" AS ENUM('flight', 'hotel', 'dining', 'experience', 'transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('research', 'pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."client_tag" AS ENUM('vip', 'active', 'prospect', 'dormant');--> statement-breakpoint
CREATE TYPE "public"."decision_status" AS ENUM('pending_approval', 'approved', 'rejected', 'booked');--> statement-breakpoint
CREATE TYPE "public"."log_avatar" AS ENUM('orchestrator', 'sub_agent');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'active', 'pending', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"trip_id" uuid,
	"type" "activity_type" NOT NULL,
	"actor" text,
	"summary" text NOT NULL,
	"detail" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"agent_run_id" uuid,
	"agent" "agent_type" NOT NULL,
	"headline" text NOT NULL,
	"rationale" text,
	"recommendation" jsonb NOT NULL,
	"alternatives" jsonb,
	"status" "decision_status" DEFAULT 'pending_approval' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_log_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"avatar" "log_avatar" DEFAULT 'sub_agent' NOT NULL,
	"body" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"agent" "agent_type" NOT NULL,
	"status" "agent_run_status" DEFAULT 'waiting' NOT NULL,
	"headline" text,
	"detail" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"decision_id" uuid,
	"kind" "booking_kind" NOT NULL,
	"title" text NOT NULL,
	"provider" text,
	"detail" text,
	"price_cents" integer,
	"status" "booking_status" DEFAULT 'research' NOT NULL,
	"occurs_on" date,
	"metadata" jsonb,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"tag" "client_tag" DEFAULT 'prospect' NOT NULL,
	"avatar_color" text,
	"nps_score" integer,
	"lifetime_value_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traveler_preferences" (
	"client_id" uuid PRIMARY KEY NOT NULL,
	"hotel_style" text,
	"seat_preference" text,
	"flight_class" text,
	"dining_style" text,
	"dietary_restrictions" text[],
	"loyalty_programs" jsonb,
	"preferred_destinations" text[],
	"pace_preference" text,
	"extras" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"destination" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"traveler_count" integer DEFAULT 1 NOT NULL,
	"budget_cents" integer,
	"committed_cents" integer DEFAULT 0 NOT NULL,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_decisions" ADD CONSTRAINT "agent_decisions_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_decisions" ADD CONSTRAINT "agent_decisions_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_log_messages" ADD CONSTRAINT "agent_log_messages_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_decision_id_agent_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."agent_decisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traveler_preferences" ADD CONSTRAINT "traveler_preferences_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_client_idx" ON "activity_log" USING btree ("client_id","occurred_at");--> statement-breakpoint
CREATE INDEX "activity_trip_idx" ON "activity_log" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "agent_decisions_trip_idx" ON "agent_decisions" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "agent_decisions_status_idx" ON "agent_decisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_log_trip_idx" ON "agent_log_messages" USING btree ("trip_id","occurred_at");--> statement-breakpoint
CREATE INDEX "agent_runs_trip_idx" ON "agent_runs" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "bookings_trip_idx" ON "bookings" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clients_tag_idx" ON "clients" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "trips_client_idx" ON "trips" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");