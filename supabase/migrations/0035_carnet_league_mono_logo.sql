-- Logo de liga monocromático para reverso clásico (ZC300, ahorro de cinta color).
ALTER TABLE league_settings
  ADD COLUMN IF NOT EXISTS carnet_league_mono_logo_url text;

COMMENT ON COLUMN league_settings.carnet_league_mono_logo_url IS
  'Logo B/N de la liga solo en reverso clásico (esquinas_clasica_reverso / onda_clasica_reverso). Null = public/logos/liga-mono.png si existe.';
