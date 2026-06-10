/**
 * Aplica migración 0040 (quitar defaults geográficos en clubs).
 *
 * Uso DEV:  node scripts/apply-migration-0040.mjs
 * Uso PROD: CONFIRM_PROD_MIGRATE=yes node scripts/apply-migration-0040.mjs --production
 */
import { runMigrationFile } from "./migration-runner.mjs";

const production = process.argv.includes("--production");

try {
  await runMigrationFile("0040_clubs_drop_geo_defaults.sql", { production });
} catch {
  process.exitCode = 1;
}
