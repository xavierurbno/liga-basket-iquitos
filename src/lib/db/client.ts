/**
 * ============================================================
 * CLIENTE DE BASE DE DATOS - SINGLETON PATTERN
 * ============================================================
 * Política de capa: `docs/DATA_LAYER.md` — no importar desde `src/app/**`;
 * dominio vía `src/repositories/*`.
 *
 * Fase 5b — dual connection:
 * - `dbOwner`: owner/postgres (bypass RLS) — migraciones, seeds, bootstrap
 * - `dbApp`: rol liga_app (RLS efectivo) — runtime cuando USE_APP_DB_ROLE
 * - `db`: alias a dbOwner por compatibilidad (rollback = no activar flags)
 * - `getOperationalDb(intent)`: elige owner vs app según flags
 *
 * Ver `docs/security-phase5b-rls-app-role.md`.
 * ============================================================
 */

import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  resolvePostgresAppConnectionString,
  resolvePostgresOwnerConnectionString,
} from "./resolve-postgres-url";
import {
  shouldUseAppDb,
  type DbOperationIntent,
} from "./db-runtime-config";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

type DbSlot = "owner" | "app";

const globalForDb = globalThis as unknown as {
  sqlOwner?: postgres.Sql;
  drizzleOwner?: Db;
  cachedOwnerUrl?: string;
  sqlApp?: postgres.Sql;
  drizzleApp?: Db;
  cachedAppUrl?: string;
};

function safeConnectionLog(connectionString: string, source: string) {
  try {
    const u = new URL(connectionString.replace(/^postgresql:/, "http:"));
    const host = u.hostname;
    const port = u.port;
    console.info(`[db:${source}] → ${host}${port ? `:${port}` : ""}`);
  } catch {
    console.info(`[db:${source}] (URL no analizable)`);
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
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    onnotice: () => {},
    connection: {
      statement_timeout: process.env.NODE_ENV === "production" ? 10_000 : 25_000,
    },
    ...(esSupabaseHost ? { ssl: "require" as const } : {}),
  };
}

function ensureDbSlot(slot: DbSlot): Db {
  const resolved =
    slot === "owner"
      ? resolvePostgresOwnerConnectionString()
      : resolvePostgresAppConnectionString();

  const connectionString = resolved.url;
  if (!connectionString) {
    if (slot === "owner") {
      throw new Error(
        "Falta cadena owner: define DATABASE_URL, DATABASE_URL_POOLED y/o DATABASE_URL_DIRECT en .env.local",
      );
    }
    throw new Error(
      "Falta DATABASE_URL_APP (rol liga_app). Ejecuta scripts/provision-liga-app-role.mjs y añade la URI a .env.local.",
    );
  }

  const cacheKey = slot === "owner" ? "cachedOwnerUrl" : "cachedAppUrl";
  const drizzleKey = slot === "owner" ? "drizzleOwner" : "drizzleApp";
  const sqlKey = slot === "owner" ? "sqlOwner" : "sqlApp";

  if (globalForDb[drizzleKey] && globalForDb[cacheKey] === connectionString) {
    return globalForDb[drizzleKey]!;
  }

  const prevSql = globalForDb[sqlKey];
  if (prevSql) {
    console.info(`[db] Closing old ${slot} connection...`);
    void prevSql.end({ timeout: 2 });
  }

  if (process.env.NODE_ENV !== "production") {
    safeConnectionLog(connectionString, resolved.label);
  }

  const sql = postgres(connectionString, postgresOptions(connectionString));
  globalForDb[sqlKey] = sql;
  globalForDb[cacheKey] = connectionString;
  globalForDb[drizzleKey] = drizzle(sql, { schema });

  return globalForDb[drizzleKey]!;
}

/** Owner/postgres — bypass RLS. Migraciones y scripts CI. */
export const dbOwner = ensureDbSlot("owner");

/**
 * Rol liga_app — RLS efectivo. Lazy: solo conecta si se importa/usa explícitamente
 * o vía getOperationalDb cuando USE_APP_DB_ROLE está activo.
 */
export const dbApp = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = ensureDbSlot("app");
    return Reflect.get(instance, prop, receiver);
  },
});

/**
 * Compatibilidad: sigue siendo owner hasta activar USE_APP_DB_ROLE en callers
 * que migren a getOperationalDb().
 */
export const db = dbOwner;

/** Selección runtime owner vs app (Fase 5b.4 activación gradual). */
export function getOperationalDb(intent: DbOperationIntent = "write"): Db {
  if (shouldUseAppDb(intent)) {
    return dbApp;
  }
  return dbOwner;
}

export * from "./schema";
export { schema };
