CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TYPE "public"."tipo_documento_jugador" AS ENUM('FICHA_MEDICA', 'FOTO_CARNET', 'AUTORIZACION_PADRES', 'CONTRATO_CLUB', 'REGLAMENTO_FIRMADO', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'LEAGUE_ADMIN', 'CLUB_DELEGATE');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "gallery_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid,
	"url" text NOT NULL,
	"caption" varchar(255),
	"club_id" uuid,
	"registered_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ownership_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"previous_owner_id" uuid,
	"new_owner_id" uuid NOT NULL,
	"transfer_date" timestamp DEFAULT now() NOT NULL,
	"registered_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"league_id" uuid,
	"club_id" uuid,
	"role" "role" DEFAULT 'CLUB_DELEGATE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" RENAME COLUMN "coach_dni" TO "coach_document_number";--> statement-breakpoint
ALTER TABLE "categories" RENAME COLUMN "delegate_dni" TO "delegate_document_number";--> statement-breakpoint
ALTER TABLE "clubs" RENAME COLUMN "president_dni" TO "president_document_number";--> statement-breakpoint
ALTER TABLE "clubs" RENAME COLUMN "secretary_dni" TO "secretary_document_number";--> statement-breakpoint
ALTER TABLE "clubs" RENAME COLUMN "treasurer_dni" TO "treasurer_document_number";--> statement-breakpoint
ALTER TABLE "league_settings" RENAME COLUMN "manual_override" TO "is_manual_override";--> statement-breakpoint
ALTER TABLE "players" RENAME COLUMN "dni" TO "document_number";--> statement-breakpoint
ALTER TABLE "players" RENAME COLUMN "tutor_dni" TO "tutor_document_number";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "coach_document_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "coach_document_type" SET DEFAULT 'DNI'::text;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "delegate_document_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "delegate_document_type" SET DEFAULT 'DNI'::text;--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "president_document_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "president_document_type" SET DEFAULT 'DNI'::text;--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "secretary_document_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "secretary_document_type" SET DEFAULT 'DNI'::text;--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "treasurer_document_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "treasurer_document_type" SET DEFAULT 'DNI'::text;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "document_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "document_type" SET DEFAULT 'DNI'::text;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "tutor_document_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "tutor_document_type" SET DEFAULT 'DNI'::text;--> statement-breakpoint
DROP TYPE "public"."tipo_documento";--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('DNI', 'CE', 'PASAPORTE');--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "coach_document_type" SET DEFAULT 'DNI'::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "coach_document_type" SET DATA TYPE "public"."tipo_documento" USING "coach_document_type"::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "delegate_document_type" SET DEFAULT 'DNI'::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "delegate_document_type" SET DATA TYPE "public"."tipo_documento" USING "delegate_document_type"::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "president_document_type" SET DEFAULT 'DNI'::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "president_document_type" SET DATA TYPE "public"."tipo_documento" USING "president_document_type"::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "secretary_document_type" SET DEFAULT 'DNI'::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "secretary_document_type" SET DATA TYPE "public"."tipo_documento" USING "secretary_document_type"::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "treasurer_document_type" SET DEFAULT 'DNI'::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "clubs" ALTER COLUMN "treasurer_document_type" SET DATA TYPE "public"."tipo_documento" USING "treasurer_document_type"::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "document_type" SET DEFAULT 'DNI'::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "document_type" SET DATA TYPE "public"."tipo_documento" USING "document_type"::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "tutor_document_type" SET DEFAULT 'DNI'::"public"."tipo_documento";--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "tutor_document_type" SET DATA TYPE "public"."tipo_documento" USING "tutor_document_type"::"public"."tipo_documento";--> statement-breakpoint
DROP INDEX "players_dni_club_idx";--> statement-breakpoint
ALTER TABLE "player_documents" ALTER COLUMN "type" SET DATA TYPE "public"."tipo_documento_jugador" USING "type"::text::"public"."tipo_documento_jugador";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "league_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "coach_document_type" "tipo_documento" DEFAULT 'DNI';--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "delegate_document_type" "tipo_documento" DEFAULT 'DNI';--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "league_id" uuid;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "president_document_type" "tipo_documento" DEFAULT 'DNI';--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "secretary_document_type" "tipo_documento" DEFAULT 'DNI';--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "treasurer_document_type" "tipo_documento" DEFAULT 'DNI';--> statement-breakpoint
ALTER TABLE "league_settings" ADD COLUMN "banner_text" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "league_id" uuid;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "document_type" "tipo_documento" DEFAULT 'DNI' NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "tutor_document_type" "tipo_documento" DEFAULT 'DNI';--> statement-breakpoint
ALTER TABLE "treasury" ADD COLUMN "league_id" uuid;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_history" ADD CONSTRAINT "ownership_history_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_history" ADD CONSTRAINT "ownership_history_previous_owner_id_users_id_fk" FOREIGN KEY ("previous_owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_history" ADD CONSTRAINT "ownership_history_new_owner_id_users_id_fk" FOREIGN KEY ("new_owner_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_club_idx" ON "gallery_photos" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leagues_slug_idx" ON "leagues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ownership_club_idx" ON "ownership_history" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignments_unique" ON "user_assignments" USING btree ("user_id","league_id","club_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury" ADD CONSTRAINT "treasury_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "players_doc_club_idx" ON "players" USING btree ("document_type","document_number","club_id");--> statement-breakpoint
CREATE INDEX "players_fts_idx" ON "players" USING gin (to_tsvector('spanish', "name" || ' ' || "lastname"));--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_owner_id_unique" UNIQUE("owner_id");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_email_unique" UNIQUE("email");