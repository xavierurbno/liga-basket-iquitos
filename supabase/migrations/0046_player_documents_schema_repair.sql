-- 0046 — Reparación idempotente de public.player_documents.
-- Corrige el error 42703 (column "type" does not exist) en entornos donde la
-- tabla quedó con un esquema legacy (document_type, file_url, file_path, ...)
-- distinto al canónico de src/lib/db/schema.ts (playerDocuments).
--
-- Estrategia segura por datos:
--   * Si la tabla NO existe o está VACÍA  -> se (re)crea con el esquema canónico.
--   * Si la tabla TIENE datos             -> solo se AGREGAN columnas faltantes
--                                            (nunca se destruyen datos).

-- 1) Enum de tipo de documento del jugador (crea si falta).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_jugador') THEN
    CREATE TYPE public.tipo_documento_jugador AS ENUM (
      'FICHA_MEDICA',
      'FOTO_CARNET',
      'AUTORIZACION_PADRES',
      'CONTRATO_CLUB',
      'REGLAMENTO_FIRMADO',
      'OTRO'
    );
  END IF;
END $$;

-- 2) Recreación limpia SOLO si la tabla no existe o está vacía.
DO $$
DECLARE
  table_exists boolean;
  row_count bigint := 0;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'player_documents'
  ) INTO table_exists;

  IF table_exists THEN
    EXECUTE 'SELECT count(*) FROM public.player_documents' INTO row_count;
  END IF;

  IF (NOT table_exists) OR row_count = 0 THEN
    -- Tabla ausente o vacía: recreación canónica (sin pérdida de datos).
    DROP TABLE IF EXISTS public.player_documents CASCADE;

    CREATE TABLE public.player_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
      club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
      type public.tipo_documento_jugador NOT NULL,
      file_name varchar(255) NOT NULL,
      storage_key text NOT NULL,
      public_url text,
      size_bytes integer,
      mime_type varchar(100),
      verified boolean DEFAULT false,
      verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      verification_date timestamp,
      expiration_date timestamp,
      created_at timestamp DEFAULT now() NOT NULL
    );
  ELSE
    -- Tabla con datos: modo aditivo, nunca destructivo.
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS type public.tipo_documento_jugador NOT NULL DEFAULT 'OTRO';
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS file_name varchar(255) NOT NULL DEFAULT '';
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS storage_key text NOT NULL DEFAULT '';
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS public_url text;
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS size_bytes integer;
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS mime_type varchar(100);
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS verified_by uuid;
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS verification_date timestamp;
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS expiration_date timestamp;
    ALTER TABLE public.player_documents
      ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;
  END IF;
END $$;

-- 3) Índices (idempotentes; aplican en ambos caminos).
CREATE INDEX IF NOT EXISTS docs_player_idx ON public.player_documents (player_id);
CREATE INDEX IF NOT EXISTS docs_club_idx ON public.player_documents (club_id);

-- 4) RLS + políticas (recreadas de 0043; el DROP CASCADE las elimina si se recreó la tabla).
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

-- 5) Grants al rol de aplicación (idempotente; explícito por si el owner difiere).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'liga_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_documents TO liga_app;
  END IF;
END $$;
