/**
 * Aplica migración 0042 (rol liga_app).
 *
 * Uso DEV:  node scripts/apply-migration-0042.mjs
 * Uso PROD: CONFIRM_PROD_MIGRATE=yes node scripts/apply-migration-0042.mjs --production
 */
import { runMigrationFile } from "./migration-runner.mjs";

const production = process.argv.includes("--production");

try {
  await runMigrationFile("0042_liga_app_role.sql", { production });
  console.log(
    "\nSiguiente: LIGA_APP_DB_PASSWORD='...' node scripts/provision-liga-app-role.mjs" +
      (production ? " --production" : ""),
  );
} catch {
  process.exitCode = 1;
}
