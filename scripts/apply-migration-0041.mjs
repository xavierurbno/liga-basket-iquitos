/**
 * Aplica migración 0041 (planes y límites por liga).
 *
 * Uso DEV:  node scripts/apply-migration-0041.mjs
 * Uso PROD: CONFIRM_PROD_MIGRATE=yes node scripts/apply-migration-0041.mjs --production
 */
import { runMigrationFile } from "./migration-runner.mjs";

const production = process.argv.includes("--production");

try {
  await runMigrationFile("0041_league_plans.sql", { production });
} catch {
  process.exitCode = 1;
}
