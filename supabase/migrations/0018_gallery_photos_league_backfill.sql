-- Asocia fotos existentes a su liga (club → clubs.league_id; institucional → liga Iquitos/default).

UPDATE gallery_photos gp
SET league_id = c.league_id
FROM clubs c
WHERE gp.club_id = c.id
  AND gp.league_id IS NULL
  AND c.league_id IS NOT NULL;

UPDATE gallery_photos gp
SET league_id = sub.id
FROM (
  SELECT l.id
  FROM leagues l
  WHERE l.slug = 'iquitos' OR l.slug ILIKE '%iquitos%'
  ORDER BY l.created_at DESC
  LIMIT 1
) sub
WHERE gp.club_id IS NULL
  AND gp.league_id IS NULL;

UPDATE gallery_photos gp
SET league_id = sub.id
FROM (
  SELECT l.id
  FROM leagues l
  ORDER BY l.created_at DESC
  LIMIT 1
) sub
WHERE gp.league_id IS NULL;

CREATE INDEX IF NOT EXISTS gallery_photos_league_id_idx ON gallery_photos (league_id);
