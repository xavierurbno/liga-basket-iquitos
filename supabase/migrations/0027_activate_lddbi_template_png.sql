-- Usar plantillas PNG oficiales (anverso + reverso en public/carnet/lddbi-template/).

UPDATE public.league_settings ls
SET
  carnet_theme_preset = 'lddbi_template',
  updated_at = now()
FROM public.leagues l
WHERE ls.league_id = l.id
  AND lower(l.slug) IN (
    'lddbi',
    'iquitos',
    'liga-basket-iquitos',
    'liga-de-basket-de-iquitos'
  );
