import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { User } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/withAuth";
import { getOperationalDb } from "@/lib/db/client";
import { useAppDbForReads, useAppDbForWrites } from "@/lib/db/db-runtime-config";
import { withRlsTransaction } from "@/lib/db/with-rls-transaction";
import type * as schema from "@/lib/db/schema";

export type OperationalTx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type OperationalDb = PostgresJsDatabase<typeof schema>;

/** Lecturas autenticadas (respeta USE_APP_DB_ROLE). */
export function operationalReadDb(): OperationalDb {
  return getOperationalDb("read") as OperationalDb;
}

/** Escrituras autenticadas (respeta USE_APP_DB_ROLE_WRITES). */
export function operationalWriteDb(): OperationalDb {
  return getOperationalDb("write") as OperationalDb;
}

/**
 * Lecturas sin sesión (Busqueda365, /validar, settings públicos).
 * Siempre owner: liga_app sin JWT devuelve 0 filas (RLS).
 */
export function unauthenticatedReadDb(): OperationalDb {
  return getOperationalDb("owner") as OperationalDb;
}

/**
 * Ejecuta lecturas con JWT claims cuando USE_APP_DB_ROLE=true.
 * Rollback: flag false → owner sin transacción RLS.
 */
export async function withOperationalRead<T>(
  user: User,
  context: AuthContext,
  fn: (tx: OperationalTx) => Promise<T>,
): Promise<T> {
  if (useAppDbForReads()) {
    return withRlsTransaction(user, context, fn);
  }
  return fn(operationalReadDb() as unknown as OperationalTx);
}

/**
 * Ejecuta escrituras con JWT claims cuando USE_APP_DB_ROLE_WRITES=true.
 * Rollback: flag false → owner sin transacción RLS.
 */
export async function withOperationalWrite<T>(
  user: User,
  context: AuthContext,
  fn: (tx: OperationalTx) => Promise<T>,
): Promise<T> {
  if (useAppDbForWrites()) {
    return withRlsTransaction(user, context, fn);
  }
  return fn(operationalWriteDb() as unknown as OperationalTx);
}
