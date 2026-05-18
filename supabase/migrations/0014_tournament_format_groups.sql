-- Fase B: formato «groups» en torneos (ejecutar después de 0013)

DO $$ BEGIN
  ALTER TYPE tournament_format ADD VALUE 'groups';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
