import { and, eq, ilike, type SQL } from "drizzle-orm";
import { clubs } from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/withAuth";

/** Condiciones SQL para acotar búsqueda de clubes en gestión documental. */
export function buildDocumentClubSearchConditions(
  query: string,
  context: AuthContext,
): SQL | undefined {
  const q = query.trim();
  const nameMatch = ilike(clubs.name, `%${q}%`);

  if (context.role === "CLUB_DELEGATE") {
    const clubId = context.clubId?.trim();
    if (!clubId) return undefined;
    return and(eq(clubs.id, clubId), nameMatch);
  }

  if (context.role === "LEAGUE_ADMIN") {
    const leagueId = context.leagueId?.trim();
    if (!leagueId) return undefined;
    return and(eq(clubs.leagueId, leagueId), nameMatch);
  }

  if (context.role === "SUPER_ADMIN") {
    const leagueId = context.leagueId?.trim();
    if (leagueId) {
      return and(eq(clubs.leagueId, leagueId), nameMatch);
    }
  }

  return nameMatch;
}
