-- Fase 0: plantilla de carnet y branding deportivo/federación por liga
ALTER TABLE league_settings
  ADD COLUMN IF NOT EXISTS carnet_theme_preset varchar(32) NOT NULL DEFAULT 'institutional_soft',
  ADD COLUMN IF NOT EXISTS carnet_show_federation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS carnet_federation_display_name text,
  ADD COLUMN IF NOT EXISTS carnet_sport_label varchar(40),
  ADD COLUMN IF NOT EXISTS carnet_sport_graphic_url text;

COMMENT ON COLUMN league_settings.carnet_theme_preset IS 'institutional_soft | lddbi_bold | federation_bar_sport';
COMMENT ON COLUMN league_settings.carnet_show_federation IS 'false = carnets sin bloque federación (torneos particulares)';
