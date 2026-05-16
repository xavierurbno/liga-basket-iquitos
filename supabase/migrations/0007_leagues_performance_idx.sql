-- Migration: 0007_leagues_performance_idx
-- Objetivo: Optimizar el rendimiento de las consultas administrativas de ligas

-- 1. Índice para ordenamiento por fecha de creación (usado en findAll)
CREATE INDEX IF NOT EXISTS "idx_leagues_created_at_desc" ON "public"."leagues" ("created_at" DESC);

-- 2. Asegurar que league_id en league_settings tenga un índice único funcional
-- (Aunque ya existe la restricción UNIQUE, creamos explícitamente el índice si no existe por algún motivo de corrupción o migración previa manual)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_league_settings_league_id" ON "public"."league_settings" ("league_id");

-- 3. Índice para búsquedas por nombre de liga (SuperAdmin search)
CREATE INDEX IF NOT EXISTS "idx_leagues_name_trgm" ON "public"."leagues" USING gin ("name" gin_trgm_ops);

-- 4. Verificar y añadir índice para league_id en sponsors para el SponsorFooter
CREATE INDEX IF NOT EXISTS "idx_sponsors_league_id" ON "public"."sponsors" ("league_id");
