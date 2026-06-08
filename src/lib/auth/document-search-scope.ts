import { and, eq, ilike, type SQL } from "drizzle-orm";
import { clubs, players } from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/withAuth";

export type DocumentSearchScope =
  | { kind: "league"; leagueId: string }
  | { kind: "global" };

const LEAGUE_REQUIRED_MSG =
  "Selecciona una liga activa en el panel antes de buscar en gestión documental.";

/** Alcance de búsqueda documental según rol (alineado con clubes). */
export function resolveDocumentSearchScope(
  context: AuthContext,
): DocumentSearchScope | { error: string } {
  if (context.role === "LEAGUE_ADMIN") {
    const leagueId = context.leagueId?.trim();
    if (!leagueId) return { error: LEAGUE_REQUIRED_MSG };
    return { kind: "league", leagueId };
  }

  if (context.role === "SUPER_ADMIN") {
    const leagueId = context.leagueId?.trim();
    if (leagueId) return { kind: "league", leagueId };
    return { kind: "global" };
  }

  if (context.role === "CLUB_DELEGATE") {
    const leagueId = context.leagueId?.trim();
    if (!leagueId) return { error: LEAGUE_REQUIRED_MSG };
    return { kind: "league", leagueId };
  }

  return { error: "No tienes permisos para buscar en gestión documental." };
}

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

  const scope = resolveDocumentSearchScope(context);
  if ("error" in scope) return undefined;
  if (scope.kind === "league") {
    return and(eq(clubs.leagueId, scope.leagueId), nameMatch);
  }

  return nameMatch;
}

/** Condiciones SQL para búsqueda de jugador por documento (gestión documental). */
export function buildDocumentPlayerSearchConditions(
  documentType: string,
  documentNumber: string,
  context: AuthContext,
): SQL | { error: string } {
  const docNumFmt = documentNumber.trim();
  const identityMatch = and(
    eq(players.documentType, documentType as never),
    eq(players.documentNumber, docNumFmt),
  );

  const scope = resolveDocumentSearchScope(context);
  if ("error" in scope) return scope;

  if (scope.kind === "league") {
    return and(identityMatch, eq(clubs.leagueId, scope.leagueId))!;
  }

  return identityMatch!;
}
