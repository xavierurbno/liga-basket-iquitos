import type { Role } from "@/lib/auth/withAuth";

export type ClubScopeOptions = {
  bypassClubFilter?: boolean;
  /** Rol del actor (p. ej. desde AuthContext); obligatorio para interpretar bypass. */
  actingRole?: Role | string;
};

/**
 * Regla LDDBI: solo SUPER_ADMIN puede omitir filtro por club cuando se solicita explícitamente.
 */
export function effectiveBypassClubFilter(options?: ClubScopeOptions): boolean {
  return (
    options?.bypassClubFilter === true &&
    options?.actingRole === "SUPER_ADMIN"
  );
}
