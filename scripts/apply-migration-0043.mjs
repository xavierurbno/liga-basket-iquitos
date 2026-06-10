/**
 * Aplica migración 0043 (RLS en players, categories, league_settings, league_plans, player_documents).
 *
 * Uso DEV:  node scripts/apply-migration-0043.mjs
 * Uso PROD: CONFIRM_PROD_MIGRATE=yes node scripts/apply-migration-0043.mjs --production
 */
import { runMigrationFile } from "./migration-runner.mjs";

const production = process.argv.includes("--production");

try {
  await runMigrationFile("0043_rls_core_drizzle_tables.sql", { production });
} catch {
  process.exitCode = 1;
}
