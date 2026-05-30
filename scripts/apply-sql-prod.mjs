/**
 * Aplica un archivo SQL en PROD (emergencia cuando falla el SQL Editor web).
 *
 * Uso:
 *   CONFIRM_PROD_MIGRATE=yes node scripts/apply-sql-prod.mjs supabase/migrations/0028_league_social_links.sql
 *
 * Lee SOLO `.env.production.local` o `.env.local.backup-prod` (nunca `.env.local` de DEV).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres, isBenignMigrationError } from "./connect-postgres.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const prodEnvFile = [".env.production.local", ".env.local.backup-prod"]
  .map((f) => join(root, f))
  .find((p) => existsSync(p));

if (!prodEnvFile) {
  console.error("Crea .env.production.local o conserva .env.local.backup-prod con credenciales PROD.");
  process.exit(1);
}

dotenv.config({ path: prodEnvFile, override: true });
process.env.APP_ENV = "production";

if (!process.env.SUPABASE_PROJECT_REF?.trim()) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.DATABASE_URL ?? "";
  const m = url.match(/([a-z0-9]{20})\.supabase\.co/i) || url.match(/postgres\.([a-z0-9]{20})/i);
  if (m?.[1]) process.env.SUPABASE_PROJECT_REF = m[1];
}

if (process.env.CONFIRM_PROD_MIGRATE !== "yes") {
  console.error("Falta CONFIRM_PROD_MIGRATE=yes");
  process.exit(1);
}

const { ref, prod } = assertSafeMigrationTarget({ target: "production", forceProd: true });
if (!prod) {
  console.error(`El ref detectado (${ref}) no es producción. Revisa ${prodEnvFile}`);
  process.exit(1);
}

const relPath = process.argv[2];
if (!relPath) {
  console.error("Indica el archivo SQL, ej.: supabase/migrations/0028_league_social_links.sql");
  process.exit(1);
}

const body = readFileSync(join(root, relPath), "utf8");
console.log(`Archivo: ${relPath}`);
console.log(`Env: ${prodEnvFile.replace(root, ".")}`);

const sql = await connectPostgres();
try {
  await sql.unsafe(body);
  console.log("✓ SQL aplicado en PROD");
} catch (err) {
  if (isBenignMigrationError(err)) {
    console.log("○ SQL idempotente (columnas ya existían en PROD)");
  } else {
    throw err;
  }
} finally {
  await sql.end({ timeout: 5 });
}
