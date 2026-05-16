-- Normativas públicas (LDDBI): documentos legales con URL en Storage.

DO $$ BEGIN
  CREATE TYPE "public"."normativa_document_category" AS ENUM ('REGLAMENTO', 'BASES', 'COMUNICADO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "file_url" text NOT NULL,
  "category" "public"."normativa_document_category" NOT NULL,
  "is_public" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "documents_is_public_idx" ON "public"."documents" ("is_public");

ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_public" ON "public"."documents";
CREATE POLICY "documents_select_public"
  ON "public"."documents"
  FOR SELECT
  TO anon, authenticated
  USING ("is_public" = true);

DROP POLICY IF EXISTS "documents_all_league_admin" ON "public"."documents";
CREATE POLICY "documents_all_league_admin"
  ON "public"."documents"
  FOR ALL
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('SUPER_ADMIN', 'LEAGUE_ADMIN'));

GRANT SELECT ON "public"."documents" TO anon, authenticated;
GRANT ALL ON "public"."documents" TO service_role;
