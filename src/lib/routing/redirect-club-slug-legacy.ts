import { notFound, redirect } from "next/navigation";
import { clubRepository } from "@/repositories/clubRepository";
import { resolveClubSlugRedirectPath } from "@/lib/routing/club-slug-redirect";

/** Redirige rutas legacy `/{slug}` y `/{slug}/...` hacia `/liga/clubs/...`. */
export async function redirectClubSlugLegacy(
  clubSlug: string,
  restSegments?: string[],
): Promise<never> {
  const club = await clubRepository.findBySlug(clubSlug);
  if (!club) notFound();
  redirect(resolveClubSlugRedirectPath(club.id, restSegments));
}
