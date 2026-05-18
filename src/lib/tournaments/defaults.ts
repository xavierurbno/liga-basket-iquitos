import type { LeagueSettings, TournamentSettings } from "@/lib/db/schema";

export interface ResolvedTournamentRules {
  pointsWin: number;
  pointsLoss: number;
  pointsWalkover: number;
  pointsWoLoser: number;
  woScore: number;
}

export function resolveTournamentRules(
  leagueSettings: LeagueSettings | null | undefined,
  tournamentSettings: TournamentSettings | null | undefined
): ResolvedTournamentRules {
  return {
    pointsWin: tournamentSettings?.pointsWin ?? leagueSettings?.pointsWin ?? 2,
    pointsLoss: tournamentSettings?.pointsLoss ?? leagueSettings?.pointsLoss ?? 1,
    pointsWalkover:
      tournamentSettings?.pointsWalkover ?? leagueSettings?.pointsWalkover ?? 2,
    pointsWoLoser: 0,
    woScore: tournamentSettings?.woScore ?? 20,
  };
}

/** Solo persiste en JSONB lo que difiere de la liga. */
export function buildSettingsOverride(
  leagueSettings: LeagueSettings | null | undefined,
  input: {
    pointsWin?: number;
    pointsLoss?: number;
    pointsWalkover?: number;
    rulesNote?: string;
    numberOfGroups?: number;
    shuffleGroups?: boolean;
    teamsPerGroupToAdvance?: number;
    thirdPlaceMatch?: boolean;
    useQuarters?: boolean;
  }
): TournamentSettings | null {
  const base = resolveTournamentRules(leagueSettings, null);
  const settings: TournamentSettings = {};

  if (input.pointsWin !== undefined && input.pointsWin !== base.pointsWin) {
    settings.pointsWin = input.pointsWin;
  }
  if (input.pointsLoss !== undefined && input.pointsLoss !== base.pointsLoss) {
    settings.pointsLoss = input.pointsLoss;
  }
  if (
    input.pointsWalkover !== undefined &&
    input.pointsWalkover !== base.pointsWalkover
  ) {
    settings.pointsWalkover = input.pointsWalkover;
  }
  if (input.rulesNote?.trim()) {
    settings.rulesNote = input.rulesNote.trim();
  }
  if (input.numberOfGroups !== undefined && input.numberOfGroups > 0) {
    settings.numberOfGroups = input.numberOfGroups;
  }
  if (input.shuffleGroups === true) {
    settings.shuffleGroups = true;
  }
  if (input.teamsPerGroupToAdvance !== undefined && input.teamsPerGroupToAdvance > 0) {
    settings.teamsPerGroupToAdvance = input.teamsPerGroupToAdvance;
  }
  if (input.thirdPlaceMatch === true) {
    settings.thirdPlaceMatch = true;
  }
  if (input.useQuarters === true) {
    settings.useQuarters = true;
  }

  return Object.keys(settings).length > 0 ? settings : null;
}
