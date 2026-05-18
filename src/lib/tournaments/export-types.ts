export type TournamentExportPayload = {
  tournamentName: string;
  leagueName: string;
  format: string;
  status: string;
  groups: { name: string; standings: { pos: number; team: string; pts: number }[] }[];
  rounds: { label: string; matches: { label: string; score: string }[] }[];
};
