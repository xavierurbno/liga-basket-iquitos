export const TOURNAMENT_FORMAT_LABEL: Record<string, string> = {
  linear: "Todos contra todos",
  home_and_away: "Ida y vuelta",
  groups: "Fase de grupos",
  groups_playoffs: "Grupos + play-offs",
};

export function tournamentFormatLabel(format: string): string {
  return TOURNAMENT_FORMAT_LABEL[format] ?? format;
}
