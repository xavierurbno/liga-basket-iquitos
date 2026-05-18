import { redirect } from "next/navigation";
import { TournamentWizard } from "@/components/tournaments/TournamentWizard";
import { canManageTournaments } from "@/lib/auth/resolve-league-id";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { listCategoriesForTournamentPicker } from "@/lib/tournaments/queries";

export default async function NuevoTorneoPage() {
  const ctx = await getLigaOperationalContext();
  if (!canManageTournaments(ctx.role)) redirect("/liga/torneos/");
  if (ctx.needsLeagueSelection) redirect("/liga/torneos/");

  const teams = await listCategoriesForTournamentPicker(ctx.leagueId!);

  return <TournamentWizard teams={teams} />;
}
