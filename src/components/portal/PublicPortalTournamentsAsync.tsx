import { PublicTournamentsSection } from "@/components/portal/PublicTournamentsSection";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { listPublicTournamentsByLeague } from "@/lib/tournaments/queries";

const TOURNAMENTS_MS = 12_000;

export async function PublicPortalTournamentsAsync({ leagueId }: { leagueId: string }) {
  let tournaments: Awaited<ReturnType<typeof listPublicTournamentsByLeague>> = [];
  try {
    tournaments = await withQueryTimeout(
      listPublicTournamentsByLeague(leagueId),
      TOURNAMENTS_MS,
      "portalTournaments"
    );
  } catch (err) {
    console.warn("[portal] campeonatos no disponibles:", err);
  }

  return <PublicTournamentsSection tournaments={tournaments} />;
}
