-- Fase D: cuartos en acta, fixture público

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS is_public_fixture boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS tournaments_public_fixture_idx
  ON public.tournaments (league_id, is_public_fixture)
  WHERE is_public_fixture = true;

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS home_q1 smallint,
  ADD COLUMN IF NOT EXISTS away_q1 smallint,
  ADD COLUMN IF NOT EXISTS home_q2 smallint,
  ADD COLUMN IF NOT EXISTS away_q2 smallint,
  ADD COLUMN IF NOT EXISTS home_q3 smallint,
  ADD COLUMN IF NOT EXISTS away_q3 smallint,
  ADD COLUMN IF NOT EXISTS home_q4 smallint,
  ADD COLUMN IF NOT EXISTS away_q4 smallint,
  ADD COLUMN IF NOT EXISTS home_ot smallint,
  ADD COLUMN IF NOT EXISTS away_ot smallint;

-- Lectura pública (anon) solo torneos marcados como fixture público y activos/finalizados
DROP POLICY IF EXISTS tournaments_public_fixture_anon ON public.tournaments;
CREATE POLICY tournaments_public_fixture_anon ON public.tournaments
  FOR SELECT TO anon
  USING (is_public_fixture = true AND status IN ('active', 'finished'));

DROP POLICY IF EXISTS tournament_groups_public_fixture_anon ON public.tournament_groups;
CREATE POLICY tournament_groups_public_fixture_anon ON public.tournament_groups
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
        AND t.is_public_fixture = true
        AND t.status IN ('active', 'finished')
    )
  );

DROP POLICY IF EXISTS tournament_matches_public_fixture_anon ON public.tournament_matches;
CREATE POLICY tournament_matches_public_fixture_anon ON public.tournament_matches
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
        AND t.is_public_fixture = true
        AND t.status IN ('active', 'finished')
    )
  );

DROP POLICY IF EXISTS tournament_standings_public_fixture_anon ON public.tournament_standings;
CREATE POLICY tournament_standings_public_fixture_anon ON public.tournament_standings
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
        AND t.is_public_fixture = true
        AND t.status IN ('active', 'finished')
    )
  );

DROP POLICY IF EXISTS tournament_participants_public_fixture_anon ON public.tournament_participants;
CREATE POLICY tournament_participants_public_fixture_anon ON public.tournament_participants
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
        AND t.is_public_fixture = true
        AND t.status IN ('active', 'finished')
    )
  );
