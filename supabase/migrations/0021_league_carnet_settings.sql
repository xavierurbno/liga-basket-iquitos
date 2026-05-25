-- Carnet deportista: identidad visual y firmas por liga (multi-tenant)
ALTER TABLE league_settings
  ADD COLUMN IF NOT EXISTS carnet_federation_logo_url text,
  ADD COLUMN IF NOT EXISTS president_signature_url text,
  ADD COLUMN IF NOT EXISTS secretary_signature_url text,
  ADD COLUMN IF NOT EXISTS president_display_name text,
  ADD COLUMN IF NOT EXISTS secretary_display_name text,
  ADD COLUMN IF NOT EXISTS carnet_validity_label text,
  ADD COLUMN IF NOT EXISTS carnet_authorization_template text;
