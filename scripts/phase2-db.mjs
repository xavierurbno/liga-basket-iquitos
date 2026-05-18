/**
 * Fase 2 — Torneos + RLS operativo (Supabase remoto vía DATABASE_URL).
 *
 * Uso:
 *   node scripts/phase2-db.mjs verify
 *   node scripts/phase2-db.mjs apply-tournaments
 *   node scripts/phase2-db.mjs apply-rls
 *   node scripts/phase2-db.mjs apply-all
 *
 * Requiere DATABASE_URL en .env.local (rol con permisos DDL).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

dotenv.config({ path: join(root, ".env.local") });

const cmd = process.argv[2] ?? "verify";

function withPgbouncerParam(connectionString) {
  if (
    !connectionString.includes("pooler.supabase.com") ||
    connectionString.includes("pgbouncer=")
  ) {
    return connectionString;
  }
  return connectionString.includes("?")
    ? `${connectionString}&pgbouncer=true`
    : `${connectionString}?pgbouncer=true`;
}

/** Orden: pooler (suele resolver en local) → direct → DATABASE_URL explícita. */
function connectionCandidates() {
  const seen = new Set();
  const list = [];
  for (const raw of [
    process.env.DATABASE_URL_POOLED,
    process.env.DATABASE_URL_DIRECT,
    process.env.DATABASE_URL,
  ]) {
    const trimmed = raw?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    list.push(withPgbouncerParam(trimmed));
  }
  if (list.length === 0) {
    throw new Error(
      "Define DATABASE_URL, DATABASE_URL_POOLED o DATABASE_URL_DIRECT en .env.local.",
    );
  }
  return list;
}

async function connectWithFallback() {
  const candidates = connectionCandidates();
  let lastErr;
  for (const connectionString of candidates) {
    const sql = postgres(connectionString, {
      prepare: false,
      max: 1,
      connect_timeout: 20,
      ssl: connectionString.includes("supabase.co") ? "require" : undefined,
    });
    try {
      await sql`SELECT 1 AS ok`;
      const host = (() => {
        try {
          return new URL(connectionString.replace(/^postgresql:/, "http:")).hostname;
        } catch {
          return "(url)";
        }
      })();
      console.log(`Conectado vía ${host}`);
      return sql;
    } catch (err) {
      lastErr = err;
      await sql.end({ timeout: 2 }).catch(() => {});
    }
  }
  throw lastErr ?? new Error("No se pudo conectar a Postgres.");
}

function readSql(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

async function runVerify(sql) {
  const rows = await sql.unsafe(readSql("supabase/VERIFY_PHASE2.sql"));
  const failed = rows.filter((r) => !r.ok);
  for (const row of rows) {
    const mark = row.ok ? "✓" : "✗";
    console.log(`${mark} ${row.check_id}: ${row.status}`);
  }
  if (failed.length > 0) {
    console.error(`\n${failed.length} comprobación(es) pendiente(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nFase 2: base de datos al día.");
  }
}

async function runSqlFile(sql, label, relativePath) {
  const body = readSql(relativePath);
  console.log(`\n→ Aplicando ${label} (${relativePath})…`);
  await sql.unsafe(body);
  console.log(`✓ ${label} aplicado.`);
}

async function main() {
  const sql = await connectWithFallback();

  try {
    if (cmd === "verify") {
      await runVerify(sql);
      return;
    }

    if (cmd === "apply-tournaments") {
      await runSqlFile(
        sql,
        "Módulo torneos (completo)",
        "supabase/APPLY_TOURNAMENTOS_COMPLETO.sql",
      );
      await runVerify(sql);
      return;
    }

    if (cmd === "apply-rls") {
      await runSqlFile(
        sql,
        "RLS operativo liga",
        "supabase/migrations/0017_rls_operational_league.sql",
      );
      await runVerify(sql);
      return;
    }

    if (cmd === "apply-all") {
      await runSqlFile(
        sql,
        "Módulo torneos (completo)",
        "supabase/APPLY_TOURNAMENTOS_COMPLETO.sql",
      );
      await runSqlFile(
        sql,
        "RLS operativo liga",
        "supabase/migrations/0017_rls_operational_league.sql",
      );
      await runVerify(sql);
      return;
    }

    console.error(
      `Comando desconocido: ${cmd}\nUsa: verify | apply-tournaments | apply-rls | apply-all`,
    );
    process.exitCode = 1;
  } catch (err) {
    console.error("\nError Fase 2:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
