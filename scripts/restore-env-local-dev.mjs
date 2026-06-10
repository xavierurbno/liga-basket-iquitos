/**
 * Restaura .env.local para desarrollo (Supabase txmnlszmumayyrisqeby).
 * Conserva variables KV_* de Upstash si existen.
 *
 * Requiere: supabase CLI autenticado + proyecto enlazado (supabase link).
 * Contraseña DB: SUPABASE_DB_PASSWORD o URI postgres existente en .env.local / backups.
 *
 * Uso: node scripts/restore-env-local-dev.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");
const ref = "txmnlszmumayyrisqeby";

function run(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8", shell: true, timeout: 120_000 });
}

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function quoteEnv(value) {
  if (/[\s#"]/.test(value)) return `"${value.replace(/"/g, '\\"')}"`;
  return value;
}

function readPoolerHost() {
  const poolerFile = join(root, "supabase", ".temp", "pooler-url");
  if (existsSync(poolerFile)) {
    const raw = readFileSync(poolerFile, "utf8").trim();
    try {
      const host = new URL(raw.replace(/^postgresql:/, "http:")).hostname;
      if (host) return host;
    } catch {
      /* ignore */
    }
  }
  const dryRun = run("npx supabase db dump --linked --dry-run 2>&1");
  return dryRun.match(/export PGHOST="([^"]+)"/)?.[1] ?? "aws-1-us-west-2.pooler.supabase.com";
}

function parsePostgresPasswordFromUrl(url) {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url.trim().replace(/^postgresql:/, "http:"));
    const user = decodeURIComponent(parsed.username);
    if (!user.startsWith("postgres")) return null;
    const password = decodeURIComponent(parsed.password);
    return password || null;
  } catch {
    return null;
  }
}

function collectPasswordCandidates(preserved) {
  const candidates = [];
  const add = (value) => {
    const trimmed = value?.trim();
    if (trimmed && !candidates.includes(trimmed)) candidates.push(trimmed);
  };

  add(process.env.SUPABASE_DB_PASSWORD);

  for (const key of ["DATABASE_URL", "DATABASE_URL_POOLED", "DATABASE_URL_DIRECT"]) {
    add(parsePostgresPasswordFromUrl(preserved[key]));
  }

  const backupNames = readdirSync(root).filter(
    (name) => name.startsWith(".env") && name !== ".env.local",
  );
  for (const name of backupNames) {
    const env = parseEnvFile(join(root, name));
    for (const key of ["DATABASE_URL", "DATABASE_URL_POOLED", "DATABASE_URL_DIRECT"]) {
      add(parsePostgresPasswordFromUrl(env[key]));
    }
  }

  return candidates;
}

async function resolveWorkingPassword(host, candidates) {
  for (const password of candidates) {
    const uri = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:6543/postgres?pgbouncer=true`;
    const sql = postgres(uri, { max: 1, ssl: "require", connect_timeout: 12 });
    try {
      const [row] = await sql`
        select current_user as user, (select count(*)::int from public.leagues) as leagues
      `;
      if (row?.user === "postgres") {
        return password;
      }
    } catch {
      /* try next */
    } finally {
      await sql.end({ timeout: 2 }).catch(() => {});
    }
  }
  return null;
}

function buildDatabaseUrls(host, password) {
  const encoded = encodeURIComponent(password);
  const pooled = `postgresql://postgres.${ref}:${encoded}@${host}:6543/postgres?pgbouncer=true`;
  const direct = `postgresql://postgres.${ref}:${encoded}@${host}:5432/postgres`;
  return { pooled, direct };
}

function fetchApiKeys() {
  const json = run(`npx supabase projects api-keys --project-ref ${ref} -o json 2>nul`);
  const keys = JSON.parse(json);
  const anon = keys.find((k) => k.name === "anon" || k.id === "anon")?.api_key;
  const service = keys.find((k) => k.name === "service_role" || k.id === "service_role")
    ?.api_key;
  if (!anon || !service) {
    throw new Error("No se pudieron leer API keys (supabase projects api-keys -o json).");
  }
  return { anon, service };
}

const preserved = parseEnvFile(envPath);
const kvKeys = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "KV_REST_API_READ_ONLY_TOKEN",
  "KV_URL",
  "REDIS_URL",
];

