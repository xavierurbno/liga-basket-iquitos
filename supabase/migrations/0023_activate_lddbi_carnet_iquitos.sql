-- Activar plantilla LDDBI para Iquitos (incluye columnas de 0022 si faltan).

ALTER TABLE public.league_settings
  ADD COLUMN IF NOT EXISTS carnet_theme_preset varchar(32) NOT NULL DEFAULT 'institutional_soft',
  ADD COLUMN IF NOT EXISTS carnet_show_federation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS carnet_federation_display_name text,
  ADD COLUMN IF NOT EXISTS carnet_sport_label varchar(40),
  ADD COLUMN IF NOT EXISTS carnet_sport_graphic_url text;

UPDATE public.league_settings ls
SET
  carnet_theme_preset = 'lddbi_bold',
  carnet_show_federation = true,
  carnet_federation_display_name = COALESCE(
    NULLIF(trim(ls.carnet_federation_display_name), ''),
    'FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL'
  ),
  carnet_sport_label = COALESCE(NULLIF(trim(ls.carnet_sport_label), ''), 'BÁSQUET'),
  portal_primary_color = COALESCE(NULLIF(trim(ls.portal_primary_color), ''), '#1e3a5f'),
  portal_accent_color = COALESCE(NULLIF(trim(ls.portal_accent_color), ''), '#0d9488'),
  updated_at = now()
FROM public.leagues l
WHERE ls.league_id = l.id
  AND lower(l.slug) IN ('lddbi', 'iquitos', 'liga-basket-iquitos', 'liga-de-basket-de-iquitos');

INSERT INTO public.league_settings (
  league_id,
  season_name,
  carnet_theme_preset,
  carnet_show_federation,
  carnet_federation_display_name,
  carnet_sport_label,
  portal_primary_color,
  portal_accent_color,
  updated_at
)
SELECT
  l.id,
  COALESCE(l.name, 'Temporada actual'),
  'lddbi_bold',
  true,
  'FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL',
  'BÁSQUET',
  '#1e3a5f',
  '#0d9488',
  now()
FROM public.leagues l
WHERE lower(l.slug) IN ('lddbi', 'iquitos', 'liga-basket-iquitos', 'liga-de-basket-de-iquitos')
  AND NOT EXISTS (
    SELECT 1 FROM public.league_settings ls2 WHERE ls2.league_id = l.id
  );
