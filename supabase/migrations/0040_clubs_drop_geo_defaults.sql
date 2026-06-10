-- Fase 4: quitar defaults geográficos LDDBI en clubes (valores desde formulario o league_settings).
ALTER TABLE public.clubs
  ALTER COLUMN district DROP DEFAULT,
  ALTER COLUMN province DROP DEFAULT,
  ALTER COLUMN region DROP DEFAULT;
