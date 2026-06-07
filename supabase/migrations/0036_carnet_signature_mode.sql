-- Modo de firmas en reverso del carnet: none | president | both
ALTER TABLE league_settings
  ADD COLUMN IF NOT EXISTS carnet_signature_mode varchar(16) DEFAULT 'both' NOT NULL;

COMMENT ON COLUMN league_settings.carnet_signature_mode IS
  'Firmas en reverso CR80: none (sin firmas), president (solo presidente), both (presidente y secretario).';