const host = readPoolerHost();
const password = await resolveWorkingPassword(host, collectPasswordCandidates(preserved));
if (!password) {
  console.error(
    "No se pudo obtener contraseña del rol postgres para DEV.\n" +
      "Opciones:\n" +
      "  1. SUPABASE_DB_PASSWORD=tu_password node scripts/restore-env-local-dev.mjs\n" +
      "  2. Supabase Dashboard → liga-iquitos-dev → Database → Connect (copiar password)\n" +
      "  3. supabase link --project-ref txmnlszmumayyrisqeby -p TU_PASSWORD",
  );
  process.exit(1);
}

const { pooled, direct } = buildDatabaseUrls(host, password);
const { anon, service } = fetchApiKeys();

const validationSecret =
  preserved.VALIDATION_TOKEN_SECRET?.trim() &&
  !preserved.VALIDATION_TOKEN_SECRET.includes("Fz5SzRdfB4")
    ? preserved.VALIDATION_TOKEN_SECRET.trim()
    : randomBytes(32).toString("base64url");

const lines = [
  "# Restaurado por scripts/restore-env-local-dev.mjs — DEV liga-iquitos-dev",
  "# No commitear. Prod → .env.production.local / Vercel",
  "",
  "APP_ENV=development",
  `SUPABASE_PROJECT_REF=${ref}`,
  "",
  `NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${quoteEnv(anon)}`,
  `SUPABASE_SERVICE_ROLE_KEY=${quoteEnv(service)}`,
  "",
  "NEXT_PUBLIC_SITE_URL=http://localhost:3001",
  "NEXT_PUBLIC_APP_URL=http://localhost:3001",
  "",
  "PLATFORM_NAME=Plataforma de ligas",
  "PLATFORM_DEFAULT_LEAGUE_SLUG=lddbi",
  "",
  `DATABASE_URL=${quoteEnv(pooled)}`,
  `DATABASE_URL_POOLED=${quoteEnv(pooled)}`,
  `DATABASE_URL_DIRECT=${quoteEnv(direct)}`,
  "DATABASE_POOL_MAX=10",
  "",
  "MASTER_SUPER_ADMIN_EMAIL=zxrios9@gmail.com",
  "SYSTEM_OWNER_EMAILS=zxrios9@gmail.com",
  "",
  `VALIDATION_TOKEN_SECRET=${quoteEnv(validationSecret)}`,
  "",
  "NEXT_PUBLIC_BUCKET_ASSETS=club-assets",
  "NEXT_PUBLIC_BUCKET_PLAYERS=jugador-fotos",
  "NEXT_PUBLIC_BUCKET_GALLERY=galeria",
  "NEXT_PUBLIC_BUCKET_RECEIPTS=recibos-tesoreria",
  "NEXT_PUBLIC_BUCKET_NORMATIVAS=normativas",
  "",
  "# Rate limit: desactivado en local (Upstash opcional abajo)",
  "SECURITY_RATE_LIMIT_DISABLED=true",
  "",
];

for (const key of kvKeys) {
  if (preserved[key]?.trim()) {
    lines.push(`${key}=${quoteEnv(preserved[key].trim())}`);
  }
}

if (existsSync(envPath)) {
  copyFileSync(envPath, join(root, ".env.local.before-restore"));
}

writeFileSync(envPath, `${lines.join("\n")}\n`, "utf8");
console.log("✓ .env.local restaurado (DEV)");
console.log("  Backup previo: .env.local.before-restore");
console.log(`  DATABASE: postgres.${ref} @ ${host}`);
console.log(
  `  VALIDATION_TOKEN_SECRET: ${validationSecret === preserved.VALIDATION_TOKEN_SECRET ? "conservado" : "nuevo (dev)"}`,
);
console.log("\nSiguiente: npm run env:verify && npm run db:verify:dev");
