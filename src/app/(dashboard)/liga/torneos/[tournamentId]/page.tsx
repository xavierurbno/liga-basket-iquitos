import { redirect } from "next/navigation";
import {
  parseTournamentHubVista,
  tournamentHubHref,
} from "@/lib/tournaments/tournament-hub-params";

/** Ruta legada: unifica en el hub `/liga/torneos/?torneo=…&vista=…`. */
export default async function TorneoDetalleLegacyRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ tournamentId: string }>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { tournamentId } = await params;
  const sp = await searchParams;
  const vista = parseTournamentHubVista(sp.vista);
  redirect(tournamentHubHref(tournamentId, vista));
}
