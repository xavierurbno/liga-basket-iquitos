/**
 * Bootstrap: aplica todas las migraciones SQL en orden (BD vacía DEV).
 *
 * Uso:
 *   npm run db:bootstrap:dev
 *   CONFIRM_PROD_MIGRATE=yes npm run db:bootstrap:prod -- --force-prod
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { MIGRATION_SQL_ORDER } from "./db-migration-manifest.mjs";
import { connectPostgres, isBenignMigrationError } from "./connect-postgres.mjs";

const target = process.argv[2] === "production" ? "production" : "development";
const { root } = loadAppEnv(target);
assertSafeMigrationTarget({ target, forceProd: process.argv.includes("--force-prod") });

async function main() {
  const sql = await connectPostgres();
  let applied = 0;
  let skipped = 0;

  try {
    for (const relativePath of MIGRATION_SQL_ORDER) {
      const fullPath = join(root, relativePath);
      let body;
      try {
        body = readFileSync(fullPath, "utf8");
      } catch {
        console.warn(`⚠ Archivo no encontrado, omitido: ${relativePath}`);
        skipped += 1;
        continue;
      }

      console.log(`\n→ ${relativePath}`);
      try {
        await sql.unsafe(body);
        applied += 1;
        console.log("  ✓ OK");
      } catch (err) {
        if (isBenignMigrationError(err)) {
          skipped += 1;
          console.log(`  ○ omitido (ya aplicado): ${err.message?.slice(0, 80)}`);
        } else {
          throw err;
        }
      }
    }

    const [{ exists }] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leagues'
      ) AS exists
    `;

    console.log(`\n── Resumen ──`);
    console.log(`  Aplicados: ${applied}`);
    console.log(`  Omitidos/idempotentes: ${skipped}`);
    console.log(`  Tabla leagues: ${exists ? "✓ existe" : "✗ falta"}`);

    if (!exists) {
      process.exitCode = 1;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("\nError bootstrap:", err instanceof Error ? err.message : err);
  process.exit(1);
});
