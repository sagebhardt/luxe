CREATE TYPE "public"."document_kind" AS ENUM('passport', 'visa', 'id', 'voucher', 'ticket', 'insurance', 'contract', 'receipt', 'photo', 'other');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"trip_id" uuid,
	"file_name" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"kind" "document_kind" DEFAULT 'other' NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"summary" text,
	"expires_on" date,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_client_idx" ON "documents" USING btree ("client_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "documents_trip_idx" ON "documents" USING btree ("trip_id");