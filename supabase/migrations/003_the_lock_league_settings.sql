-- ============================================================
-- Migration: Refactorización "The Lock" — league_settings
-- Añade banner_text, renombra manual_override → is_manual_override
-- ============================================================

-- 1. Añadir la columna banner_text (si no existe)
ALTER TABLE "league_settings"
  ADD COLUMN IF NOT EXISTS "banner_text" text;

-- 2. Añadir is_manual_override con el valor actual de manual_override (si no existe)
ALTER TABLE "league_settings"
  ADD COLUMN IF NOT EXISTS "is_manual_override" boolean NOT NULL DEFAULT false;

-- 3. Copiar datos existentes al nuevo campo
UPDATE "league_settings"
  SET "is_manual_override" = COALESCE("manual_override", false)
  WHERE "is_manual_override" IS DISTINCT FROM COALESCE("manual_override", false);

-- 4. Eliminar la columna antigua (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'league_settings'
      AND column_name = 'manual_override'
  ) THEN
    ALTER TABLE "league_settings" DROP COLUMN "manual_override";
  END IF;
END$$;
