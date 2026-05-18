-- Liga Basket Iquitos — Torneos (Fase A + Fase B)
-- Ejecutar en Supabase SQL Editor si aún no aplicaste las migraciones.

-- MÃ³dulo Torneos â€” Fase A (linear / home_and_away)

DO $$ BEGIN
  CREATE TYPE tournament_format AS ENUM ('linear', 'home_and_away');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tournament_status AS ENUM ('draft', 'active', 'finished', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tournament_match_status AS ENUM (
    'scheduled', 'finished', 'postponed', 'wo_home', 'wo_away', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tournament_match_phase AS ENUM ('group');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  slug varchar(80) NOT NULL,
  description text,
  format tournament_format NOT NULL,
  status tournament_status NOT NULL DEFAULT 'draft',
  settings jsonb,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tournaments_league_slug_idx ON public.tournaments (league_id, slug);
CREATE INDEX IF NOT EXISTS tournaments_league_id_idx ON public.tournaments (league_id);
CREATE INDEX IF NOT EXISTS tournaments_status_idx ON public.tournaments (status);

CREATE TABLE IF NOT EXISTS public.tournament_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tournament_groups_tournament_id_idx ON public.tournament_groups (tournament_id);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.tournament_groups(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  seed_position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tournament_participants_group_category_idx
  ON public.tournament_participants (group_id, category_id);
CREATE UNIQUE INDEX IF NOT EXISTS tournament_participants_tournament_category_idx
  ON public.tournament_participants (tournament_id, category_id);
CREATE INDEX IF NOT EXISTS tournament_participants_group_id_idx ON public.tournament_participants (group_id);
CREATE INDEX IF NOT EXISTS tournament_participants_category_id_idx ON public.tournament_participants (category_id);

CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.tournament_groups(id) ON DELETE CASCADE,
  round integer NOT NULL,
  match_number integer NOT NULL,
  phase tournament_match_phase NOT NULL DEFAULT 'group',
  home_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  away_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  status tournament_match_status NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  venue varchar(200),
  home_score integer,
  away_score integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tournament_matches_tournament_id_idx ON public.tournament_matches (tournament_id);
CREATE INDEX IF NOT EXISTS tournament_matches_group_id_idx ON public.tournament_matches (group_id);
CREATE INDEX IF NOT EXISTS tournament_matches_round_idx ON public.tournament_matches (round);

CREATE TABLE IF NOT EXISTS public.tournament_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.tournament_groups(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  played integer NOT NULL DEFAULT 0,
  won integer NOT NULL DEFAULT 0,
  lost integer NOT NULL DEFAULT 0,
  wo_won integer NOT NULL DEFAULT 0,
  wo_lost integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  points_for integer NOT NULL DEFAULT 0,
  points_against integer NOT NULL DEFAULT 0,
  point_diff integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tournament_standings_group_category_idx
  ON public.tournament_standings (group_id, category_id);
CREATE INDEX IF NOT EXISTS tournament_standings_tournament_id_idx ON public.tournament_standings (tournament_id);

-- RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_standings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournaments_select_authenticated ON public.tournaments;
CREATE POLICY tournaments_select_authenticated ON public.tournaments
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
    OR league_id = ((auth.jwt()->'app_metadata'->>'league_id')::uuid)
  );

DROP POLICY IF EXISTS tournaments_write_admin ON public.tournaments;
CREATE POLICY tournaments_write_admin ON public.tournaments
  FOR ALL TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
    AND (
      COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'SUPER_ADMIN'
      OR league_id = ((auth.jwt()->'app_metadata'->>'league_id')::uuid)
    )
  )
  WITH CHECK (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
    AND (
      COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'SUPER_ADMIN'
      OR league_id = ((auth.jwt()->'app_metadata'->>'league_id')::uuid)
    )
  );

-- Lectura delegado: torneos de su liga
DROP POLICY IF EXISTS tournaments_select_delegate ON public.tournaments;
CREATE POLICY tournaments_select_delegate ON public.tournaments
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'CLUB_DELEGATE'
    AND league_id = ((auth.jwt()->'app_metadata'->>'league_id')::uuid)
  );

-- Tablas hijas: acceso si el torneo es visible
CREATE OR REPLACE FUNCTION public.tournament_id_from_group(p_group_id uuid)
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT tournament_id FROM public.tournament_groups WHERE id = p_group_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tournament_id_from_match(p_match_id uuid)
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT tournament_id FROM public.tournament_matches WHERE id = p_match_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_can_read_tournament(p_tournament_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = p_tournament_id
    AND (
      COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
      OR (
        COALESCE((auth.jwt()->'app_metadata'->>'role'), '') = 'CLUB_DELEGATE'
        AND t.league_id = ((auth.jwt()->'app_metadata'->>'league_id')::uuid)
      )
    )
  );
$$;

DROP POLICY IF EXISTS tournament_groups_select ON public.tournament_groups;
CREATE POLICY tournament_groups_select ON public.tournament_groups
  FOR SELECT TO authenticated
  USING (public.user_can_read_tournament(tournament_id));

DROP POLICY IF EXISTS tournament_groups_write ON public.tournament_groups;
CREATE POLICY tournament_groups_write ON public.tournament_groups
  FOR ALL TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  )
  WITH CHECK (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  );

DROP POLICY IF EXISTS tournament_participants_select ON public.tournament_participants;
CREATE POLICY tournament_participants_select ON public.tournament_participants
  FOR SELECT TO authenticated
  USING (public.user_can_read_tournament(tournament_id));

DROP POLICY IF EXISTS tournament_participants_write ON public.tournament_participants;
CREATE POLICY tournament_participants_write ON public.tournament_participants
  FOR ALL TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  )
  WITH CHECK (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  );

DROP POLICY IF EXISTS tournament_matches_select ON public.tournament_matches;
CREATE POLICY tournament_matches_select ON public.tournament_matches
  FOR SELECT TO authenticated
  USING (public.user_can_read_tournament(tournament_id));

DROP POLICY IF EXISTS tournament_matches_write ON public.tournament_matches;
CREATE POLICY tournament_matches_write ON public.tournament_matches
  FOR ALL TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  )
  WITH CHECK (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  );

DROP POLICY IF EXISTS tournament_standings_select ON public.tournament_standings;
CREATE POLICY tournament_standings_select ON public.tournament_standings
  FOR SELECT TO authenticated
  USING (public.user_can_read_tournament(tournament_id));

DROP POLICY IF EXISTS tournament_standings_write ON public.tournament_standings;
CREATE POLICY tournament_standings_write ON public.tournament_standings
  FOR ALL TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  )
  WITH CHECK (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
  );

-- --- Fase B ---

-- Fase B: formato Â«groupsÂ» en torneos (ejecutar despuÃ©s de 0013)

DO $$ BEGIN
  ALTER TYPE tournament_format ADD VALUE 'groups';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- --- Fase C (0015) ---

-- Fase C: formato groups_playoffs + partidos de play-off (ejecutar despuÃ©s de 0014)

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
-- Fase D: cuartos en acta, fixture pÃºblico

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

-- Lectura pÃºblica (anon) solo torneos marcados como fixture pÃºblico y activos/finalizados
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
