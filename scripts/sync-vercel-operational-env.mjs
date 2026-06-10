/**
 * Sincroniza variables operacionales en Vercel (Production + Preview).
 * Uso: node scripts/sync-vercel-operational-env.mjs
 *
 * Requiere: vercel CLI autenticado, DATABASE_URL_APP en .env.production.local
 * o re-ejecutar provision-liga-app-role.mjs --production antes.
 */
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.production.local") });

function clean(v) {
  return String(v ?? "")
    .trim()
    .replace(/\r\n/g, "")
    .replace(/\n/g, "");
}

const appUrl = clean(process.env.DATABASE_URL_APP);
if (!appUrl) {
  console.error(
    "Falta DATABASE_URL_APP en .env.production.local.\n" +
      "Ejecuta: CONFIRM_PROD_MIGRATE=yes LIGA_APP_DB_PASSWORD='...' node scripts/provision-liga-app-role.mjs --production\n" +
      "Copia la línea DATABASE_URL_APP=... a .env.production.local y vuelve a ejecutar este script.",
  );
  process.exit(1);
}

const vars = {
  PLATFORM_DEFAULT_LEAGUE_SLUG: "lddbi",
  PLATFORM_NAME: "Plataforma de ligas",
  USE_APP_DB_ROLE: "false",
  USE_APP_DB_ROLE_WRITES: "false",
  SIGNUP_ENABLED: "false",
  DATABASE_URL_APP: appUrl,
};

const targets = process.argv.includes("--preview-only")
  ? ["preview"]
  : process.argv.includes("--production-only")
    ? ["production"]
    : ["production", "preview"];

function shellQuote(value) {
  if (process.platform === "win32") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function vercel(subcommand) {
  execSync(`npx vercel ${subcommand}`, {
    cwd: root,
    stdio: "inherit",
    timeout: 120_000,
    shell: true,
  });
}

for (const target of targets) {
  for (const [key, value] of Object.entries(vars)) {
    const quoted = shellQuote(value);
    if (target === "production") {
      try {
        vercel(`env update ${key} production --value ${quoted} --yes`);
      } catch {
        vercel(`env add ${key} production --value ${quoted} --yes`);
      }
    } else {
      try {
        vercel(`env update ${key} preview --value ${quoted} --yes`);
      } catch {
        try {
          vercel(`env rm ${key} preview --yes`);
        } catch {
          /* no existía */
        }
        vercel(`env add ${key} preview --value ${quoted} --yes`);
      }
    }
    console.log(`✓ ${key} → ${target}`);
  }
}

console.log("\nListo. Redeploy: vercel --prod");
