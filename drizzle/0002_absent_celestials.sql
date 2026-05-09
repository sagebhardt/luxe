CREATE TYPE "public"."provider_kind" AS ENUM('google_vertex', 'google_ai', 'openai', 'anthropic');--> statement-breakpoint
CREATE TABLE "agent_configs" (
	"agent_type" "agent_type" PRIMARY KEY NOT NULL,
	"provider_id" uuid NOT NULL,
	"model_name" text NOT NULL,
	"system_prompt" text,
	"settings" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"kind" "provider_kind" NOT NULL,
	"config" jsonb,
	"credentials_env_var" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_provider_id_model_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."model_providers"("id") ON DELETE restrict ON UPDATE no action;