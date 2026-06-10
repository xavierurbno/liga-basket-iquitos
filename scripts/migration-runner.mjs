/**
 * Ejecuta un archivo SQL de supabase/migrations con guardia anti-prod.
 *
 * @param {string} filename — p. ej. "0042_liga_app_role.sql"
 * @param {{ production?: boolean }} [opts]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export async function runMigrationFile(filename, opts = {}) {
  const production = Boolean(opts.production);
  loadAppEnv(production ? "production" : "development");
  if (production) {
    assertSafeMigrationTarget({ target: "production", forceProd: true });
  } else {
    assertSafeMigrationTarget({ target: "development" });
  }

  const sql = await connectPostgres();
  const path = join(root, "supabase/migrations", filename);

  try {
    console.log(`→ Aplicando ${filename} …`);
    await sql.unsafe(readFileSync(path, "utf8"));
    console.log(`✓ Migración ${filename} aplicada`);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    throw err;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
