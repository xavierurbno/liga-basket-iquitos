-- Fase 5b: rol PostgreSQL limitado para runtime Drizzle (RLS efectivo).
-- La contraseña se define fuera del SQL: scripts/provision-liga-app-role.mjs + LIGA_APP_DB_PASSWORD

DO $$ BEGIN
  CREATE ROLE liga_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER ROLE liga_app NOBYPASSRLS;

GRANT USAGE ON SCHEMA public TO liga_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO liga_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO liga_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO liga_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO liga_app;

-- Políticas RLS usan TO authenticated + auth.jwt()
GRANT USAGE ON SCHEMA auth TO liga_app;
GRANT authenticated TO liga_app;

COMMENT ON ROLE liga_app IS
  'Rol runtime Next/Drizzle (Fase 5b). Sin BYPASSRLS. URI: DATABASE_URL_APP.';
