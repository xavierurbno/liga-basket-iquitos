-- Security Advisor fase 2: warnings (10) + info RLS sin política (6).
-- Requiere helpers de 0017_rls_operational_league.sql.
-- Leaked password protection: activar manualmente en Auth → Settings → Security.

-- ─── 1. gallery_photos: quitar políticas permisivas (USING/WITH CHECK true) ───
DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('public.gallery_photos') IS NOT NULL THEN
    ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'gallery_photos'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.gallery_photos', pol.policyname);
    END LOOP;

    EXECUTE $policy$
      CREATE POLICY gallery_photos_select_staff ON public.gallery_photos
        FOR SELECT TO authenticated
        USING (
          league_id IS NOT NULL
          AND public.user_can_access_league(league_id)
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY gallery_photos_insert_staff ON public.gallery_photos
        FOR INSERT TO authenticated
        WITH CHECK (
          public.is_staff_admin()
          AND league_id IS NOT NULL
          AND public.user_can_access_league(league_id)
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY gallery_photos_update_staff ON public.gallery_photos
        FOR UPDATE TO authenticated
        USING (
          public.is_staff_admin()
          AND league_id IS NOT NULL
          AND public.user_can_access_league(league_id)
        )
        WITH CHECK (
          public.is_staff_admin()
          AND league_id IS NOT NULL
          AND public.user_can_access_league(league_id)
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY gallery_photos_delete_staff ON public.gallery_photos
        FOR DELETE TO authenticated
        USING (
          public.is_staff_admin()
          AND league_id IS NOT NULL
          AND public.user_can_access_league(league_id)
        )
    $policy$;
  END IF;
END $$;

-- ─── 2. Info: tablas con RLS activo pero sin políticas ───────────────────────

-- club_members
ALTER TABLE IF EXISTS public.club_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_members_select_own" ON public.club_members;
CREATE POLICY "club_members_select_own"
  ON public.club_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- treasury
ALTER TABLE IF EXISTS public.treasury ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS treasury_select_scoped ON public.treasury;
DROP POLICY IF EXISTS treasury_write_staff ON public.treasury;
DROP POLICY IF EXISTS treasury_write_delegate ON public.treasury;
DROP POLICY IF EXISTS treasury_super_admin ON public.treasury;

CREATE POLICY treasury_select_scoped ON public.treasury
  FOR SELECT TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.is_staff_admin()
      AND league_id IS NOT NULL
      AND public.user_can_access_league(league_id)
    )
    OR (
      public.jwt_role() = 'CLUB_DELEGATE'
      AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
    )
  );

CREATE POLICY treasury_write_staff ON public.treasury
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff_admin()
    AND league_id IS NOT NULL
    AND public.user_can_access_league(league_id)
  );

CREATE POLICY treasury_update_staff ON public.treasury
  FOR UPDATE TO authenticated
  USING (
    public.is_staff_admin()
    AND league_id IS NOT NULL
    AND public.user_can_access_league(league_id)
  )
  WITH CHECK (
    public.is_staff_admin()
    AND league_id IS NOT NULL
    AND public.user_can_access_league(league_id)
  );

CREATE POLICY treasury_delete_staff ON public.treasury
  FOR DELETE TO authenticated
  USING (
    public.is_staff_admin()
    AND league_id IS NOT NULL
    AND public.user_can_access_league(league_id)
  );

CREATE POLICY treasury_write_delegate ON public.treasury
  FOR ALL TO authenticated
  USING (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  )
  WITH CHECK (
    public.jwt_role() = 'CLUB_DELEGATE'
    AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
  );

CREATE POLICY treasury_super_admin ON public.treasury
  FOR ALL TO authenticated
  USING (public.jwt_role() = 'SUPER_ADMIN')
  WITH CHECK (public.jwt_role() = 'SUPER_ADMIN');

-- document_history
ALTER TABLE IF EXISTS public.document_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_history_staff ON public.document_history;

CREATE POLICY document_history_staff ON public.document_history
  FOR ALL TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.jwt_role() = 'LEAGUE_ADMIN'
      AND (
        league_id IS NULL
        OR league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
      )
    )
  )
  WITH CHECK (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.jwt_role() = 'LEAGUE_ADMIN'
      AND (
        league_id IS NULL
        OR league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
      )
    )
  );

-- ownership_history
ALTER TABLE IF EXISTS public.ownership_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ownership_history_staff ON public.ownership_history;

CREATE POLICY ownership_history_staff ON public.ownership_history
  FOR ALL TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.is_staff_admin()
      AND EXISTS (
        SELECT 1
        FROM public.clubs c
        WHERE c.id = ownership_history.club_id
          AND public.user_can_access_league(c.league_id)
      )
    )
  )
  WITH CHECK (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.is_staff_admin()
      AND EXISTS (
        SELECT 1
        FROM public.clubs c
        WHERE c.id = ownership_history.club_id
          AND public.user_can_access_league(c.league_id)
      )
    )
  );

-- user_assignments
ALTER TABLE IF EXISTS public.user_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_assignments_select_own ON public.user_assignments;
DROP POLICY IF EXISTS user_assignments_super_admin ON public.user_assignments;

CREATE POLICY user_assignments_select_own ON public.user_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_assignments_super_admin ON public.user_assignments
  FOR ALL TO authenticated
  USING (public.jwt_role() = 'SUPER_ADMIN')
  WITH CHECK (public.jwt_role() = 'SUPER_ADMIN');

