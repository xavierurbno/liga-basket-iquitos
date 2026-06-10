/**
 * Duplica KV_REST_API_* → UPSTASH_REDIS_REST_* en Vercel (alias documentales).
 * La app ya acepta ambos; esto ayuda en dashboards y docs.
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local") });

const url =
  process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();

if (!url || !token) {
  console.error("Falta KV_REST_API_URL/TOKEN en .env.local (ejecuta integración Upstash o vercel env pull)");
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true, timeout: 120_000 });
}

const pairs = [
  ["UPSTASH_REDIS_REST_URL", url],
  ["UPSTASH_REDIS_REST_TOKEN", token],
];

for (const target of ["production", "preview", "development"]) {
  for (const [key, value] of pairs) {
    const quoted = JSON.stringify(value);
    try {
      run(`npx vercel env update ${key} ${target} --value ${quoted} --yes`);
    } catch {
      try {
        run(`npx vercel env rm ${key} ${target} --yes`);
      } catch {
        /* */
      }
      run(`npx vercel env add ${key} ${target} --value ${quoted} --yes`);
    }
    console.log(`✓ ${key} → ${target}`);
  }
}

console.log("\nAlias UPSTASH_* sincronizados.");
