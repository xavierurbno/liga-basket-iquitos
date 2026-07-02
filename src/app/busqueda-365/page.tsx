import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { leagueRepository } from "@/repositories/league.repository";
import { PROGRAM_LEAGUES_DIRECTORY_PATH } from "@/lib/portal/default-portal-league";
import { leaguePortalBusqueda365 } from "@/lib/portal/league-portal-paths";

export const metadata: Metadata = {
  title: "Buscador 365",
  description:
    "Consulta de jugadores por liga. Serás redirigido al buscador de tu liga o al directorio de ligas del programa.",
};

/** Ruta legada: redirige al buscador de la liga por defecto o al directorio de ligas. */
export default async function Busqueda365LegacyRedirectPage() {
  const league = await leagueRepository.findDefaultForPortal(unauthenticatedReadDb());
  if (league?.slug) {
    redirect(leaguePortalBusqueda365(league.slug));
  }
  redirect(PROGRAM_LEAGUES_DIRECTORY_PATH);
}
