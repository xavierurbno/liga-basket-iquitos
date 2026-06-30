/**
 * Provisiona rol liga_app: contraseña + hint DATABASE_URL_APP.
 *
 * Uso:
 *   LIGA_APP_DB_PASSWORD='...' node scripts/provision-liga-app-role.mjs
 *   CONFIRM_PROD_MIGRATE=yes LIGA_APP_DB_PASSWORD='...' node scripts/provision-liga-app-role.mjs --production
 *
 * Opcional: --apply-migrations (0042 + 0043 si aún no aplicadas)
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres } from "./connect-postgres.mjs";
import { runMigrationFile } from "./migration-runner.mjs";
import { withPgbouncerParam } from "./resolve-db-url.mjs";
import { resolveProjectRef } from "./load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const production = process.argv.includes("--production");
loadAppEnv(production ? "production" : "development");
if (production) {
  assertSafeMigrationTarget({ target: "production", forceProd: true });
} else {
  assertSafeMigrationTarget({ target: "development" });
}

const password = process.env.LIGA_APP_DB_PASSWORD?.trim();
if (!password || password.length < 12) {
  console.error("Define LIGA_APP_DB_PASSWORD (mín. 12 caracteres) en el entorno.");
  process.exit(1);
}

function resolveAppHintBaseUrl() {
  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  const explicit = process.env.DATABASE_URL?.trim();
  const direct = process.env.DATABASE_URL_DIRECT?.trim();
  return pooled || explicit || direct || "";
}

const ownerUrl = resolveAppHintBaseUrl();
if (!ownerUrl) {
  console.error("DATABASE_URL no definida.");
  process.exit(1);
}

const applyMigrations = process.argv.includes("--apply-migrations");

function buildAppUrl(baseUrl, pwd) {
  const u = new URL(baseUrl.replace(/^postgresql:/, "http:"));
  const ref = resolveProjectRef();
  const onPooler = u.hostname.includes("pooler.supabase.com");
  u.username = onPooler && ref ? `liga_app.${ref}` : "liga_app";
  u.password = encodeURIComponent(pwd);
  return u.toString().replace(/^http:/, "postgresql:");
}

const sql = await connectPostgres();

try {
  if (applyMigrations) {
    for (const file of ["0042_liga_app_role.sql", "0043_rls_core_drizzle_tables.sql"]) {
      const path = join(root, "supabase/migrations", file);
      if (!existsSync(path)) continue;
      await runMigrationFile(file, { production });
    }
  }

  console.log("→ Estableciendo contraseña de liga_app …");
  await sql.unsafe(`ALTER ROLE liga_app WITH LOGIN PASSWORD '${password.replace(/'/g, "''")}'`);

  const appUrl = withPgbouncerParam(buildAppUrl(ownerUrl, password));
  console.log("\n✓ Rol liga_app listo.\n");
  console.log("Añade a .env.local (o Vercel):\n");
  console.log(`DATABASE_URL_APP=${appUrl}`);
  console.log("\nRollback runtime: USE_APP_DB_ROLE=false");
} catch (err) {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
