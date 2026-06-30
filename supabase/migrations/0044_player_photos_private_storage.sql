-- Fase 0 (BLQ-1.2 / BLQ-1.4b): bucket jugador-fotos privado + políticas para paths leagues/ y clubs/

UPDATE storage.buckets
SET public = false
WHERE id = 'jugador-fotos';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'jugador-fotos') THEN
  EXECUTE $drop$
    DROP POLICY IF EXISTS jugador_fotos_insert ON storage.objects;
    DROP POLICY IF EXISTS jugador_fotos_select ON storage.objects;
    DROP POLICY IF EXISTS jugador_fotos_update ON storage.objects;
  $drop$;

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
            AND (
              name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
              OR name LIKE ('leagues/%/clubs/' || public.jwt_club_id()::text || '/%')
            )
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
            AND (
              name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
              OR name LIKE ('leagues/%/clubs/' || public.jwt_club_id()::text || '/%')
            )
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
            AND (
              name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
              OR name LIKE ('leagues/%/clubs/' || public.jwt_club_id()::text || '/%')
            )
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
            AND (
              name LIKE ('clubs/' || public.jwt_club_id()::text || '/%')
              OR name LIKE ('leagues/%/clubs/' || public.jwt_club_id()::text || '/%')
            )
          )
        )
      )
  $policy$;
  END IF;
END $$;
