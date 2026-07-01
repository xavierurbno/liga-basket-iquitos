import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/** CLI 54+ evita prompts git_branch_required en Preview. */
const VERCEL = "npx vercel@latest";
const previewOnly = process.argv.includes("--preview");
const productionOnly =
  process.argv.includes("--production") || !previewOnly;

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true, timeout: 180_000 });
}

function loadUrl(file) {
  const parsed = dotenv.parse(readFileSync(file, "utf8"));
  return parsed.DATABASE_URL_APP?.trim();
}

function syncTarget(target, url) {
  const quoted = JSON.stringify(url);
  const flags = "--yes --non-interactive";
  try {
    run(`${VERCEL} env update DATABASE_URL_APP ${target} --value ${quoted} ${flags}`);
  } catch {
    run(`${VERCEL} env add DATABASE_URL_APP ${target} --value ${quoted} ${flags}`);
  }
  console.log(`✓ DATABASE_URL_APP → ${target}`);
}

if (productionOnly) {
  const prodUrl = loadUrl(join(root, ".env.production.local"));
  if (!prodUrl) {
    console.error("Falta DATABASE_URL_APP en .env.production.local");
    process.exit(1);
  }
  syncTarget("production", prodUrl);
}

if (previewOnly) {
  const previewUrl = loadUrl(join(root, ".env.local"));
  if (!previewUrl) {
    console.error("Falta DATABASE_URL_APP en .env.local");
    process.exit(1);
  }
  syncTarget("preview", previewUrl);
}
