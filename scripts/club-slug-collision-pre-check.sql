-- Pre-migración 0039: confirmar que no hay slugs duplicados dentro de la misma liga.
-- Debe devolver 0 filas antes de aplicar 0039_clubs_league_slug_unique.sql.

SELECT slug, league_id, COUNT(*) AS count
FROM public.clubs
GROUP BY slug, league_id
HAVING COUNT(*) > 1;

-- Inventario global (informativo; tras 0039 puede haber mismo slug en ligas distintas):
SELECT slug, COUNT(*) AS count, array_agg(league_id::text) AS ligas
FROM public.clubs
GROUP BY slug
HAVING COUNT(*) > 1;
