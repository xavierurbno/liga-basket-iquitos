/**
 * Reinicia solo el schema public en DEV (BD vacía para bootstrap).
 * NO toca auth.* de Supabase.
 *
 * Uso: npm run db:reset:dev
 */
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres } from "./connect-postgres.mjs";

loadAppEnv("development");
assertSafeMigrationTarget({ target: "development" });

async function main() {
  const sql = await connectPostgres();
  try {
    console.log("→ DROP SCHEMA public CASCADE …");
    await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE;");
    await sql.unsafe("CREATE SCHEMA public;");
    await sql.unsafe("GRANT ALL ON SCHEMA public TO postgres;");
    await sql.unsafe("GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;");
    console.log("✓ Schema public reiniciado (listo para db:bootstrap:dev).");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
