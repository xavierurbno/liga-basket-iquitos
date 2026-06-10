/**
 * Fase 2 — Pre-check y migración 0039 (slug compuesto league_id + slug).
 *
 * Uso DEV:
 *   node scripts/club-slug-0039.mjs precheck
 *   node scripts/club-slug-0039.mjs apply
 *
 * Uso PROD:
 *   CONFIRM_PROD_MIGRATE=yes node scripts/club-slug-0039.mjs precheck --production
 *   CONFIRM_PROD_MIGRATE=yes node scripts/club-slug-0039.mjs apply --production
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { assertSafeMigrationTarget } from "./assert-db-target.mjs";
import { connectPostgres, isBenignMigrationError } from "./connect-postgres.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const isProd = process.argv.includes("--production");
const cmd = process.argv[2] ?? "precheck";

function loadEnv() {
  if (isProd) {
    const prodEnvFile = [".env.production.local", ".env.local.backup-prod"]
      .map((f) => join(root, f))
      .find((p) => existsSync(p));
    if (!prodEnvFile) {
      console.error("Falta .env.production.local o .env.local.backup-prod");
      process.exit(1);
    }
    dotenv.config({ path: prodEnvFile, override: true });
    process.env.APP_ENV = "production";
    assertSafeMigrationTarget({ target: "production", forceProd: true });
  } else {
    dotenv.config({ path: join(root, ".env.local") });
    process.env.APP_ENV = "development";
    assertSafeMigrationTarget({ target: "development" });
  }
}

const PRECHECK_DUPLICATES = `
SELECT slug, league_id::text AS league_id, COUNT(*)::int AS count
FROM public.clubs
GROUP BY slug, league_id
HAVING COUNT(*) > 1;
`;

const PRECHECK_GLOBAL = `
SELECT slug, COUNT(*)::int AS count, array_agg(league_id::text) AS ligas
FROM public.clubs
GROUP BY slug
HAVING COUNT(*) > 1;
`;

const INDEX_STATE = `
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'clubs'
  AND indexname IN ('clubs_slug_idx', 'clubs_league_slug_idx')
ORDER BY indexname;
`;

async function runPrecheck(sql) {
  console.log("\n→ Pre-check: duplicados (slug, league_id) — debe ser 0 filas");
  const dupes = await sql.unsafe(PRECHECK_DUPLICATES);
  if (dupes.length === 0) {
    console.log("✓ Sin duplicados por liga");
  } else {
    console.error("✗ Duplicados detectados:");
    console.table(dupes);
    process.exitCode = 1;
    return false;
  }

  console.log("\n→ Pre-check informativo: mismo slug en ligas distintas (válido tras 0039)");
  const global = await sql.unsafe(PRECHECK_GLOBAL);
  if (global.length === 0) {
    console.log("○ Ningún slug repetido entre ligas");
  } else {
    console.table(global);
  }

  console.log("\n→ Estado índices clubs");
  const indexes = await sql.unsafe(INDEX_STATE);
  console.table(indexes);
  return true;
}

async function runApply(sql) {
  const ok = await runPrecheck(sql);
  if (!ok || process.exitCode === 1) {
    console.error("\n⛔ Abortando apply: corrige duplicados antes de migrar.");
    process.exit(1);
  }

  const body = readFileSync(
    join(root, "supabase/migrations/0039_clubs_league_slug_unique.sql"),
    "utf8",
  );
  console.log("\n→ Aplicando 0039_clubs_league_slug_unique.sql …");
  try {
    await sql.unsafe(body);
    console.log("✓ Migración 0039 aplicada");
  } catch (err) {
    if (isBenignMigrationError(err)) {
      console.log("○ Migración idempotente (índice ya aplicado)");
    } else {
      throw err;
    }
  }

  console.log("\n→ Verificación post-migración");
  const indexes = await sql.unsafe(INDEX_STATE);
  console.table(indexes);
  const hasNew = indexes.some((r) => r.indexname === "clubs_league_slug_idx");
  const hasOld = indexes.some((r) => r.indexname === "clubs_slug_idx");
  if (!hasNew) {
    console.error("✗ Falta clubs_league_slug_idx");
    process.exitCode = 1;
  } else if (hasOld) {
    console.warn("⚠ clubs_slug_idx aún presente (revisar manualmente)");
  } else {
    console.log("✓ clubs_league_slug_idx activo; clubs_slug_idx eliminado");
  }
}

async function main() {
  loadEnv();
  const sql = await connectPostgres();
  try {
    if (cmd === "precheck") {
      await runPrecheck(sql);
    } else if (cmd === "apply") {
      await runApply(sql);
    } else {
      console.error(`Comando desconocido: ${cmd}\nUsa: precheck | apply [--production]`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("\nError:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
