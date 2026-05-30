/** Resuelve URI Postgres para Drizzle / scripts (DDL prefiere directo 5432). */

export function withPgbouncerParam(connectionString) {
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

export function resolveDrizzleUrl() {
  const direct = process.env.DATABASE_URL_DIRECT?.trim();
  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  const fallback = process.env.DATABASE_URL?.trim();
  const url = direct || pooled || fallback || "";
  return url ? withPgbouncerParam(url) : "";
}

export function resolveAppDatabaseUrl() {
  const explicit = process.env.DATABASE_URL?.trim();
  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  const direct = process.env.DATABASE_URL_DIRECT?.trim();
  const url = explicit || pooled || direct || "";
  return url ? withPgbouncerParam(url) : "";
}
