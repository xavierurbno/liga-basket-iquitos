-- Fase C: formato groups_playoffs + partidos de play-off (ejecutar después de 0014)

DO $$ BEGIN
  ALTER TYPE tournament_format ADD VALUE 'groups_playoffs';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE tournament_match_phase ADD VALUE 'playoff';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS playoff_label varchar(100);

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS advances_to_match_id uuid
  REFERENCES public.tournament_matches(id) ON DELETE SET NULL;

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS advances_as varchar(10);

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS loser_advances_to_match_id uuid
  REFERENCES public.tournament_matches(id) ON DELETE SET NULL;

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS loser_advances_as varchar(10);

CREATE INDEX IF NOT EXISTS tournament_matches_phase_idx
  ON public.tournament_matches (tournament_id, phase);
