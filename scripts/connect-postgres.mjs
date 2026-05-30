import postgres from "postgres";
import { resolveDrizzleUrl } from "./resolve-db-url.mjs";

export async function connectPostgres() {
  const candidates = [];
  const seen = new Set();
  for (const raw of [
    process.env.DATABASE_URL_DIRECT,
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_POOLED,
  ]) {
    const trimmed = raw?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    candidates.push(trimmed);
  }

  const fromResolver = resolveDrizzleUrl();
  if (fromResolver && !seen.has(fromResolver)) {
    candidates.unshift(fromResolver);
  }

  if (candidates.length === 0) {
    throw new Error(
      "Define DATABASE_URL_DIRECT o DATABASE_URL en .env.local.",
    );
  }

  let lastErr;
  for (const connectionString of candidates) {
    const sql = postgres(connectionString, {
      prepare: false,
      max: 1,
      connect_timeout: 25,
      ssl: connectionString.includes("supabase.co") ? "require" : undefined,
    });
    try {
      await sql`SELECT 1 AS ok`;
      const host = (() => {
        try {
          return new URL(connectionString.replace(/^postgresql:/, "http:")).hostname;
        } catch {
          return "(postgres)";
        }
      })();
      console.log(`Conectado: ${host}`);
      return sql;
    } catch (err) {
      lastErr = err;
      await sql.end({ timeout: 2 }).catch(() => {});
    }
  }

  throw lastErr ?? new Error("No se pudo conectar a Postgres.");
}

/** Errores benignos en migraciones idempotentes. */
export function isBenignMigrationError(err) {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  return (
    msg.includes("already exists") ||
    msg.includes("duplicate") ||
    msg.includes("duplicate_object") ||
    msg.includes("duplicate_table") ||
    msg.includes("duplicate_column")
  );
}
