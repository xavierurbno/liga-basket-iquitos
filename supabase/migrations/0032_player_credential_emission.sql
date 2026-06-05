-- Fase 4: emisión unificada de carnet (versión y fecha de emisión por jugador).

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS credential_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credential_issued_at timestamptz;

COMMENT ON COLUMN public.players.credential_version IS
  'Versión de emisión del carnet digital (0 = nunca emitido).';
COMMENT ON COLUMN public.players.credential_issued_at IS
  'Fecha/hora de la última emisión registrada en el sistema.';
