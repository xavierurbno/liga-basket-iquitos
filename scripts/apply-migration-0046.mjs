/**
 * Aplica migración 0046 (reparación de public.player_documents — columna "type" faltante).
 *
 * Uso DEV:  node scripts/apply-migration-0046.mjs
 * Uso PROD: CONFIRM_PROD_MIGRATE=yes node scripts/apply-migration-0046.mjs --production
 */
import { runMigrationFile } from "./migration-runner.mjs";

const production = process.argv.includes("--production");

try {
  await runMigrationFile("0046_player_documents_schema_repair.sql", { production });
} catch {
  process.exitCode = 1;
}
