import { redirect } from "next/navigation";
import { loadClubForGalleryRedirect } from "@/lib/loaders/club-page.loader";
import { resolveDefaultPortalLeagueId } from "@/lib/portal/portal-league-cache";
import { leaguePortalClubGallery } from "@/lib/portal/league-portal-paths";
import { leagueRepository } from "@/repositories/league.repository";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ page?: string }>;
}

/** Ruta legada → `/l/[slug]/galeria/club/[id]/`. */
export default async function LegacyClubGalleryRedirect({ params, searchParams }: PageProps) {
  const { clubId } = await params;
  const { page: pageStr } = await searchParams;

  const club = await loadClubForGalleryRedirect(clubId);
  if (!club) {
    redirect("/");
  }

  let slug: string | null = null;
  if (club.leagueId) {
    const league = await leagueRepository.findById(club.leagueId);
    slug = league?.slug ?? null;
  }
  if (!slug) {
    const defaultId = await resolveDefaultPortalLeagueId();
    if (defaultId) {
      const league = await leagueRepository.findById(defaultId);
      slug = league?.slug ?? null;
    }
  }

  if (!slug) {
    redirect("/");
  }

  const base = leaguePortalClubGallery(slug, clubId);
  const page = Math.max(1, parseInt(pageStr || "1", 10));
  redirect(page > 1 ? `${base}?page=${page}` : base);
}
