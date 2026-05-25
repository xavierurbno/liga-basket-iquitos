import type { Metadata } from "next";
import { LeaguePortalHome } from "@/components/portal/LeaguePortalHome";
import { redirect, notFound } from "next/navigation";
import {
  fetchPortalLeagueBySlug,
  fetchPortalLeagueBranding,
} from "@/lib/portal/portal-league-cache";
import { isDefaultPortalLeagueSlug } from "@/lib/portal/default-portal-league";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ leagueSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { leagueSlug } = await params;
  const league = await fetchPortalLeagueBySlug(leagueSlug);
  if (!league) {
    return { title: "Liga no encontrada" };
  }
  return {
    title: league.name,
    description: `Portal oficial de ${league.name}`,
  };
}

export default async function LeaguePortalPage({ params }: PageProps) {
  const { leagueSlug } = await params;
  if (await isDefaultPortalLeagueSlug(leagueSlug)) {
    redirect("/");
  }
  const league = await fetchPortalLeagueBranding(leagueSlug);
  if (!league) notFound();

  return <LeaguePortalHome league={league} />;
}
