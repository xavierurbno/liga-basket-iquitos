import { permanentRedirect } from "next/navigation";
import { leaguePortalTournament } from "@/lib/portal/league-portal-paths";

export const dynamic = "force-dynamic";

/** Ruta legada → `/l/[slug]/torneos/[tournamentSlug]/`. */
export default async function LegacyPublicTournamentRedirect({
  params,
}: {
  params: Promise<{ leagueSlug: string; tournamentSlug: string }>;
}) {
  const { leagueSlug, tournamentSlug } = await params;
  permanentRedirect(leaguePortalTournament(leagueSlug, tournamentSlug));
}
