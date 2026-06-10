-- Fase 2: slug de club único por liga (league_id, slug), no global.
-- Ejecutar en ventana de bajo tráfico. Pre-check obligatorio:
--   scripts/club-slug-collision-pre-check.sql

DROP INDEX IF EXISTS public.clubs_slug_idx;

ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_slug_key;

CREATE UNIQUE INDEX clubs_league_slug_idx
  ON public.clubs (league_id, slug);

COMMENT ON INDEX public.clubs_league_slug_idx IS
  'Slug único por liga (0039). Reemplaza UNIQUE global en slug.';
