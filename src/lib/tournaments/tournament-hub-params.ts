export type TournamentHubVista =
  | "calendario"
  | "resultados"
  | "tabla"
  | "equipos"
  | "config";

const VISTAS: TournamentHubVista[] = [
  "calendario",
  "resultados",
  "tabla",
  "equipos",
  "config",
];

export function parseTournamentHubVista(raw: string | undefined): TournamentHubVista {
  if (raw && VISTAS.includes(raw as TournamentHubVista)) {
    return raw as TournamentHubVista;
  }
  return "calendario";
}

export function tournamentHubHref(
  tournamentId: string,
  vista: TournamentHubVista = "calendario",
): string {
  return `/liga/torneos/?torneo=${encodeURIComponent(tournamentId)}&vista=${vista}`;
}
