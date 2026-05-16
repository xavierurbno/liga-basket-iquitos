-- Defense in depth: lecturas con supabase-js (JWT authenticated) no deben exponer filas de otros clubes.
-- Drizzle/service_role/postgres owner no quedan limitados por estas políticas en el servidor Node.

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clubs_select_authenticated" ON public.clubs;

CREATE POLICY "clubs_select_authenticated"
  ON public.clubs
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->'app_metadata'->>'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN')
    OR (
      (auth.jwt()->'app_metadata'->>'club_id') IS NOT NULL
      AND id = ((auth.jwt()->'app_metadata'->>'club_id')::uuid)
    )
  );
