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
import { spawnSync } from "node:child_process";
import {
  connectPostgres,
  isBenignMigrationError,
  shouldSkipAuthStubStatement,
  splitMigrationStatements,
} from "./connect-postgres.mjs";

const target = process.argv[2] === "production" ? "production" : "development";
const { root } = loadAppEnv(target);
assertSafeMigrationTarget({ target, forceProd: process.argv.includes("--force-prod") });

const manifestCheck = spawnSync(process.execPath, ["scripts/validate-migration-manifest.mjs"], {
  cwd: root,
  stdio: "inherit",
});
if (manifestCheck.status !== 0) {
  process.exit(manifestCheck.status ?? 1);
}

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
      const statements = splitMigrationStatements(body);
      let fileOk = true;

      for (const statement of statements) {
        if (shouldSkipAuthStubStatement(statement)) {
          skipped += 1;
          continue;
        }
        try {
          await sql.unsafe(statement);
        } catch (err) {
          if (isBenignMigrationError(err)) {
            skipped += 1;
          } else {
            fileOk = false;
            throw err;
          }
        }
      }

      if (fileOk) {
        applied += 1;
        console.log(`  ✓ OK (${statements.length} sentencias)`);
      } else {
        console.log(`  ○ parcial (${statements.length} sentencias)`);
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
