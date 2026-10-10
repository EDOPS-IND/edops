CREATE SCHEMA "platform";
--> statement-breakpoint
CREATE SCHEMA "security";
--> statement-breakpoint
CREATE TABLE "audit"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid,
	"actor_user_id" uuid NOT NULL,
	"actor_role" varchar(64),
	"action" varchar(120) NOT NULL,
	"resource_type" varchar(120) NOT NULL,
	"resource_id" uuid,
	"before_data" jsonb,
	"after_data" jsonb,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"category" varchar(64) NOT NULL,
	"description" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	CONSTRAINT "features_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "security"."login_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid,
	"ip_address" varchar(64),
	"device" varchar(120),
	"browser" varchar(120),
	"event_type" varchar(64) DEFAULT 'login' NOT NULL,
	"status" varchar(32) DEFAULT 'success' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."plan_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"limit_value" integer,
	"configuration" jsonb
);
--> statement-breakpoint
CREATE TABLE "platform"."plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(64) NOT NULL,
	"description" text,
	"monthly_price" numeric(12, 2) NOT NULL,
	"annual_price" numeric(12, 2) NOT NULL,
	"currency" varchar(16) DEFAULT 'INR' NOT NULL,
	"trial_days" integer DEFAULT 14 NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "analytics"."platform_daily_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_date" date NOT NULL,
	"school_count" integer DEFAULT 0 NOT NULL,
	"active_school_count" integer DEFAULT 0 NOT NULL,
	"student_count" integer DEFAULT 0 NOT NULL,
	"teacher_count" integer DEFAULT 0 NOT NULL,
	"parent_count" integer DEFAULT 0 NOT NULL,
	"active_subscriptions" integer DEFAULT 0 NOT NULL,
	"mrr" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"arr" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."platform_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"invoice_number" varchar(64) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"tax" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	CONSTRAINT "platform_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "platform"."platform_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(64) NOT NULL,
	"gateway_transaction_id" varchar(255),
	"status" varchar(32) DEFAULT 'completed' NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics"."school_daily_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"student_count" integer DEFAULT 0 NOT NULL,
	"teacher_count" integer DEFAULT 0 NOT NULL,
	"staff_count" integer DEFAULT 0 NOT NULL,
	"parent_count" integer DEFAULT 0 NOT NULL,
	"attendance_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"fee_expected" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"fee_collected" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"fee_pending" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"assignment_completion" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"average_academic_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."school_feature_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"enabled" boolean NOT NULL,
	"limit_value" integer,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "platform"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"billing_cycle" varchar(32) DEFAULT 'monthly' NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security"."login_events" ADD CONSTRAINT "login_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."plan_features" ADD CONSTRAINT "plan_features_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "platform"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."plan_features" ADD CONSTRAINT "plan_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "platform"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."platform_invoices" ADD CONSTRAINT "platform_invoices_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."platform_invoices" ADD CONSTRAINT "platform_invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "platform"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."platform_payments" ADD CONSTRAINT "platform_payments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."platform_payments" ADD CONSTRAINT "platform_payments_invoice_id_platform_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "platform"."platform_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."school_daily_metrics" ADD CONSTRAINT "school_daily_metrics_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."school_feature_overrides" ADD CONSTRAINT "school_feature_overrides_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."school_feature_overrides" ADD CONSTRAINT "school_feature_overrides_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "platform"."features"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."subscriptions" ADD CONSTRAINT "subscriptions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "school"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "platform"."plans"("id") ON DELETE no action ON UPDATE no action;