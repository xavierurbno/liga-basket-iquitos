/**
 * Fase D — Production: lecturas con liga_app + RLS (USE_APP_DB_ROLE=true).
 * No activa escrituras (USE_APP_DB_ROLE_WRITES=false).
 *
 * Uso: npm run vercel:sync:env:production:phase-d
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prodEnv = dotenv.parse(readFileSync(join(root, ".env.production.local"), "utf8"));

const databaseUrlApp = prodEnv.DATABASE_URL_APP?.trim();
if (!databaseUrlApp) {
  console.error(
    "Falta DATABASE_URL_APP en .env.production.local.\n" +
      "Ejecuta provision-liga-app-role.mjs --production primero.",
  );
  process.exit(1);
}

const VERCEL = "npx vercel@latest";
const flags = "--yes --non-interactive";

const vars = {
  DATABASE_URL_APP: databaseUrlApp,
  USE_APP_DB_ROLE: "true",
  USE_APP_DB_ROLE_WRITES: "false",
  DATABASE_POOL_MAX: "2",
};

function run(cmd) {
  const result = spawnSync(cmd, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    timeout: 180_000,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd}`);
  }
}

function syncProduction(key, value) {
  const quoted = JSON.stringify(value);
  try {
    run(`${VERCEL} env update ${key} production --value ${quoted} ${flags}`);
  } catch {
    run(`${VERCEL} env add ${key} production --value ${quoted} ${flags}`);
  }
  console.log(`✓ ${key} → production`);
}

console.log("Fase D — activando lecturas RLS en Production (sin escrituras)…\n");

for (const [key, value] of Object.entries(vars)) {
  try {
    syncProduction(key, value);
  } catch (err) {
    console.error(
      `\n✗ ${key}: ${err instanceof Error ? err.message : err}\n` +
        `  Configúrala manualmente en Vercel → Production.\n`,
    );
    process.exitCode = 1;
  }
}

console.log("\nProduction listo. Redeploy: npx vercel@latest deploy --prod --yes");
