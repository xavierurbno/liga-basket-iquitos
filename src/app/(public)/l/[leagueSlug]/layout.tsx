import { notFound } from "next/navigation";
import { fetchPortalLeagueBySlug } from "@/lib/portal/portal-league-cache";

export default async function LeaguePortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await fetchPortalLeagueBySlug(leagueSlug);

  if (!league) {
    notFound();
  }

  return children;
}
