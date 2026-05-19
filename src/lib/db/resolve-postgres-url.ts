/**
 * Orden de conexión Supabase / Postgres:
 * - `DATABASE_URL` gana si existe (una sola URI desde el panel).
 * - Por defecto **pooler antes que directo**: el host `db.[ref].supabase.co` a veces devuelve
 *   `getaddrinfo ENOTFOUND` en redes/DNS locales; `*.pooler.supabase.com` suele resolverse.
 * - `DATABASE_USE_DIRECT_FIRST=true` invierte el orden (directo primero).
 */

export type DbConnectionLabel = "DATABASE_URL" | "DIRECT" | "POOLED" | "NONE";

/** Supabase recomienda `pgbouncer=true` en URIs del pooler transaccional (6543). */
export function withPgbouncerParam(connectionString: string): string {
  if (!connectionString.includes("pooler.supabase.com") || connectionString.includes("pgbouncer=")) {
    return connectionString;
  }
  return connectionString.includes("?")
    ? `${connectionString}&pgbouncer=true`
    : `${connectionString}?pgbouncer=true`;
}

function isSupabaseDirectDbHost(connectionString: string): boolean {
  return /db\.[a-z0-9-]+\.supabase\.co/i.test(connectionString) && !connectionString.includes("pooler");
}

/** En Vercel/serverless el host `db.*.supabase.co` suele fallar o saturar; priorizar pooler si existe. */
function shouldPreferPoolerOverExplicit(explicit: string, pooled: string | undefined): boolean {
  if (!pooled?.trim()) return false;
  if (!isSupabaseDirectDbHost(explicit)) return false;
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function resolvePostgresConnectionString(): {
  url: string;
  label: DbConnectionLabel;
} {
  const explicit = process.env.DATABASE_URL?.trim();
  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  const direct = process.env.DATABASE_URL_DIRECT?.trim();

  if (explicit && shouldPreferPoolerOverExplicit(explicit, pooled)) {
    return { url: withPgbouncerParam(pooled!), label: "POOLED" };
  }

  if (explicit) {
    return { url: withPgbouncerParam(explicit), label: "DATABASE_URL" };
  }
  const preferDirect =
    process.env.DATABASE_USE_DIRECT_FIRST === "true" ||
    process.env.DATABASE_USE_DIRECT_FIRST === "1";

  if (preferDirect) {
    if (direct) return { url: withPgbouncerParam(direct), label: "DIRECT" };
    if (pooled) return { url: withPgbouncerParam(pooled), label: "POOLED" };
  } else {
    if (pooled) return { url: withPgbouncerParam(pooled), label: "POOLED" };
    if (direct) return { url: withPgbouncerParam(direct), label: "DIRECT" };
  }

  return { url: "", label: "NONE" };
}
