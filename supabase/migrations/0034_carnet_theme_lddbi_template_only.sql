-- Una sola plantilla activa: mockup PNG LDDBI (plantillas legacy retiradas del configurador).
UPDATE public.league_settings
SET carnet_theme_preset = 'lddbi_template'
WHERE carnet_theme_preset IS DISTINCT FROM 'lddbi_template';

ALTER TABLE public.league_settings
  ALTER COLUMN carnet_theme_preset SET DEFAULT 'lddbi_template';

COMMENT ON COLUMN public.league_settings.carnet_theme_preset IS
  'lddbi_template (única plantilla CR80 activa; valores legacy se normalizan a lddbi_template)';
