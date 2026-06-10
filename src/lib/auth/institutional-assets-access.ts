import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { staffRequiresOperationalLeague } from "@/lib/auth/operational-league-scope";
import { assertOperationalLeagueMatch } from "@/lib/auth/assert-league-scope";
import type { AuthContext } from "@/lib/auth/withAuth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLeagueUuid(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return UUID_RE.test(value.trim());
}

/**
 * Comprueba que el usuario intranet puede cargar logos/firmas de la liga indicada.
 * `leagueId` null: solo logos globales (federación), cualquier rol intranet.
 */
export async function assertInstitutionalAssetsForLeague(
  context: AuthContext,
  leagueId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const targetLeagueId = leagueId?.trim() || null;

  if (!targetLeagueId) {
    return { ok: true };
  }

  if (!isLeagueUuid(targetLeagueId)) {
    return { ok: false, error: "ID de liga inválido." };
  }

  if (context.role === "CLUB_DELEGATE") {
    const clubId = context.clubId?.trim();
    if (!clubId) {
      return {
        ok: false,
        error: "Tu cuenta no tiene un club asignado para acceder a estos recursos.",
      };
    }
    const [club] = await db
      .select({ leagueId: clubs.leagueId })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);
    if (!club?.leagueId || club.leagueId !== targetLeagueId) {
      return {
        ok: false,
        error: "No puedes acceder a recursos institucionales de otra liga.",
      };
    }
    return { ok: true };
  }

  if (staffRequiresOperationalLeague(context.role)) {
    if (!context.leagueId?.trim()) {
      return {
        ok: false,
        error: "Selecciona una liga activa en el panel antes de cargar recursos institucionales.",
      };
    }
    const scopeErr = assertOperationalLeagueMatch(context, targetLeagueId);
    if (scopeErr) {
      return { ok: false, error: scopeErr };
    }
    return { ok: true };
  }

  return { ok: true };
}
