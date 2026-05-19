import { clubRepository } from "@/repositories/clubRepository";
import { resolveDefaultPortalLeagueId } from "@/lib/portal/portal-league-cache";

/**
 * Liga a asociar a una foto de galería (portal, carrusel y contadores).
 * - Con club: league_id del club.
 * - Institucional: liga operativa del admin o liga por defecto del portal.
 */
export async function resolveLeagueIdForGalleryUpload(opts: {
  clubId: string | null;
  operationalLeagueId?: string | null;
}): Promise<string> {
  if (opts.clubId) {
    const club = await clubRepository.findById(opts.clubId);
    if (!club) {
      throw new Error("Club no encontrado.");
    }
    if (!club.leagueId) {
      throw new Error("El club no tiene una liga asignada.");
    }
    return club.leagueId;
  }

  const fromContext = opts.operationalLeagueId?.trim();
  if (fromContext) return fromContext;

  const defaultId = await resolveDefaultPortalLeagueId();
  if (defaultId) return defaultId;

  throw new Error(
    "No hay liga activa. Selecciona una liga en el panel o configura NEXT_PUBLIC_DEFAULT_LEAGUE_ID.",
  );
}
