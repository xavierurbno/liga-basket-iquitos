import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchPortalLeagueBySlug,
  fetchPortalLeagueBranding,
} from "@/lib/portal/portal-league-cache";
import { PublicInstitutionalGalleryView } from "@/components/gallery/PublicInstitutionalGalleryView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { leagueSlug } = await params;
  const league = await fetchPortalLeagueBySlug(leagueSlug);
  return {
    title: league ? `Galería institucional · ${league.name}` : "Galería institucional",
  };
}

export default async function LeagueInstitutionalGalleryPage({ params, searchParams }: PageProps) {
  const { leagueSlug } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));

  const league = await fetchPortalLeagueBranding(leagueSlug);
  if (!league) notFound();

  return <PublicInstitutionalGalleryView league={league} currentPage={currentPage} />;
}
