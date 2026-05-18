-- Fase 4: RLS alineado con liga operativa (cookie + app_metadata.active_league_id en JWT)
-- Ejecutar en Supabase SQL Editor después de 0013–0016.
-- Drizzle con DATABASE_URL (rol postgres) no queda limitado por estas políticas.

-- ─── Helpers JWT ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.try_uuid_from_text(p_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_text IS NULL OR trim(p_text) = '' THEN
    RETURN NULL;
  END IF;
  RETURN trim(p_text)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', '');
$$;

-- Liga operativa: active_league_id (super admin) o league_id (admin de liga / delegado).
CREATE OR REPLACE FUNCTION public.jwt_operational_league_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    public.try_uuid_from_text(auth.jwt()->'app_metadata'->>'active_league_id'),
    public.try_uuid_from_text(auth.jwt()->'app_metadata'->>'league_id')
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_club_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.try_uuid_from_text(auth.jwt()->'app_metadata'->>'club_id');
$$;

CREATE OR REPLACE FUNCTION public.is_staff_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.jwt_role() IN ('SUPER_ADMIN', 'LEAGUE_ADMIN');
$$;

-- Staff y delegados: filas de una liga solo si coincide la liga operativa del JWT.
CREATE OR REPLACE FUNCTION public.user_can_access_league(p_league_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.jwt_role() IN ('SUPER_ADMIN', 'LEAGUE_ADMIN') THEN
      public.jwt_operational_league_id() IS NOT NULL
      AND p_league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
    WHEN public.jwt_role() = 'CLUB_DELEGATE' THEN
      p_league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
    ELSE
      false
  END;
$$;

-- ─── Clubs (supabase-js en proxy y rutas /[clubSlug]) ───────────────────────
DROP POLICY IF EXISTS "clubs_select_authenticated" ON public.clubs;

CREATE POLICY "clubs_select_authenticated"
  ON public.clubs
  FOR SELECT
  TO authenticated
  USING (
    (
      public.is_staff_admin()
      AND public.user_can_access_league(league_id)
    )
    OR (
      public.jwt_club_id() IS NOT NULL
      AND id = public.jwt_club_id()
    )
  );

-- ─── Sponsors (antes: USING (true) para todo authenticated) ─────────────────
DROP POLICY IF EXISTS "Super admin full access sponsors" ON public.sponsors;

DROP POLICY IF EXISTS "sponsors_select_authenticated" ON public.sponsors;
CREATE POLICY "sponsors_select_authenticated"
  ON public.sponsors
  FOR SELECT
  TO authenticated
  USING (public.user_can_access_league(league_id));

DROP POLICY IF EXISTS "sponsors_write_staff" ON public.sponsors;
CREATE POLICY "sponsors_write_staff"
  ON public.sponsors
  FOR ALL
  TO authenticated
  USING (public.is_staff_admin() AND public.user_can_access_league(league_id))
  WITH CHECK (public.is_staff_admin() AND public.user_can_access_league(league_id));

-- ─── Torneos: reemplazar user_can_read_tournament y políticas de escritura ───
CREATE OR REPLACE FUNCTION public.user_can_read_tournament(p_tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tournaments t
    WHERE t.id = p_tournament_id
      AND public.user_can_access_league(t.league_id)
  );
$$;

DROP POLICY IF EXISTS tournaments_select_authenticated ON public.tournaments;
CREATE POLICY tournaments_select_authenticated ON public.tournaments
  FOR SELECT TO authenticated
  USING (public.user_can_access_league(league_id));

DROP POLICY IF EXISTS tournaments_write_admin ON public.tournaments;
CREATE POLICY tournaments_write_admin ON public.tournaments
  FOR ALL TO authenticated
  USING (public.is_staff_admin() AND public.user_can_access_league(league_id))
  WITH CHECK (public.is_staff_admin() AND public.user_can_access_league(league_id));

DROP POLICY IF EXISTS tournaments_select_delegate ON public.tournaments;
CREATE POLICY tournaments_select_delegate ON public.tournaments
  FOR SELECT TO authenticated
  USING (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND public.user_can_access_league(league_id)
  );

DROP POLICY IF EXISTS tournament_groups_write ON public.tournament_groups;
CREATE POLICY tournament_groups_write ON public.tournament_groups
  FOR ALL TO authenticated
  USING (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  )
  WITH CHECK (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  );

DROP POLICY IF EXISTS tournament_participants_write ON public.tournament_participants;
CREATE POLICY tournament_participants_write ON public.tournament_participants
  FOR ALL TO authenticated
  USING (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  )
  WITH CHECK (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  );

DROP POLICY IF EXISTS tournament_matches_write ON public.tournament_matches;
CREATE POLICY tournament_matches_write ON public.tournament_matches
  FOR ALL TO authenticated
  USING (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  )
  WITH CHECK (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  );

DROP POLICY IF EXISTS tournament_standings_write ON public.tournament_standings;
CREATE POLICY tournament_standings_write ON public.tournament_standings
  FOR ALL TO authenticated
  USING (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  )
  WITH CHECK (
    public.is_staff_admin()
    AND public.user_can_read_tournament(tournament_id)
  );

-- ─── Leagues: lectura para staff autenticado (listados en panel) ─────────────
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leagues_select_authenticated ON public.leagues;
CREATE POLICY leagues_select_authenticated ON public.leagues
  FOR SELECT TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.jwt_role() = 'LEAGUE_ADMIN'
      AND id IS NOT DISTINCT FROM public.jwt_operational_league_id()
    )
  );

DROP POLICY IF EXISTS leagues_write_super_admin ON public.leagues;
CREATE POLICY leagues_write_super_admin ON public.leagues
  FOR ALL TO authenticated
  USING (public.jwt_role() = 'SUPER_ADMIN')
  WITH CHECK (public.jwt_role() = 'SUPER_ADMIN');
