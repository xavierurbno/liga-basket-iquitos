-- Tabla pública de normativas (LDDBI) — campos en español, alineada con Drizzle `normativas`.

DO $$ BEGIN
  CREATE TYPE "public"."normativa_document_category" AS ENUM ('REGLAMENTO', 'BASES', 'COMUNICADO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."normativas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "titulo" text NOT NULL,
  "descripcion" text,
  "url_archivo" text NOT NULL,
  "categoria" "public"."normativa_document_category" NOT NULL,
  "es_publico" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "normativas_es_publico_idx" ON "public"."normativas" ("es_publico");

-- Migración opcional desde la tabla legacy `documents` (solo si existe; evita error 42P01 si no hay `documents`).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'documents'
  ) THEN
    EXECUTE $mig$
      INSERT INTO "public"."normativas" ("id", "titulo", "descripcion", "url_archivo", "categoria", "es_publico", "created_at", "updated_at")
      SELECT
        d."id",
        d."title",
        d."description",
        d."file_url",
        d."category"::"public"."normativa_document_category",
        d."is_public",
        d."created_at",
        d."updated_at"
      FROM "public"."documents" AS d
      WHERE NOT EXISTS (SELECT 1 FROM "public"."normativas" AS n WHERE n."id" = d."id")
    $mig$;
  END IF;
END $$;
ALTER TABLE "public"."normativas" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "normativas_select_public" ON "public"."normativas";
CREATE POLICY "normativas_select_public"
  ON "public"."normativas"
  FOR SELECT
  TO anon, authenticated
  USING ("es_publico" = true);

DROP POLICY IF EXISTS "normativas_all_league_admin" ON "public"."normativas";
CREATE POLICY "normativas_all_league_admin"
  ON "public"."normativas"
  FOR ALL
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'));

GRANT SELECT ON "public"."normativas" TO anon, authenticated;
GRANT ALL ON "public"."normativas" TO service_role;
