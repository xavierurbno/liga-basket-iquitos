-- Migration: league_settings_fix
-- Ensures all columns required by the new schema exist in the database

ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "league_id" uuid;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "season_name" text;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "points_win" integer DEFAULT 2;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "points_loss" integer DEFAULT 1;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "points_walkover" integer DEFAULT 0;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "max_players_per_club" integer DEFAULT 15;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "banner_text" text;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "is_manual_override" boolean DEFAULT false;

-- Asegurar league_id en otras tablas críticas de la Fase 4
ALTER TABLE "gallery_photos" ADD COLUMN IF NOT EXISTS "league_id" uuid;
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "league_id" uuid;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "league_id" uuid;
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "league_id" uuid;
ALTER TABLE "treasury" ADD COLUMN IF NOT EXISTS "league_id" uuid;
ALTER TABLE "league_settings" ADD COLUMN IF NOT EXISTS "is_manual_override" boolean DEFAULT false;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'league_settings_league_id_leagues_id_fk') THEN
        ALTER TABLE "league_settings" ADD CONSTRAINT "league_settings_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'league_settings_league_id_unique') THEN
        ALTER TABLE "league_settings" ADD CONSTRAINT "league_settings_league_id_unique" UNIQUE("league_id");
    END IF;
END $$;
