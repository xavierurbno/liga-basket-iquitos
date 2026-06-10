import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.production.local") });

const url = process.env.DATABASE_URL_APP?.trim();

const vars = {
  PLATFORM_DEFAULT_LEAGUE_SLUG: "lddbi",
  PLATFORM_NAME: "Plataforma de ligas",
  USE_APP_DB_ROLE: "false",
  USE_APP_DB_ROLE_WRITES: "false",
  SIGNUP_ENABLED: "false",
  ...(url ? { DATABASE_URL_APP: url } : {}),
};

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true, timeout: 120_000 });
}

for (const [key, value] of Object.entries(vars)) {
  const quoted = JSON.stringify(value);
  try {
    run(`npx vercel env update ${key} preview --value ${quoted} --yes`);
  } catch {
    try {
      run(`npx vercel env rm ${key} preview --yes`);
    } catch {
      /* */
    }
    run(`npx vercel env add ${key} preview --value ${quoted} --yes`);
  }
  console.log(`✓ ${key} → preview`);
}

console.log("\nPreview listo.");
