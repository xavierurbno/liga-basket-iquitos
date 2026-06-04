-- Security Advisor (Supabase Linter): errores RLS + advertencias comunes.
-- Ejecutar en el SQL Editor del proyecto jfgnwtkmqayzhlwfxidz (prod) o vía supabase db push.
-- La app usa Drizzle con rol postgres → no se ve afectada por estas políticas.

-- ─── 1. ERRORES: tablas public sin RLS ───────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'categorias_club',
    'transactions',
    'documentos_historial'
  ]
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- categorias_club (tabla legacy en prod; la app usa public.categories vía Drizzle)
DO $$
BEGIN
  IF to_regclass('public.categorias_club') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS categorias_club_select_staff ON public.categorias_club';
    EXECUTE 'DROP POLICY IF EXISTS categorias_club_delegate ON public.categorias_club';
    EXECUTE 'DROP POLICY IF EXISTS categorias_club_super_admin ON public.categorias_club';

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'categorias_club' AND column_name = 'club_id'
    ) THEN
      EXECUTE $policy$
        CREATE POLICY categorias_club_select_staff ON public.categorias_club
          FOR SELECT TO authenticated
          USING (
            public.is_staff_admin() AND EXISTS (
              SELECT 1 FROM public.clubs c
              WHERE c.id = categorias_club.club_id
                AND public.user_can_access_league(c.league_id)
            )
          )
      $policy$;

      EXECUTE $policy$
        CREATE POLICY categorias_club_delegate ON public.categorias_club
          FOR ALL TO authenticated
          USING (
            public.jwt_role() = 'CLUB_DELEGATE'
            AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
          )
          WITH CHECK (
            public.jwt_role() = 'CLUB_DELEGATE'
            AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
          )
      $policy$;

      EXECUTE $policy$
        CREATE POLICY categorias_club_super_admin ON public.categorias_club
          FOR ALL TO authenticated
          USING (public.jwt_role() = 'SUPER_ADMIN')
          WITH CHECK (public.jwt_role() = 'SUPER_ADMIN')
      $policy$;
    END IF;
  END IF;
END $$;

-- transactions (tabla legacy; la app usa public.treasury)
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS transactions_staff ON public.transactions';
    EXECUTE 'DROP POLICY IF EXISTS transactions_delegate ON public.transactions';

    EXECUTE $policy$
      CREATE POLICY transactions_staff ON public.transactions
        FOR ALL TO authenticated
        USING (
          public.is_staff_admin() AND EXISTS (
            SELECT 1 FROM public.clubs c
            WHERE c.id = transactions.club_id
              AND public.user_can_access_league(c.league_id)
          )
        )
        WITH CHECK (
          public.is_staff_admin() AND EXISTS (
            SELECT 1 FROM public.clubs c
            WHERE c.id = transactions.club_id
              AND public.user_can_access_league(c.league_id)
          )
        )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY transactions_delegate ON public.transactions
        FOR SELECT TO authenticated
        USING (
          public.jwt_role() = 'CLUB_DELEGATE'
          AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
        )
    $policy$;
  END IF;
END $$;

-- documentos_historial (legacy; la app usa public.document_history)
DO $$
BEGIN
  IF to_regclass('public.documentos_historial') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS documentos_historial_staff ON public.documentos_historial';

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'documentos_historial'
        AND column_name = 'league_id'
    ) THEN
      EXECUTE $policy$
        CREATE POLICY documentos_historial_staff ON public.documentos_historial
          FOR ALL TO authenticated
          USING (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.jwt_role() = 'LEAGUE_ADMIN'
              AND league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
            )
          )
          WITH CHECK (
            public.jwt_role() = 'SUPER_ADMIN'
            OR (
              public.jwt_role() = 'LEAGUE_ADMIN'
              AND league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
            )
          )
      $policy$;
    ELSE
      EXECUTE $policy$
        CREATE POLICY documentos_historial_staff ON public.documentos_historial
          FOR ALL TO authenticated
          USING (public.jwt_role() IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'))
          WITH CHECK (public.jwt_role() IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'))
      $policy$;
    END IF;
  END IF;
END $$;

-- ─── 2. ADVERTENCIA: gallery_photos con USING (true) ─────────────────────────
ALTER TABLE IF EXISTS public.gallery_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gallery is visible to everyone" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can manage their own photo uploads" ON public.gallery_photos;
DROP POLICY IF EXISTS gallery_photos_select_authenticated ON public.gallery_photos;
DROP POLICY IF EXISTS gallery_photos_write_staff ON public.gallery_photos;

CREATE POLICY gallery_photos_select_authenticated ON public.gallery_photos
  FOR SELECT TO authenticated
  USING (
    league_id IS NOT NULL
    AND public.user_can_access_league(league_id)
  );

CREATE POLICY gallery_photos_write_staff ON public.gallery_photos
  FOR ALL TO authenticated
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

-- ─── 3. ADVERTENCIA: search_path fijo en funciones ───────────────────────────
CREATE OR REPLACE FUNCTION public.tournament_id_from_group(p_group_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT tournament_id FROM public.tournament_groups WHERE id = p_group_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tournament_id_from_match(p_match_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT tournament_id FROM public.tournament_matches WHERE id = p_match_id LIMIT 1;
$$;

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

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'get_auth_league_id',
        'get_auth_club_id',
        'get_auth_role',
        'is_league_admin',
        'sync_user_metadata',
        'get_my_club_ids',
        'update_updated_at'
      ])
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.signature);
  END LOOP;
END $$;

-- ─── 4. ADVERTENCIA: SECURITY DEFINER ejecutable por anon/public ─────────────
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname = ANY (ARRAY[
        'get_my_club_ids',
        'sync_user_metadata',
        'user_can_read_tournament'
      ])
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END $$;

-- ─── 5. ADVERTENCIA: buckets públicos con SELECT amplio (listado) ──────────
-- Quita solo SELECT para anon/public; las URLs directas de buckets públicos siguen funcionando.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        'anon' = ANY (roles)
        OR 'public' = ANY (roles)
      )
      AND (
        qual ILIKE '%club-assets%'
        OR qual ILIKE '%jugador-fotos%'
        OR qual ILIKE '%liga-multimedia%'
        OR qual IS NULL
        OR qual = 'true'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- ─── 6. Prevención: RLS automático en tablas nuevas de public ───────────────
-- Nota: no usar WHEN TAG IN ('CREATE TABLE AS', ...) — Postgres lo parsea mal
-- y lanza "relation AS does not exist". El filtro va dentro de la función.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name = 'public' THEN
      BEGIN
        EXECUTE format('ALTER TABLE IF EXISTS %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: skip % (%).', cmd.object_identity, SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS rls_auto_enable_on_create;
CREATE EVENT TRIGGER rls_auto_enable_on_create
  ON ddl_command_end
  EXECUTE FUNCTION public.rls_auto_enable();
