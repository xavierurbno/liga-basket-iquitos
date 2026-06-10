/**
 * Feature flags Fase 5b — activación gradual de DATABASE_URL_APP (rol liga_app).
 * Rollback: USE_APP_DB_ROLE=false y USE_APP_DB_ROLE_WRITES=false (vuelve owner vía env).
 */

export type DbOperationIntent = "read" | "write" | "owner";

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Lecturas operacionales con rol liga_app (staging / prod piloto). */
export function useAppDbForReads(): boolean {
  return envFlag("USE_APP_DB_ROLE");
}

/** Escrituras operacionales con rol liga_app (prod tras estabilizar lecturas). */
export function useAppDbForWrites(): boolean {
  return envFlag("USE_APP_DB_ROLE_WRITES");
}

export function shouldUseAppDb(intent: DbOperationIntent): boolean {
  if (intent === "owner") return false;
  if (intent === "write") return useAppDbForWrites();
  return useAppDbForReads();
}
