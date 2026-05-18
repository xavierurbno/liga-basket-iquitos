-- Verificación Fase 2 (solo lectura). Ejecutar en SQL Editor o: npm run db:phase2 -- verify
-- Todas las filas deben mostrar ok = true para dar por cerrada la fase.

WITH checks AS (
  SELECT 'table_tournaments' AS check_id,
    EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'tournaments'
    ) AS ok
  UNION ALL
  SELECT 'table_tournament_matches',
    EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'tournament_matches'
    )
  UNION ALL
  SELECT 'column_is_public_fixture',
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tournaments'
        AND column_name = 'is_public_fixture'
    )
  UNION ALL
  SELECT 'column_match_quarters_home_q1',
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tournament_matches'
        AND column_name = 'home_q1'
    )
  UNION ALL
  SELECT 'enum_tournament_format_groups_playoffs',
    EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'tournament_format' AND e.enumlabel = 'groups_playoffs'
    )
  UNION ALL
  SELECT 'function_jwt_operational_league_id',
    EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'jwt_operational_league_id'
    )
  UNION ALL
  SELECT 'function_user_can_access_league',
    EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'user_can_access_league'
    )
  UNION ALL
  SELECT 'rls_tournaments_enabled',
    COALESCE((
      SELECT c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'tournaments'
    ), false)
  UNION ALL
  SELECT 'policy_tournaments_public_fixture_anon',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'tournaments'
        AND policyname = 'tournaments_public_fixture_anon'
    )
  UNION ALL
  SELECT 'policy_leagues_select_authenticated',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'leagues'
        AND policyname = 'leagues_select_authenticated'
    )
  UNION ALL
  SELECT 'prereq_leagues',
    EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'leagues'
    )
  UNION ALL
  SELECT 'prereq_categories',
    EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'categories'
    )
)
SELECT check_id, ok,
  CASE WHEN ok THEN 'OK' ELSE 'FALTA — aplicar Fase 2' END AS status
FROM checks
ORDER BY check_id;
