import { permanentRedirect, redirect } from "next/navigation";
import { LeaguePortalHome } from "@/components/portal/LeaguePortalHome";
import { ProgramLeaguesDirectory } from "@/components/portal/ProgramLeaguesDirectory";
import {
  fetchDefaultPortalLeagueBranding,
  isDefaultPortalLeagueSlug,
} from "@/lib/portal/default-portal-league";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ l?: string }>;
}

/** `/` = portal público de la liga de Iquitos (LDDBI). Otras ligas en `/ligas/`. */
export default async function PublicPortalRootPage({ searchParams }: Props) {
  const { l: legacySlug } = await searchParams;

  if (legacySlug?.trim()) {
    const slug = legacySlug.trim();
    if (await isDefaultPortalLeagueSlug(slug)) {
      redirect("/");
    }
    permanentRedirect(`/l/${slug}/`);
  }

  const league = await fetchDefaultPortalLeagueBranding();
  if (!league) {
    return <ProgramLeaguesDirectory />;
  }

  return <LeaguePortalHome league={league} programHome />;
}
