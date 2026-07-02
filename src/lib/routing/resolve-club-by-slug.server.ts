import type { Club } from "@/lib/db/schema";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { clubRepository } from "@/repositories/clubRepository";
import { leagueRepository } from "@/repositories/league.repository";

export type ResolveClubBySlugOptions = {
  leagueSlug?: string | null;
  leagueId?: string | null;
};

/**
 * Resuelve club por slug en rutas públicas/legacy.
 * Prioridad: leagueId explícito → leagueSlug → un solo match global.
 */
export async function resolveClubBySlugForPortal(
  clubSlug: string,
  opts?: ResolveClubBySlugOptions,
): Promise<Club | null> {
  const slug = clubSlug.trim();
  if (!slug) return null;

  const publicDb = unauthenticatedReadDb();
  const leagueId = opts?.leagueId?.trim() || null;
  if (leagueId) {
    return clubRepository.findBySlugAndLeague(slug, leagueId, publicDb);
  }

  const leagueSlug = opts?.leagueSlug?.trim() || null;
  if (leagueSlug) {
    const league = await leagueRepository.findBySlug(leagueSlug, publicDb);
    if (league) {
      return clubRepository.findBySlugAndLeague(slug, league.id, publicDb);
    }
    return null;
  }

  return clubRepository.findBySlugUnambiguous(slug, publicDb);
}
