CREATE TYPE "public"."sponsor_category" AS ENUM('SOCIOS_PATROCINADORES', 'PATR_TECNICO', 'PATROCINADORES_OFICIALES', 'PROVEEDORES', 'INSTITUCIONALES');--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "sponsor_category" NOT NULL,
	"logo_url" text NOT NULL,
	"website_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "players_doc_club_idx";--> statement-breakpoint
ALTER TABLE "league_settings" ADD COLUMN "login_logo_url" text;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sponsors_league_id_idx" ON "sponsors" USING btree ("league_id");--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_documents" ADD CONSTRAINT "player_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury" ADD CONSTRAINT "treasury_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "league_settings_league_id_idx" ON "league_settings" USING btree ("league_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_doc_league_idx" ON "players" USING btree ("document_type","document_number","league_id");