-- Tabla legacy "Normativa" (mayúscula) — distinta de public.normativas
DO $$
BEGIN
  IF to_regclass('public."Normativa"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."Normativa" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS normativa_legacy_staff ON public."Normativa"';
    EXECUTE $policy$
      CREATE POLICY normativa_legacy_staff ON public."Normativa"
        FOR ALL TO authenticated
        USING (public.jwt_role() IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'))
        WITH CHECK (public.jwt_role() IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'))
    $policy$;
  END IF;
END $$;

-- ─── 3. Funciones SECURITY DEFINER / ejecutables por API ─────────────────────

-- Torneos: invoker (sigue usable en políticas RLS sin elevar privilegios)
CREATE OR REPLACE FUNCTION public.user_can_read_tournament(p_tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tournaments t
    WHERE t.id = p_tournament_id
      AND public.user_can_access_league(t.league_id)
  );
$$;

REVOKE ALL ON FUNCTION public.user_can_read_tournament(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_read_tournament(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_tournament(uuid) TO service_role;

-- Event trigger interno: no invocable vía PostgREST
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- Helpers legacy en prod: solo service_role (hooks/triggers server-side)
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY['get_my_club_ids', 'sync_user_metadata'])
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER', fn.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END $$;

-- ─── 4. Storage: sin listado público; acceso autenticado acotado por path ───
DO $$
DECLARE
  pol record;
  bucket text;
BEGIN
  FOREACH bucket IN ARRAY ARRAY['club-assets', 'jugador-fotos', 'liga-multimedia', 'Nomativa', 'normativa']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = bucket) THEN
      CONTINUE;
    END IF;

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND (
          qual ILIKE '%' || bucket || '%'
          OR with_check ILIKE '%' || bucket || '%'
          OR policyname ILIKE '%' || bucket || '%'
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
  END LOOP;
END $$;

-- jugador-fotos: paths clubs/{club_id}/...
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'jugador-fotos') THEN
    EXECUTE $policy$
      CREATE POLICY jugador_fotos_insert ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = 'jugador-fotos'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR public.is_staff_admin()
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY jugador_fotos_select ON storage.objects
        FOR SELECT TO authenticated
        USING (
          bucket_id = 'jugador-fotos'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR public.is_staff_admin()
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY jugador_fotos_update ON storage.objects
        FOR UPDATE TO authenticated
        USING (
          bucket_id = 'jugador-fotos'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR public.is_staff_admin()
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
        WITH CHECK (
          bucket_id = 'jugador-fotos'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR public.is_staff_admin()
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
    $policy$;
  END IF;
END $$;

-- club-assets: logos/, directivos/, sponsors/, leagues/{id}/, clubs/{id}/
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'club-assets') THEN
    EXECUTE $policy$
      CREATE POLICY club_assets_write ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = 'club-assets'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND (
                name LIKE 'logos/%'
                OR name LIKE 'directivos/%'
                OR name LIKE 'sponsors/%'
                OR name LIKE 'clubs/%'
                OR (
                  public.jwt_operational_league_id() IS NOT NULL
                  AND name LIKE ('leagues/' || public.jwt_operational_league_id()::text || '/%')
                )
              )
            )
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY club_assets_read ON storage.objects
        FOR SELECT TO authenticated
        USING (
          bucket_id = 'club-assets'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND (
                name LIKE 'logos/%'
                OR name LIKE 'directivos/%'
                OR name LIKE 'sponsors/%'
                OR name LIKE 'clubs/%'
                OR (
                  public.jwt_operational_league_id() IS NOT NULL
                  AND name LIKE ('leagues/' || public.jwt_operational_league_id()::text || '/%')
                )
              )
            )
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY club_assets_update ON storage.objects
        FOR UPDATE TO authenticated
        USING (
          bucket_id = 'club-assets'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND (
                name LIKE 'logos/%'
                OR name LIKE 'directivos/%'
                OR name LIKE 'sponsors/%'
                OR name LIKE 'clubs/%'
                OR (
                  public.jwt_operational_league_id() IS NOT NULL
                  AND name LIKE ('leagues/' || public.jwt_operational_league_id()::text || '/%')
                )
              )
            )
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
        WITH CHECK (
          bucket_id = 'club-assets'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND (
                name LIKE 'logos/%'
                OR name LIKE 'directivos/%'
                OR name LIKE 'sponsors/%'
                OR name LIKE 'clubs/%'
                OR (
                  public.jwt_operational_league_id() IS NOT NULL
                  AND name LIKE ('leagues/' || public.jwt_operational_league_id()::text || '/%')
                )
              )
            )
            OR (
              public.jwt_club_id() IS NOT NULL
              AND name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
    $policy$;
  END IF;
END $$;

-- liga-multimedia: galería staff bajo gallery/
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'liga-multimedia') THEN
    EXECUTE $policy$
      CREATE POLICY liga_multimedia_staff ON storage.objects
        FOR ALL TO authenticated
        USING (
          bucket_id = 'liga-multimedia'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND name LIKE 'gallery/%'
            )
          )
        )
        WITH CHECK (
          bucket_id = 'liga-multimedia'
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND name LIKE 'gallery/%'
            )
          )
        )
    $policy$;
  END IF;
END $$;

-- Nomativa / normativa: PDFs bajo normativas/{slug}/ (subida con sesión staff)
DO $$
DECLARE
  bucket text;
BEGIN
  FOREACH bucket IN ARRAY ARRAY['Nomativa', 'normativa']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = bucket) THEN
      CONTINUE;
    END IF;

    EXECUTE format($policy$
      CREATE POLICY %I_normativas_staff ON storage.objects
        FOR ALL TO authenticated
        USING (
          bucket_id = %L
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND name LIKE 'normativas/%%'
            )
          )
        )
        WITH CHECK (
          bucket_id = %L
          AND (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.is_staff_admin()
              AND name LIKE 'normativas/%%'
            )
          )
        )
    $policy$, bucket, bucket, bucket);
  END LOOP;
END $$;
