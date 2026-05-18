/**
 * Generador de fixtures — Round Robin (Berger). Fase A: linear / home_and_away.
 */

export type TeamId = string;

export const BYE = "__BYE__" as const;
export type BYEType = typeof BYE;

export interface FixtureMatch {
  round: number;
  matchNumber: number;
  homeTeamId: TeamId | null;
  awayTeamId: TeamId | null;
  isReturn: boolean;
}

export interface FixtureRound {
  round: number;
  label: string;
  matches: FixtureMatch[];
}

export type FixtureFormat = "linear" | "home_and_away";

export interface GenerateFixtureOptions {
  teamIds: TeamId[];
  format: FixtureFormat;
  invertHomeAwayOnReturn?: boolean;
  shuffle?: boolean;
}

export interface GenerateFixtureResult {
  rounds: FixtureRound[];
  totalMatches: number;
  totalRounds: number;
  hasBye: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function bergerRoundRobin(
  teams: (TeamId | BYEType)[]
): [TeamId | BYEType, TeamId | BYEType][][] {
  const n = teams.length;
  const rounds: [TeamId | BYEType, TeamId | BYEType][][] = [];
  const rotation = [...teams];

  for (let r = 0; r < n - 1; r++) {
    const roundMatches: [TeamId | BYEType, TeamId | BYEType][] = [];
    for (let i = 0; i < n / 2; i++) {
      roundMatches.push([rotation[i], rotation[n - 1 - i]]);
    }
    rounds.push(roundMatches);

    const fixed = rotation[0];
    const last = rotation[n - 1];
    for (let k = n - 1; k > 1; k--) {
      rotation[k] = rotation[k - 1];
    }
    rotation[1] = last;
    rotation[0] = fixed;
  }

  return rounds;
}

export function generateFixture(options: GenerateFixtureOptions): GenerateFixtureResult {
  const { teamIds, format, invertHomeAwayOnReturn = true, shuffle = false } = options;

  if (teamIds.length < 2) {
    throw new Error("Se necesitan al menos 2 equipos para generar un fixture.");
  }

  let teams: (TeamId | BYEType)[] = shuffle ? shuffleArray(teamIds) : [...teamIds];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) {
    teams = [...teams, BYE];
  }

  const idaRounds = bergerRoundRobin(teams);
  const rounds: FixtureRound[] = [];
  let totalMatches = 0;

  idaRounds.forEach((rawMatches, roundIndex) => {
    const roundNumber = roundIndex + 1;
    const fixtureMatches: FixtureMatch[] = [];

    rawMatches.forEach((pair, pairIndex) => {
      const [home, away] = pair;
      const isBye = home === BYE || away === BYE;
      fixtureMatches.push({
        round: roundNumber,
        matchNumber: pairIndex + 1,
        homeTeamId: home === BYE ? null : (home as TeamId),
        awayTeamId: away === BYE ? null : (away as TeamId),
        isReturn: false,
      });
      if (!isBye) totalMatches++;
    });

    rounds.push({ round: roundNumber, label: `Jornada ${roundNumber}`, matches: fixtureMatches });
  });

  if (format === "home_and_away") {
    const totalIdaRounds = idaRounds.length;
    idaRounds.forEach((rawMatches, roundIndex) => {
      const returnRoundNumber = totalIdaRounds + roundIndex + 1;
      const fixtureMatches: FixtureMatch[] = [];

      rawMatches.forEach((pair, pairIndex) => {
        const [originalHome, originalAway] = pair;
        const isBye = originalHome === BYE || originalAway === BYE;
        const home = invertHomeAwayOnReturn ? originalAway : originalHome;
        const away = invertHomeAwayOnReturn ? originalHome : originalAway;

        fixtureMatches.push({
          round: returnRoundNumber,
          matchNumber: pairIndex + 1,
          homeTeamId: home === BYE ? null : (home as TeamId),
          awayTeamId: away === BYE ? null : (away as TeamId),
          isReturn: true,
        });
        if (!isBye) totalMatches++;
      });

      rounds.push({
        round: returnRoundNumber,
        label: `Jornada ${returnRoundNumber} (Vuelta)`,
        matches: fixtureMatches,
      });
    });
  }

  return { rounds, totalMatches, totalRounds: rounds.length, hasBye };
}

/** Estimación de partidos (round robin, sin contar bye). */
export function estimateMatchCount(teamCount: number, format: FixtureFormat): number {
  if (teamCount < 2) return 0;
  const single = (teamCount * (teamCount - 1)) / 2;
  return format === "home_and_away" ? single * 2 : single;
}

export interface GroupFixtureInput {
  groupName: string;
  teamIds: TeamId[];
}

export interface GroupFixtureResult {
  groupName: string;
  fixture: GenerateFixtureResult;
}

/** Reparto serpentina en N grupos balanceados. */
export function distributeTeamsIntoGroups(
  teamIds: TeamId[],
  numGroups: number,
  shuffle = false
): GroupFixtureInput[] {
  if (numGroups < 1) throw new Error("El número de grupos debe ser al menos 1.");
  if (teamIds.length < numGroups) {
    throw new Error("Debe haber al menos un equipo por grupo.");
  }

  const teams = shuffle ? shuffleArray(teamIds) : [...teamIds];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const groups: GroupFixtureInput[] = Array.from({ length: numGroups }, (_, i) => ({
    groupName: `Grupo ${letters[i] ?? i + 1}`,
    teamIds: [],
  }));

  let ascending = true;
  let groupIndex = 0;

  for (const team of teams) {
    groups[groupIndex].teamIds.push(team);
    if (ascending) {
      groupIndex++;
      if (groupIndex >= numGroups) {
        groupIndex = numGroups - 1;
        ascending = false;
      }
    } else {
      groupIndex--;
      if (groupIndex < 0) {
        groupIndex = 0;
        ascending = true;
      }
    }
  }

  return groups;
}

export function generateGroupsFixture(
  groups: GroupFixtureInput[],
  format: FixtureFormat = "linear",
  shuffle = false
): GroupFixtureResult[] {
  return groups.map((group) => ({
    groupName: group.groupName,
    fixture: generateFixture({
      teamIds: group.teamIds,
      format,
      shuffle,
    }),
  }));
}

/** Partidos totales en fase de grupos (round robin lineal por grupo). */
export function estimateGroupsMatchCount(
  teamCount: number,
  numGroups: number,
  shuffle = false
): number {
  if (teamCount < 2 || numGroups < 1) return 0;
  const groups = distributeTeamsIntoGroups(
    Array.from({ length: teamCount }, (_, i) => `t${i}`),
    numGroups,
    shuffle
  );
  return groups.reduce((sum, g) => sum + estimateMatchCount(g.teamIds.length, "linear"), 0);
}
