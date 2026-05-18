import type { TournamentMatchStatus } from "@/lib/db/schema";

export interface MatchResultInput {
  homeCategoryId: string;
  awayCategoryId: string;
  homeScore: number;
  awayScore: number;
  status: TournamentMatchStatus;
}

export interface TeamStandingRow {
  categoryId: string;
  played: number;
  won: number;
  lost: number;
  woWon: number;
  woLost: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  position: number;
}

export interface StandingsConfig {
  pointsWin?: number;
  pointsLoss?: number;
  pointsWalkover?: number;
  pointsWoLoser?: number;
  woScore?: number;
}

export function calculateStandings(
  categoryIds: string[],
  results: MatchResultInput[],
  config: StandingsConfig = {}
): TeamStandingRow[] {
  const pointsWin = config.pointsWin ?? 2;
  const pointsLoss = config.pointsLoss ?? 1;
  const pointsWo = config.pointsWalkover ?? 2;
  const pointsWoLoser = config.pointsWoLoser ?? 0;
  const woScore = config.woScore ?? 20;

  const table = new Map<string, TeamStandingRow>(
    categoryIds.map((id) => [
      id,
      {
        categoryId: id,
        played: 0,
        won: 0,
        lost: 0,
        woWon: 0,
        woLost: 0,
        points: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDiff: 0,
        position: 0,
      },
    ])
  );

  for (const m of results) {
    const home = table.get(m.homeCategoryId);
    const away = table.get(m.awayCategoryId);
    if (!home || !away) continue;

    if (m.status === "wo_home") {
      home.woWon++;
      home.points += pointsWo;
      home.pointsFor += woScore;
      away.woLost++;
      away.points += pointsWoLoser;
      away.pointsAgainst += woScore;
      continue;
    }
    if (m.status === "wo_away") {
      away.woWon++;
      away.points += pointsWo;
      away.pointsFor += woScore;
      home.woLost++;
      home.points += pointsWoLoser;
      home.pointsAgainst += woScore;
      continue;
    }
    if (m.status !== "finished") continue;

    home.played++;
    away.played++;
    home.pointsFor += m.homeScore;
    home.pointsAgainst += m.awayScore;
    away.pointsFor += m.awayScore;
    away.pointsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++;
      home.points += pointsWin;
      away.lost++;
      away.points += pointsLoss;
    } else if (m.awayScore > m.homeScore) {
      away.won++;
      away.points += pointsWin;
      home.lost++;
      home.points += pointsLoss;
    } else {
      home.lost++;
      away.lost++;
      home.points += pointsLoss;
      away.points += pointsLoss;
    }
  }

  const standings = Array.from(table.values()).map((s) => ({
    ...s,
    pointDiff: s.pointsFor - s.pointsAgainst,
  }));

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsFor - a.pointsFor;
  });

  let pos = 1;
  for (let i = 0; i < standings.length; i++) {
    if (
      i > 0 &&
      standings[i].points === standings[i - 1].points &&
      standings[i].pointDiff === standings[i - 1].pointDiff &&
      standings[i].pointsFor === standings[i - 1].pointsFor
    ) {
      standings[i].position = standings[i - 1].position;
    } else {
      standings[i].position = pos;
    }
    pos++;
  }

  return standings;
}
