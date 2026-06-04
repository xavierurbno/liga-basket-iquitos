-- Fase 2 auditoría: historial persistente de acciones de negocio.
-- Escritura vía Drizzle (rol servidor); lectura vía PostgREST con RLS por liga/rol.

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  actor_role varchar(30),
  action varchar(80) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid,
  league_id uuid REFERENCES public.leagues (id) ON DELETE SET NULL,
  club_id uuid REFERENCES public.clubs (id) ON DELETE SET NULL,
  client_ip varchar(45),
  payload jsonb
);

CREATE INDEX IF NOT EXISTS audit_events_league_created_idx
  ON public.audit_events (league_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_entity_idx
  ON public.audit_events (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS audit_events_actor_created_idx
  ON public.audit_events (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_action_created_idx
  ON public.audit_events (action, created_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_events_select_scoped ON public.audit_events;
CREATE POLICY audit_events_select_scoped ON public.audit_events
  FOR SELECT TO authenticated
  USING (
    public.jwt_role() = 'SUPER_ADMIN'
    OR (
      league_id IS NOT NULL
      AND public.user_can_access_league(league_id)
    )
    OR (
      public.jwt_role() = 'CLUB_DELEGATE'
      AND club_id IS NOT DISTINCT FROM public.jwt_club_id()
    )
  );

-- Sin política INSERT/UPDATE/DELETE para authenticated: solo el rol de servidor escribe.

GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
