-- Fase 6: normativas e historial de emisiones por liga

ALTER TABLE public.normativas
  ADD COLUMN IF NOT EXISTS league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS normativas_league_id_idx ON public.normativas (league_id);
CREATE INDEX IF NOT EXISTS normativas_league_public_idx ON public.normativas (league_id, es_publico);

-- Backfill: liga principal (LDDBI / Iquitos)
UPDATE public.normativas n
SET league_id = sub.id
FROM (
  SELECT l.id
  FROM public.leagues l
  WHERE lower(l.slug) IN ('lddbi', 'iquitos')
  ORDER BY CASE lower(l.slug) WHEN 'lddbi' THEN 0 ELSE 1 END
  LIMIT 1
) AS sub
WHERE n.league_id IS NULL;

ALTER TABLE public.document_history
  ADD COLUMN IF NOT EXISTS league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS document_history_league_id_idx ON public.document_history (league_id);

-- RLS: staff solo modifica normativas de su liga (SUPER_ADMIN sin restricción de liga)
DROP POLICY IF EXISTS "normativas_all_league_admin" ON public.normativas;

DROP POLICY IF EXISTS "normativas_select_staff" ON public.normativas;
CREATE POLICY "normativas_select_staff"
  ON public.normativas
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'SUPER_ADMIN'
    OR (
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'LEAGUE_ADMIN'
      AND league_id IS NOT NULL
      AND league_id::text = COALESCE(auth.jwt() -> 'app_metadata' ->> 'league_id', '')
    )
  );

DROP POLICY IF EXISTS "normativas_modify_staff" ON public.normativas;
CREATE POLICY "normativas_modify_staff"
  ON public.normativas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'SUPER_ADMIN'
    OR (
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'LEAGUE_ADMIN'
      AND league_id IS NOT NULL
      AND league_id::text = COALESCE(auth.jwt() -> 'app_metadata' ->> 'league_id', '')
    )
  );

CREATE POLICY "normativas_update_staff"
  ON public.normativas
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'SUPER_ADMIN'
    OR (
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'LEAGUE_ADMIN'
      AND league_id IS NOT NULL
      AND league_id::text = COALESCE(auth.jwt() -> 'app_metadata' ->> 'league_id', '')
    )
  )
  WITH CHECK (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'SUPER_ADMIN'
    OR (
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'LEAGUE_ADMIN'
      AND league_id IS NOT NULL
      AND league_id::text = COALESCE(auth.jwt() -> 'app_metadata' ->> 'league_id', '')
    )
  );

CREATE POLICY "normativas_delete_staff"
  ON public.normativas
  FOR DELETE
  TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'SUPER_ADMIN'
    OR (
      COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'LEAGUE_ADMIN'
      AND league_id IS NOT NULL
      AND league_id::text = COALESCE(auth.jwt() -> 'app_metadata' ->> 'league_id', '')
    )
  );
