import { permanentRedirect, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { resolvePortalLeagueContext } from "@/lib/portal/portal-league-context";
import { leaguePortalInstitutionalGallery } from "@/lib/portal/league-portal-paths";
import { ACTIVE_LEAGUE_SLUG_COOKIE } from "@/lib/portal/active-league-cookie";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; l?: string }>;
}

/** Ruta legada → `/l/[slug]/galeria-institucional/`. */
export default async function LegacyInstitutionalGalleryRedirect({ searchParams }: PageProps) {
  const { page: pageStr, l: slug } = await searchParams;
  const cookieStore = await cookies();
  const league = await resolvePortalLeagueContext({
    querySlug: slug,
    cookieSlug: cookieStore.get(ACTIVE_LEAGUE_SLUG_COOKIE)?.value,
  });

  if (!league) {
    redirect("/");
  }

  const base = leaguePortalInstitutionalGallery(league.slug);
  const page = Math.max(1, parseInt(pageStr || "1", 10));
  permanentRedirect(page > 1 ? `${base}?page=${page}` : base);
}
