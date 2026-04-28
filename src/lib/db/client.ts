/**
 * ============================================================
 * CLIENTE DE BASE DE DATOS - SINGLETON PATTERN
 * ============================================================
 * Usamos el patrón Singleton para que en desarrollo (con hot-reload)
 * no se creen múltiples conexiones a la BD en cada re-render.
 *
 * En producción (Next.js en Vercel/Antigravity), cada serverless
 * function tiene su propia instancia, así que este patrón
 * previene conexiones duplicadas durante el desarrollo local.
 * ============================================================
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Variable global para el singleton en desarrollo
// (evita "too many connections" con hot-reload de Next.js)
const globalForDb = globalThis as unknown as {
  connection: postgres.Sql | undefined;
};

/**
 * CONNECTION STRING de Supabase.
 * Supabase provee DOS URLs:
 * - DATABASE_URL (puerto 5432): Para conexiones persistentes (no usar en serverless)
 * - DATABASE_URL_POOLED (puerto 6543): PgBouncer pooling (USAR en serverless/edge)
 *
 * En Antigravity/Vercel usamos la URL de pooling.
 */
const connectionString =
  process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!;

const connection =
  globalForDb.connection ??
  postgres(connectionString, {
    // prepare: false es REQUERIDO con PgBouncer (Supabase pooler)
    // PgBouncer no soporta prepared statements en modo transaction pooling
    prepare: false,
    max: 1, // Una conexión por función serverless es suficiente
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.connection = connection;
}

export const db = drizzle(connection, { schema });

// Re-exportamos el schema para conveniencia
export * from "./schema";
