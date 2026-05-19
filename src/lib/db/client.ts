/**
 * ============================================================
 * CLIENTE DE BASE DE DATOS - SINGLETON PATTERN
 * ============================================================
 * Si cambias DATABASE_URL_* en .env.local, debemos **recrear** el cliente
 * postgres (ver `cachedConnectionString`).
 *
 * Resolución de URL: `src/lib/db/resolve-postgres-url.ts` (pooler antes que
 * directo por defecto, para evitar ENOTFOUND en `db.*.supabase.co`).
 * ============================================================
 */

import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolvePostgresConnectionString } from "./resolve-postgres-url";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  sql?: postgres.Sql;
  drizzleDb?: Db;
  /** URL efectiva usada para abrir `sql`; si cambia el env, se reinicia la conexión */
  cachedConnectionString?: string;
};

function safeConnectionLog(connectionString: string, source: string) {
  try {
    const u = new URL(connectionString.replace(/^postgresql:/, "http:"));
    const host = u.hostname;
    const port = u.port;
    console.info(`[db] ${source} → ${host}${port ? `:${port}` : ""}`);
  } catch {
    console.info(`[db] ${source} (URL no analizable)`);
  }
}

function poolMaxFor(connectionString: string): number {
  const raw = process.env.DATABASE_POOL_MAX?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  const fromEnv =
    Number.isFinite(parsed) && parsed >= 1 && parsed <= 20 ? parsed : null;

  if (process.env.NODE_ENV === "production" && connectionString.includes("supabase.co")) {
    return fromEnv ?? 2;
  }
  /** Dev: varias secciones RSC en paralelo; no aplicar `DATABASE_POOL_MAX=2` de producción. */
  if (process.env.NODE_ENV !== "production" && connectionString.includes("supabase.co")) {
    return Math.max(fromEnv ?? 10, 10);
  }
  return fromEnv ?? (connectionString.includes("supabase.co") ? 6 : 3);
}

function postgresOptions(connectionString: string): Parameters<typeof postgres>[1] {
  const esSupabaseHost =
    typeof connectionString === "string" && connectionString.includes("supabase.co");
  return {
    prepare: false,
    max: poolMaxFor(connectionString),
    connect_timeout: 25,
    /** Libera conexiones ociosas para no bloquear el pool en dev (varias pestañas / RSC). */
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    onnotice: () => {},
    connection: {
      statement_timeout: 10000,
    },
    ...(esSupabaseHost ? { ssl: "require" as const } : {}),
  };
}

function ensureDb(): Db {
  const { url: connectionString, label: source } = resolvePostgresConnectionString();
  if (!connectionString) {
    throw new Error(
      "Falta cadena de conexión: define DATABASE_URL, DATABASE_URL_POOLED y/o DATABASE_URL_DIRECT en .env.local",
    );
  }

  // Si ya existe una instancia con la misma URL, devolverla
  if (globalForDb.drizzleDb && globalForDb.cachedConnectionString === connectionString) {
    return globalForDb.drizzleDb;
  }

  // Cerrar conexión anterior si existe
  if (globalForDb.sql) {
    console.info("[db] Closing old connection...");
    void globalForDb.sql.end({ timeout: 2 });
  }

  const options = postgresOptions(connectionString);

  if (process.env.NODE_ENV !== "production") {
    safeConnectionLog(connectionString, source);
  }

  const sql = postgres(connectionString, options);

  globalForDb.sql = sql;
  globalForDb.cachedConnectionString = connectionString;
  globalForDb.drizzleDb = drizzle(sql, { schema });

  return globalForDb.drizzleDb;
}

/** Instancia Drizzle (Singleton) */
export const db = ensureDb();

// Re-exportamos el schema para conveniencia
export * from "./schema";
export { schema };
