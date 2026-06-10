import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { User } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/withAuth";
import { dbApp } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import {
  buildSupabaseJwtClaimsPayload,
  serializeJwtClaimsForPostgres,
} from "@/lib/db/jwt-claims-for-rls";

type Db = PostgresJsDatabase<typeof schema>;
type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Ejecuta callback en transacción con JWT claims para que RLS (auth.jwt()) aplique.
 * Usar con `dbApp` / `getOperationalDb('read'|'write')` cuando USE_APP_DB_ROLE esté activo.
 */
export async function withRlsTransaction<T>(
  user: User,
  context: AuthContext,
  fn: (tx: Tx) => Promise<T>,
  cookieStore?: { get(name: string): { value: string } | undefined },
): Promise<T> {
  const claimsJson = serializeJwtClaimsForPostgres(
    buildSupabaseJwtClaimsPayload(user, context, cookieStore),
  );

  return dbApp.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${claimsJson}, true)`,
    );
    return fn(tx);
  });
}

/** Variante cuando ya tienes la instancia Drizzle (p. ej. tx de repositorio). */
export async function applyJwtClaimsToTransaction(
  tx: Tx | Db,
  user: User,
  context: AuthContext,
  cookieStore?: { get(name: string): { value: string } | undefined },
): Promise<void> {
  const claimsJson = serializeJwtClaimsForPostgres(
    buildSupabaseJwtClaimsPayload(user, context, cookieStore),
  );
  await tx.execute(sql`select set_config('request.jwt.claims', ${claimsJson}, true)`);
}
