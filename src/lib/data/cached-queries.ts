import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { settingsRepository } from "@/repositories/settingsRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { categoryRepository } from "@/repositories/categoryRepository";
import type { ClubScopeOptions } from "@/lib/auth/data-scope";

// Nota: Desactivamos unstable_cache en desarrollo para evitar bloqueos intermitentes (hangs) de Next.js 16
export const getCachedLeagueSettings = async (leagueId?: string | null) => {
  const { resolveLeagueSettingsScopeId } = await import(
    "@/lib/leagues/resolve-league-settings-scope.server"
  );
  const scopedId = await resolveLeagueSettingsScopeId(leagueId);
  if (!scopedId) return null;
  return settingsRepository.getLeagueSettings(scopedId);
};

/** Clubes en caché lógica; con `options` aplica el mismo alcance que `clubRepository.findAllScoped`. */
export const getCachedClubs = async (options?: ClubScopeOptions & { leagueId?: string | null }) => {
  if (!options) {
    return await db.select().from(clubs);
  }
  return await clubRepository.findAllScoped(options, db);
};

export const getCachedCategories = async (clubId: string, options?: ClubScopeOptions) => {
  return await categoryRepository.findAllByClub(clubId, db, options);
};
