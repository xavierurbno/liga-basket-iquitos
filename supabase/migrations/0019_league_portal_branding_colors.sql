-- Fase 4: colores de portal por liga
ALTER TABLE league_settings
  ADD COLUMN IF NOT EXISTS portal_primary_color varchar(7) DEFAULT '#1e3a5f',
  ADD COLUMN IF NOT EXISTS portal_accent_color varchar(7) DEFAULT '#005CEE';
