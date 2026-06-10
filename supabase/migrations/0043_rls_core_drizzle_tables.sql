-- Fase 5b: RLS en tablas core que Drizzle toca sin políticas previas (0017/0030/0038).

-- ─── players ─────────────────────────────────────────────────────────────────
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS players_select_staff ON public.players;
CREATE POLICY players_select_staff ON public.players
  FOR SELECT TO authenticated
  USING (public.is_staff_admin() AND public.user_can_access_league(league_id));

DROP POLICY IF EXISTS players_write_staff ON public.players;
CREATE POLICY players_write_staff ON public.players
  FOR ALL TO authenticated
  USING (public.is_staff_admin() AND public.user_can_access_league(league_id))
  WITH CHECK (public.is_staff_admin() AND public.user_can_access_league(league_id));

DROP POLICY IF EXISTS players_delegate ON public.players;
CREATE POLICY players_delegate ON public.players
  FOR ALL TO authenticated
  USING (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  )
  WITH CHECK (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  );

-- ─── categories ──────────────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_select_staff ON public.categories;
CREATE POLICY categories_select_staff ON public.categories
  FOR SELECT TO authenticated
  USING (public.is_staff_admin() AND public.user_can_access_league(league_id));

DROP POLICY IF EXISTS categories_write_staff ON public.categories;
CREATE POLICY categories_write_staff ON public.categories
  FOR ALL TO authenticated
  USING (public.is_staff_admin() AND public.user_can_access_league(league_id))
  WITH CHECK (public.is_staff_admin() AND public.user_can_access_league(league_id));

DROP POLICY IF EXISTS categories_delegate ON public.categories;
CREATE POLICY categories_delegate ON public.categories
  FOR ALL TO authenticated
  USING (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  )
  WITH CHECK (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  );

-- ─── league_settings ───────────────────────────────────────────────────────
ALTER TABLE public.league_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS league_settings_select_staff ON public.league_settings;
CREATE POLICY league_settings_select_staff ON public.league_settings
  FOR SELECT TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.jwt_role() = 'LEAGUE_ADMIN'
      AND league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
    )
  );

DROP POLICY IF EXISTS league_settings_write_staff ON public.league_settings;
CREATE POLICY league_settings_write_staff ON public.league_settings
  FOR ALL TO authenticated
  USING (
    public.is_staff_admin() AND public.user_can_access_league(league_id)
  )
  WITH CHECK (
    public.is_staff_admin() AND public.user_can_access_league(league_id)
  );

-- ─── league_plans ────────────────────────────────────────────────────────────
ALTER TABLE public.league_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS league_plans_select_staff ON public.league_plans;
CREATE POLICY league_plans_select_staff ON public.league_plans
  FOR SELECT TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.is_staff_admin() AND public.user_can_access_league(league_id)
    )
  );

DROP POLICY IF EXISTS league_plans_super_admin ON public.league_plans;
CREATE POLICY league_plans_super_admin ON public.league_plans
  FOR ALL TO authenticated
  USING (public.jwt_role() = 'SUPER_ADMIN')
  WITH CHECK (public.jwt_role() = 'SUPER_ADMIN');

-- ─── player_documents ──────────────────────────────────────────────────────
ALTER TABLE public.player_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS player_documents_staff ON public.player_documents;
CREATE POLICY player_documents_staff ON public.player_documents
  FOR ALL TO authenticated
  USING (
    public.is_staff_admin()
    AND EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = player_documents.player_id
        AND public.user_can_access_league(p.league_id)
    )
  )
  WITH CHECK (
    public.is_staff_admin()
    AND EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = player_documents.player_id
        AND public.user_can_access_league(p.league_id)
    )
  );

DROP POLICY IF EXISTS player_documents_delegate ON public.player_documents;
CREATE POLICY player_documents_delegate ON public.player_documents
  FOR ALL TO authenticated
  USING (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  )
  WITH CHECK (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  );

-- sponsors: asegurar RLS activo (políticas 0017/0008)
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
