import type { Role } from "@/lib/auth/withAuth";

export const ASSIGNABLE_PROFILE_ROLES = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"] as const;
export type AssignableProfileRole = (typeof ASSIGNABLE_PROFILE_ROLES)[number];

/** Impide que LEAGUE_ADMIN (u otros) escalen a SUPER_ADMIN. */
export function assertActorMayAssignRole(
  actorRole: Role,
  targetRole: AssignableProfileRole
): string | null {
  if (targetRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    return "Solo un super administrador puede asignar el rol SUPER_ADMIN.";
  }
  return null;
}
