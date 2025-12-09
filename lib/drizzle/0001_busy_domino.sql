CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('canceled', 'refunded', '3ds_required', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."rule_action" AS ENUM('block', 'review', 'require_3ds', 'alert_only');--> statement-breakpoint
CREATE TYPE "public"."list_type" AS ENUM('email', 'ip', 'country', 'card_bin');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_id" text,
	"metadata" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "blacklist_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" "list_type" NOT NULL,
	"value" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fraud_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"paymentIntentId" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"email" text,
	"riskScore" integer NOT NULL,
	"recommandation" text NOT NULL,
	"reasoning" text NOT NULL,
	"signals" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"agentsUsed" text[] DEFAULT '{}' NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"action" "action" DEFAULT 'accepted' NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"country" text,
	"actualFraud" boolean,
	"falsePositive" boolean,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fraud_analyses_paymentIntentId_unique" UNIQUE("paymentIntentId")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"response" jsonb,
	"status_code" integer,
	"processed" boolean DEFAULT false NOT NULL,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	CONSTRAINT "webhook_logs_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"block_threshold" integer DEFAULT 80 NOT NULL,
	"review_threshold" integer DEFAULT 60 NOT NULL,
	"require_3ds_score" integer DEFAULT 70 NOT NULL,
	"email_alerts" boolean DEFAULT true NOT NULL,
	"slack_webhook" text,
	"discord_webhook" text,
	"auto_block" boolean DEFAULT true NOT NULL,
	"shadow_mode" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action" "rule_action" NOT NULL,
	"threshold" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whitelist_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"type" "list_type" NOT NULL,
	"value" text NOT NULL,
	"reason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "stripe_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"scope" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"webhook_endpoint_id" text,
	"webhook_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_sync_at" timestamp,
	CONSTRAINT "stripe_connections_stripe_account_id_unique" UNIQUE("stripe_account_id")
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "sms_notifications" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "email_notifications" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_entries" ADD CONSTRAINT "blacklist_entries_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fraud_analyses" ADD CONSTRAINT "fraud_analyses_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whitelist_entries" ADD CONSTRAINT "whitelist_entries_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_connections" ADD CONSTRAINT "stripe_connections_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;