import type { Role } from "@/lib/auth/withAuth";
import type { UserRole } from "@/lib/db/schema";

export type PerfilesAssignmentLike = {
  role: UserRole;
  leagueId: string | null;
  clubId?: string | null;
  delegateClubLeagueId?: string | null;
};

/** Asignación sin liga/club válidos: no aparece al filtrar por liga pero bloquea nuevas altas. */
export function isOrphanStaffAssignment(row: PerfilesAssignmentLike): boolean {
  if (row.role === "LEAGUE_ADMIN" && !row.leagueId?.trim()) return true;
  if (row.role === "CLUB_DELEGATE") {
    if (!row.clubId) return true;
    if (!row.delegateClubLeagueId?.trim()) return true;
  }
  return false;
}

/** Filas visibles en `/liga/perfiles/` para la liga operativa activa. */
export function filterAssignmentsForOperationalLeague<T extends PerfilesAssignmentLike>(
  rows: T[],
  operationalLeagueId: string,
): T[] {
  const lid = operationalLeagueId.trim();
  return rows.filter((r) => {
    if (isOrphanStaffAssignment(r)) return false;
    if (r.role === "SUPER_ADMIN") return true;
    if (r.role === "LEAGUE_ADMIN") return r.leagueId === lid;
    if (r.role === "CLUB_DELEGATE") {
      return r.delegateClubLeagueId === lid;
    }
    return false;
  });
}

export function partitionPerfilesAssignments<T extends PerfilesAssignmentLike>(
  rows: T[],
  operationalLeagueId: string,
): { leagueRows: T[]; orphanRows: T[] } {
  const orphanRows = rows.filter(isOrphanStaffAssignment);
  const leagueRows = filterAssignmentsForOperationalLeague(rows, operationalLeagueId);
  return { leagueRows, orphanRows };
}

export type AssignableStaffRoleOption = "SUPER_ADMIN" | "LEAGUE_ADMIN" | "CLUB_DELEGATE";

/** Roles que el actor puede dar de alta en el contexto actual. */
export function assignableRolesForActor(
  actorRole: Role | undefined,
  hasLeagueContext: boolean,
): AssignableStaffRoleOption[] {
  if (actorRole === "SUPER_ADMIN") {
    if (hasLeagueContext) {
      return ["LEAGUE_ADMIN", "CLUB_DELEGATE"];
    }
    return ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"];
  }
  if (actorRole === "LEAGUE_ADMIN" && hasLeagueContext) {
    return ["CLUB_DELEGATE"];
  }
  return [];
}

export function canActorEditAssignmentRow(
  actorRole: Role | undefined,
  actorLeagueId: string | undefined,
  row: PerfilesAssignmentLike & { clubId?: string | null },
): boolean {
  if (!actorRole) return false;
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole !== "LEAGUE_ADMIN") return false;
  const lid = actorLeagueId?.trim();
  if (!lid) return false;
  if (row.role === "SUPER_ADMIN") return false;
  if (row.role === "LEAGUE_ADMIN" && !row.leagueId?.trim()) return false;
  if (row.role === "LEAGUE_ADMIN") return row.leagueId === lid;
  if (row.role === "CLUB_DELEGATE" && row.clubId) {
    return row.delegateClubLeagueId === lid;
  }
  return false;
}
