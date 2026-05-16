CREATE TYPE "public"."categoria" AS ENUM('SUB_13', 'SUB_15', 'SUB_17', 'MAYORES', 'VETERANOS');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('DNI', 'FICHA_MEDICA', 'FOTO_CARNET', 'AUTORIZACION_PADRES', 'CONTRATO_CLUB', 'REGLAMENTO_FIRMADO', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."genero" AS ENUM('MASCULINO', 'FEMENINO', 'MIXTO');--> statement-breakpoint
CREATE TYPE "public"."canal_pago" AS ENUM('YAPE', 'PLIN', 'EFECTIVO', 'TRANSFERENCIA', 'BCP', 'BBVA', 'INTERBANK');--> statement-breakpoint
CREATE TYPE "public"."estado_jugador" AS ENUM('ACTIVO', 'SUSPENDIDO', 'INACTIVO', 'PENDIENTE_PAGO');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimiento" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text,
	"coach_name" varchar(120),
	"coach_lastname" varchar(120),
	"coach_dni" varchar(8),
	"coach_birthdate" timestamp,
	"coach_contact" varchar(20),
	"coach_email" varchar(120),
	"coach_photo_url" text,
	"delegate_name" varchar(120),
	"delegate_lastname" varchar(120),
	"delegate_dni" varchar(8),
	"delegate_birthdate" timestamp,
	"delegate_contact" varchar(20),
	"delegate_email" varchar(120),
	"delegate_photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"role" varchar(30) DEFAULT 'ADMIN' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"federation_code" varchar(20),
	"color_primary" varchar(7) DEFAULT '#1e3a5f',
	"color_secondary" varchar(7) DEFAULT '#fbbf24',
	"logo_url" text,
	"court_address" text,
	"foundation_date" timestamp,
	"district" varchar(50) DEFAULT 'Iquitos',
	"province" varchar(50) DEFAULT 'Maynas',
	"region" varchar(50) DEFAULT 'Loreto',
	"admin_email" varchar(100) NOT NULL,
	"admin_phone" varchar(15),
	"president_name" varchar(80),
	"president_lastname" varchar(80),
	"president_dni" varchar(8),
	"president_birthdate" timestamp,
	"president_contact" varchar(20),
	"president_email" varchar(120),
	"president_photo_url" text,
	"secretary_name" varchar(80),
	"secretary_lastname" varchar(80),
	"secretary_dni" varchar(8),
	"secretary_birthdate" timestamp,
	"secretary_contact" varchar(20),
	"secretary_email" varchar(120),
	"secretary_photo_url" text,
	"treasurer_name" varchar(80),
	"treasurer_lastname" varchar(80),
	"treasurer_dni" varchar(8),
	"treasurer_birthdate" timestamp,
	"treasurer_contact" varchar(20),
	"treasurer_email" varchar(120),
	"treasurer_photo_url" text,
	"active_plan" boolean DEFAULT true,
	"plan_expiration_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"short_identifier" varchar(20) NOT NULL,
	"correlative" serial NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_period_start" timestamp,
	"transfer_period_end" timestamp,
	"manual_override" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"type" "tipo_documento" NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text,
	"size_bytes" integer,
	"mime_type" varchar(100),
	"verified" boolean DEFAULT false,
	"verified_by" uuid,
	"verification_date" timestamp,
	"expiration_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(80) NOT NULL,
	"lastname" varchar(80) NOT NULL,
	"dni" varchar(8) NOT NULL,
	"birthdate" timestamp NOT NULL,
	"gender" "genero" NOT NULL,
	"category" "categoria" NOT NULL,
	"phone" varchar(15),
	"email" varchar(100),
	"address" text,
	"position" varchar(30),
	"jersey_number" integer,
	"size" varchar(5),
	"photo_url" text,
	"status" "estado_jugador" DEFAULT 'PENDIENTE_PAGO',
	"carnet_number" varchar(20),
	"tutor_name" varchar(100),
	"tutor_dni" varchar(8),
	"tutor_phone" varchar(15),
	"blood_type" varchar(5),
	"allergies" text,
	"emergency_contact" varchar(15),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasury" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"player_id" uuid,
	"type" "tipo_movimiento" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"concept" varchar(200) NOT NULL,
	"payment_channel" "canal_pago" DEFAULT 'EFECTIVO' NOT NULL,
	"operation_code" varchar(50),
	"proof_url" text,
	"registered_by" uuid,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_documents" ADD CONSTRAINT "player_documents_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_documents" ADD CONSTRAINT "player_documents_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury" ADD CONSTRAINT "treasury_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury" ADD CONSTRAINT "treasury_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_club_idx" ON "categories" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_unique" ON "categories" USING btree ("club_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "club_members_user_id_club_id_key" ON "club_members" USING btree ("user_id","club_id");--> statement-breakpoint
CREATE INDEX "club_members_user_idx" ON "club_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_slug_idx" ON "clubs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "clubs_email_idx" ON "clubs" USING btree ("admin_email");--> statement-breakpoint
CREATE INDEX "docs_hist_entity_idx" ON "document_history" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "docs_hist_type_idx" ON "document_history" USING btree ("type");--> statement-breakpoint
CREATE INDEX "docs_player_idx" ON "player_documents" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "docs_club_idx" ON "player_documents" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "players_club_category_idx" ON "players" USING btree ("club_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "players_dni_club_idx" ON "players" USING btree ("dni","club_id");--> statement-breakpoint
CREATE INDEX "players_lastname_idx" ON "players" USING btree ("lastname");--> statement-breakpoint
CREATE INDEX "treasury_club_date_idx" ON "treasury" USING btree ("club_id","transaction_date");--> statement-breakpoint
CREATE INDEX "treasury_club_type_idx" ON "treasury" USING btree ("club_id","type");