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
    msg.includes("duplicate_column") ||
    msg.includes("does not exist") ||
    msg.includes("depends on it") ||
    msg.includes("cannot drop type") ||
    msg.includes("multiple primary keys") ||
    msg.includes("already a member of extension")
  );
}

export function splitMigrationStatements(body) {
  if (!body.includes("--> statement-breakpoint")) {
    return [body.trim()].filter(Boolean);
  }
  return body
    .split(/--> statement-breakpoint/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Supabase ya tiene schema auth; no crear stub local. */
export function shouldSkipAuthStubStatement(statement) {
  const s = statement.trim().toLowerCase();
  if (/^create schema "auth"/.test(s) || /^create schema auth/.test(s)) return true;
  if (s.includes('create table "auth"."users"') || s.includes("create table auth.users")) {
    return true;
  }
  return false;
}
