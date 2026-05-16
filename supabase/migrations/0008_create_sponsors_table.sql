-- Migration: 0008_create_sponsors_table
-- Objetivo: Crear la tabla de patrocinadores y el enum de categorías
-- Fecha: 2026-05-12

-- 1. Crear el tipo ENUM de categorías de patrocinadores
CREATE TYPE "public"."sponsor_category" AS ENUM(
  'SOCIOS_PATROCINADORES',
  'PATR_TECNICO',
  'PATROCINADORES_OFICIALES',
  'PROVEEDORES',
  'INSTITUCIONALES'
);

-- 2. Crear la tabla sponsors
CREATE TABLE IF NOT EXISTS "public"."sponsors" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "league_id"     uuid NOT NULL REFERENCES "public"."leagues"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  "name"          text NOT NULL,
  "category"      "public"."sponsor_category" NOT NULL,
  "logo_url"      text NOT NULL,
  "website_url"   text,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at"    timestamp DEFAULT now() NOT NULL
);

-- 3. Índice para búsquedas por liga (SponsorFooter y Admin)
CREATE INDEX IF NOT EXISTS "sponsors_league_id_idx" ON "public"."sponsors" ("league_id");

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE "public"."sponsors" ENABLE ROW LEVEL SECURITY;

-- 5. Política: SuperAdmin puede leer y escribir todos los sponsors
CREATE POLICY "Super admin full access sponsors"
  ON "public"."sponsors"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
