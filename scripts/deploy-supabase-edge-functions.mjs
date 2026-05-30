#!/usr/bin/env node
/**
 * Despliega Edge Functions versionadas en supabase/functions/.
 *
 * Uso:
 *   node scripts/deploy-supabase-edge-functions.mjs
 *   node scripts/deploy-supabase-edge-functions.mjs --project-ref jfgnwtkmqayzhlwfxidz
 *
 * Requiere: Supabase CLI (`npx supabase`) y sesión (`supabase login`).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const FUNCTIONS = ["process-player-image"];

function parseProjectRef() {
  const flag = process.argv.indexOf("--project-ref");
  if (flag >= 0 && process.argv[flag + 1]) {
    return process.argv[flag + 1].trim();
  }
  return process.env.SUPABASE_PROJECT_REF?.trim() || "";
}

function run(args) {
  const result = spawnSync("npx", ["supabase", ...args], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const projectRef = parseProjectRef();
if (!projectRef) {
  console.error(
    "Indica --project-ref <ref> o define SUPABASE_PROJECT_REF (ej. jfgnwtkmqayzhlwfxidz).",
  );
  process.exit(1);
}

console.log(`Desplegando funciones en ${projectRef}…`);
for (const name of FUNCTIONS) {
  console.log(`\n→ ${name}`);
  run(["functions", "deploy", name, "--project-ref", projectRef]);
}
console.log("\nListo.");
