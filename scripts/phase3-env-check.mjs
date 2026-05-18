/**
 * Fase 3 — Verificación de variables de entorno (local o CI).
 * No imprime valores secretos.
 *
 * Uso:
 *   node scripts/phase3-env-check.mjs
 *   node scripts/phase3-env-check.mjs --strict   # falla si falta recomendada
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const strict = process.argv.includes("--strict");

function loadEnvFile(filename) {
  const path = join(root, filename);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "MASTER_SUPER_ADMIN_EMAIL",
  "NEXT_PUBLIC_BUCKET_ASSETS",
  "NEXT_PUBLIC_BUCKET_PLAYERS",
  "NEXT_PUBLIC_BUCKET_GALLERY",
  "NEXT_PUBLIC_BUCKET_RECEIPTS",
];

const RECOMMENDED = [
  "DATABASE_POOL_MAX",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SYSTEM_OWNER_EMAILS",
];

const OPTIONAL = [
  "DATABASE_URL_POOLED",
  "DATABASE_URL_DIRECT",
  "DATABASE_USE_DIRECT_FIRST",
  "DASHBOARD_ADMIN_EMAILS",
  "NEXT_PUBLIC_BUCKET_NORMATIVAS",
];

function isSet(key) {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

function maskUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return "(URL inválida)";
  }
}

const warnings = [];
const errors = [];

for (const key of REQUIRED) {
  if (!isSet(key)) errors.push(`Falta obligatoria: ${key}`);
  else console.log(`✓ ${key}`);
}

for (const key of RECOMMENDED) {
  if (!isSet(key)) {
    const msg = `Falta recomendada: ${key}`;
    if (strict) errors.push(msg);
    else warnings.push(msg);
  } else console.log(`✓ ${key}`);
}

for (const key of OPTIONAL) {
  if (isSet(key)) console.log(`○ ${key} (opcional, definida)`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
if (supabaseUrl) {
  console.log(`  → Supabase host: ${maskUrl(supabaseUrl)}`);
  if (!supabaseUrl.includes("supabase.co")) {
    warnings.push("NEXT_PUBLIC_SUPABASE_URL no parece un host Supabase.");
  }
}

const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
if (dbUrl) {
  const host = maskUrl(dbUrl.replace(/^postgresql:/, "http:"));
  console.log(`  → DATABASE_URL host: ${host}`);
  if (dbUrl.includes("db.") && dbUrl.includes(".supabase.co") && !dbUrl.includes("pooler")) {
    warnings.push(
      "DATABASE_URL usa host directo db.*.supabase.co — en Vercel/serverless prefiere el pooler (*.pooler.supabase.com:6543).",
    );
  }
  if (!dbUrl.includes("pooler") && process.env.NODE_ENV === "production") {
    warnings.push("DATABASE_URL sin pooler en producción puede saturar conexiones.");
  }
}

const poolMax = process.env.DATABASE_POOL_MAX?.trim();
if (poolMax) {
  const n = Number.parseInt(poolMax, 10);
  if (!Number.isFinite(n) || n < 1 || n > 20) {
    warnings.push("DATABASE_POOL_MAX debe ser un entero entre 1 y 20.");
  } else if (n > 5) {
    warnings.push(`DATABASE_POOL_MAX=${n} es alto para Vercel; se recomienda 2.`);
  }
}

const site =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "";

console.log("\n── Supabase Auth (configurar en Dashboard, no en Vercel) ──");
if (site) {
  const base = site.replace(/\/+$/, "");
  const redirects = [
    `${base}/auth/callback`,
    `${base}/auth/callback/`,
    `${base}/`,
    `${base}/login/`,
  ];
  console.log("Site URL sugerida:", `${base}/`);
  console.log("Redirect URLs sugeridas (añadir todas):");
  for (const u of redirects) console.log(`  • ${u}`);
  console.log(
    "\nPreview Vercel: añade también https://<tu-proyecto>-<hash>.vercel.app/auth/callback/",
  );
} else {
  warnings.push(
    "Define NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_APP_URL para generar la lista de Redirect URLs.",
  );
}

console.log("\n── Vercel (acción manual si falta) ──");
if (!isSet("DATABASE_POOL_MAX")) {
  console.log("  Añadir en Production + Preview: DATABASE_POOL_MAX = 2");
}

if (warnings.length) {
  console.log("\nAdvertencias:");
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (errors.length) {
  console.error("\nErrores:");
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exitCode = 1;
} else if (warnings.length && strict) {
  process.exitCode = 1;
} else {
  console.log("\nFase 3 (env): listo para desplegar si Vercel y Supabase Auth coinciden con lo anterior.");
}
