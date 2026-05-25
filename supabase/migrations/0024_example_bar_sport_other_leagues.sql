-- OPCIONAL: plantilla franjas para otra liga de básquet (ej. Yurimaguas).

ALTER TABLE public.league_settings
  ADD COLUMN IF NOT EXISTS carnet_theme_preset varchar(32) NOT NULL DEFAULT 'institutional_soft',
  ADD COLUMN IF NOT EXISTS carnet_show_federation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS carnet_federation_display_name text,
  ADD COLUMN IF NOT EXISTS carnet_sport_label varchar(40),
  ADD COLUMN IF NOT EXISTS carnet_sport_graphic_url text;

UPDATE public.league_settings ls
SET
  carnet_theme_preset = 'federation_bar_sport',
  carnet_show_federation = true,
  carnet_federation_display_name = 'FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL',
  carnet_sport_label = 'BÁSQUET',
  portal_primary_color = COALESCE(NULLIF(trim(ls.portal_primary_color), ''), '#1e3a5f'),
  portal_accent_color = COALESCE(NULLIF(trim(ls.portal_accent_color), ''), '#005CEE'),
  updated_at = now()
FROM public.leagues l
WHERE ls.league_id = l.id
  AND lower(l.slug) IN ('yurimaguas', 'yurim', 'liga-basket-yurimaguas');
