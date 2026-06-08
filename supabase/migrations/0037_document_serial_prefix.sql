-- Prefijo de serial en documentos institucionales (carta, constancia, solvencia).
ALTER TABLE league_settings
  ADD COLUMN IF NOT EXISTS document_serial_prefix varchar(12);

COMMENT ON COLUMN league_settings.document_serial_prefix IS
  'Prefijo de serial PDF (ej. LDDBI, COPA). Null = derivado del slug de la liga.';
