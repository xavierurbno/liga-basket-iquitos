import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ACTIVE_LEAGUE_SLUG_COOKIE } from "@/lib/portal/active-league-cookie";
import { resolveClubSlugRedirectPath } from "@/lib/routing/club-slug-redirect";
import { resolveClubBySlugForPortal } from "@/lib/routing/resolve-club-by-slug.server";

/** Redirige rutas legacy `/{slug}` y `/{slug}/...` hacia `/liga/clubs/...`. */
export async function redirectClubSlugLegacy(
  clubSlug: string,
  restSegments?: string[],
  queryLeagueSlug?: string | null,
): Promise<never> {
  const cookieStore = await cookies();
  const leagueSlug =
    queryLeagueSlug?.trim() ||
    cookieStore.get(ACTIVE_LEAGUE_SLUG_COOKIE)?.value?.trim() ||
    null;

  const club = await resolveClubBySlugForPortal(clubSlug, { leagueSlug });
  if (!club) notFound();
  redirect(resolveClubSlugRedirectPath(club.id, restSegments));
}
