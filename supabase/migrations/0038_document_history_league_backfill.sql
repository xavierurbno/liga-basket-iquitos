-- Backfill league_id en historial documental y endurecer RLS (sin filas NULL cross-tenant).

UPDATE document_history dh
SET league_id = (dh.snapshot->>'leagueId')::uuid
WHERE dh.league_id IS NULL
  AND dh.snapshot->>'leagueId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE document_history dh
SET league_id = c.league_id
FROM players p
JOIN clubs c ON c.id = p.club_id
WHERE dh.league_id IS NULL
  AND dh.type IN ('CARTA_PASE', 'CONSTANCIA')
  AND dh.entity_id = p.id
  AND c.league_id IS NOT NULL;

UPDATE document_history dh
SET league_id = c.league_id
FROM clubs c
WHERE dh.league_id IS NULL
  AND dh.type = 'SOLVENCIA_CLUB'
  AND dh.entity_id = c.id
  AND c.league_id IS NOT NULL;

DROP POLICY IF EXISTS document_history_staff ON public.document_history;

CREATE POLICY document_history_staff ON public.document_history
  FOR ALL TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.jwt_role() = 'LEAGUE_ADMIN'
      AND league_id IS NOT NULL
      AND league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
    )
  )
  WITH CHECK (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      public.jwt_role() = 'LEAGUE_ADMIN'
      AND league_id IS NOT NULL
      AND league_id IS NOT DISTINCT FROM public.jwt_operational_league_id()
    )
  );
