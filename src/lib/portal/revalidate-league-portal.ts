import { revalidatePath } from "next/cache";
import { leagueRepository } from "@/repositories/league.repository";
import {
  leaguePortalClubGallery,
  leaguePortalHome,
  leaguePortalInstitutionalGallery,
  leaguePortalNormativas,
} from "@/lib/portal/league-portal-paths";

export function revalidateLeaguePortalBySlug(slug: string, clubId?: string) {
  revalidatePath(leaguePortalHome(slug));
  revalidatePath(leaguePortalInstitutionalGallery(slug));
  revalidatePath(leaguePortalNormativas(slug));
  if (clubId) {
    revalidatePath(leaguePortalClubGallery(slug, clubId));
  }
  revalidatePath("/galeria-institucional");
  revalidatePath("/", "page");
}

export async function revalidateLeaguePortalByLeagueId(
  leagueId: string | null | undefined,
  clubId?: string,
) {
  if (!leagueId) return;
  const league = await leagueRepository.findById(leagueId);
  if (league?.slug) {
    revalidateLeaguePortalBySlug(league.slug, clubId);
  }
}
