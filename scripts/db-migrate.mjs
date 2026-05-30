/**
 * Ejecuta drizzle-kit migrate con guardia anti-prod.
 *
 * Uso:
 *   node scripts/db-migrate.mjs development
 *   CONFIRM_PROD_MIGRATE=yes node scripts/db-migrate.mjs production --force-prod
 */
import { execSync } from "node:child_process";
import { loadAppEnv } from "./load-env.mjs";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { resolveDrizzleUrl } from "./resolve-db-url.mjs";

const target = process.argv[2] === "production" ? "production" : "development";
loadAppEnv(target);
assertSafeMigrationTarget({ target, forceProd: process.argv.includes("--force-prod") });

const url = resolveDrizzleUrl();
if (!url) {
  console.error("Falta DATABASE_URL_DIRECT o DATABASE_URL.");
  process.exit(1);
}

console.log(`\n→ drizzle-kit migrate (APP_ENV=${process.env.APP_ENV})`);
execSync("npx drizzle-kit migrate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
