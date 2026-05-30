import { redirect } from "next/navigation";
import { leagueRepository } from "@/repositories/league.repository";
import { PROGRAM_LEAGUES_DIRECTORY_PATH } from "@/lib/portal/default-portal-league";
import { leaguePortalBusqueda365 } from "@/lib/portal/league-portal-paths";

/** Ruta legada: redirige al buscador de la liga por defecto o al directorio de ligas. */
export default async function Busqueda365LegacyRedirectPage() {
  const league = await leagueRepository.findDefaultForPortal();
  if (league?.slug) {
    redirect(leaguePortalBusqueda365(league.slug));
  }
  redirect(PROGRAM_LEAGUES_DIRECTORY_PATH);
}
