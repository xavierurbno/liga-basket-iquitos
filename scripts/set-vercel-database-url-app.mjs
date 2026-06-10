import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.production.local") });

const url = process.env.DATABASE_URL_APP?.trim();
if (!url) {
  console.error("Falta DATABASE_URL_APP en .env.production.local");
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true, timeout: 120_000 });
}

const quoted = JSON.stringify(url);
try {
  run(`npx vercel env update DATABASE_URL_APP production --value ${quoted} --yes`);
} catch {
  try {
    run(`npx vercel env rm DATABASE_URL_APP production --yes`);
  } catch {
    /* */
  }
  run(`npx vercel env add DATABASE_URL_APP production --value ${quoted} --yes`);
}
console.log("✓ DATABASE_URL_APP en production");
