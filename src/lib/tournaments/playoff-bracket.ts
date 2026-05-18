/**
 * Llave de play-offs on-demand (Fase C).
 * Cruce estándar: 1.º grupo A vs 2.º grupo B, etc.
 */

export const PLAYOFF_ROUND_BASE = 100;

export type Qualifier = {
  categoryId: string;
  groupIndex: number;
  groupName: string;
  position: number;
};

export type BracketMatchDraft = {
  round: number;
  matchNumber: number;
  playoffLabel: string;
  homeCategoryId: string | null;
  awayCategoryId: string | null;
  advancesToMatchNumber?: number;
  advancesAs?: "home" | "away";
  loserAdvancesToMatchNumber?: number;
  loserAdvancesAs?: "home" | "away";
};

export type BuiltBracket = {
  matches: BracketMatchDraft[];
  playoffGroupName: string;
};

export function pickQualifiers(
  groupsOrdered: { id: string; name: string }[],
  standingsByGroupId: Map<
    string,
    { categoryId: string; position: number }[]
  >,
  teamsPerGroup: number
): Qualifier[] {
  const out: Qualifier[] = [];
  groupsOrdered.forEach((g, groupIndex) => {
    const rows = standingsByGroupId.get(g.id) ?? [];
    const sorted = [...rows].sort((a, b) => a.position - b.position);
    for (let p = 1; p <= teamsPerGroup; p++) {
      const row = sorted.find((r) => r.position === p);
      if (row) {
        out.push({
          categoryId: row.categoryId,
          groupIndex,
          groupName: g.name,
          position: p,
        });
      }
    }
  });
  return out;
}

/** Empareja clasificados en cruces 1.º vs 2.º de otro grupo. */
export function buildCrossoverFirstRound(
  qualifiers: Qualifier[],
  numGroups: number,
  teamsPerGroup: number
): { home: string; away: string; label: string }[] {
  const byGroup = new Map<number, Qualifier[]>();
  for (const q of qualifiers) {
    const list = byGroup.get(q.groupIndex) ?? [];
    list.push(q);
    byGroup.set(q.groupIndex, list);
  }

  const pairs: { home: string; away: string; label: string }[] = [];

  if (numGroups === 2 && teamsPerGroup === 2) {
    const a = byGroup.get(0) ?? [];
    const b = byGroup.get(1) ?? [];
    const firstA = a.find((x) => x.position === 1);
    const secondA = a.find((x) => x.position === 2);
    const firstB = b.find((x) => x.position === 1);
    const secondB = b.find((x) => x.position === 2);
    if (firstA && secondB) {
      pairs.push({
        home: firstA.categoryId,
        away: secondB.categoryId,
        label: "Semifinal 1",
      });
    }
    if (firstB && secondA) {
      pairs.push({
        home: firstB.categoryId,
        away: secondA.categoryId,
        label: "Semifinal 2",
      });
    }
    return pairs;
  }

  let matchIdx = 1;
  for (let g = 0; g < numGroups; g++) {
    const here = byGroup.get(g) ?? [];
    const other = byGroup.get((g + 1) % numGroups) ?? [];
    const first = here.find((x) => x.position === 1);
    const secondOther = other.find((x) => x.position === 2);
    if (first && secondOther) {
      pairs.push({
        home: first.categoryId,
        away: secondOther.categoryId,
        label: `Cuartos ${matchIdx}`,
      });
      matchIdx++;
    }
  }
  return pairs;
}

/**
 * Construye llave: primera ronda con equipos, siguientes con TBD y enlaces de avance.
 */
export function buildEliminationBracket(
  qualifiers: Qualifier[],
  numGroups: number,
  teamsPerGroup: number,
  thirdPlaceMatch: boolean
): BuiltBracket {
  const total = numGroups * teamsPerGroup;
  if (total < 4) {
    throw new Error("Se necesitan al menos 4 clasificados para play-offs.");
  }

  const firstRound = buildCrossoverFirstRound(qualifiers, numGroups, teamsPerGroup);
  if (![2, 4, 8].includes(firstRound.length)) {
    throw new Error(
      `Hay ${firstRound.length} cruces en la primera ronda; la llave admite 4 u 8 clasificados (2 o 4 grupos × 2 puestos).`
    );
  }

  const matches: BracketMatchDraft[] = [];
  const r0 = PLAYOFF_ROUND_BASE;

  firstRound.forEach((p, i) => {
    matches.push({
      round: r0,
      matchNumber: i + 1,
      playoffLabel: p.label,
      homeCategoryId: p.home,
      awayCategoryId: p.away,
    });
  });

  const nextRoundCount = Math.ceil(firstRound.length / 2);
  const r1 = r0 + 1;

  for (let i = 0; i < nextRoundCount; i++) {
    const isFinal = nextRoundCount === 1;
    matches.push({
      round: r1,
      matchNumber: isFinal ? 1 : i + 1,
      playoffLabel: isFinal ? "Final" : `Semifinal ${i + 1}`,
      homeCategoryId: null,
      awayCategoryId: null,
    });
  }

  firstRound.forEach((_, i) => {
    const sfIndex = Math.floor(i / 2);
    const slot: "home" | "away" = i % 2 === 0 ? "home" : "away";
    const m = matches.find((x) => x.round === r0 && x.matchNumber === i + 1);
    if (m) {
      m.advancesToMatchNumber = nextRoundCount === 1 ? 1 : sfIndex + 1;
      m.advancesAs = slot;
    }
  });

  if (thirdPlaceMatch && nextRoundCount >= 2) {
    matches.push({
      round: r1,
      matchNumber: 2,
      playoffLabel: "3.er puesto",
      homeCategoryId: null,
      awayCategoryId: null,
    });
    for (let i = 0; i < 2; i++) {
      const m = matches.find((x) => x.round === r0 && x.matchNumber === i + 1);
      if (m) {
        m.loserAdvancesToMatchNumber = 2;
        m.loserAdvancesAs = i === 0 ? "home" : "away";
      }
    }
  }

  if (nextRoundCount > 1) {
    const r2 = r1 + 1;
    matches.push({
      round: r2,
      matchNumber: 1,
      playoffLabel: "Final",
      homeCategoryId: null,
      awayCategoryId: null,
    });
    for (let i = 0; i < nextRoundCount; i++) {
      const m = matches.find((x) => x.round === r1 && x.matchNumber === i + 1);
      if (m) {
        m.advancesToMatchNumber = 1;
        m.advancesAs = i === 0 ? "home" : "away";
      }
    }
  }

  return { matches, playoffGroupName: "Play-offs" };
}

export function resolveWinnerCategoryId(match: {
  status: string;
  homeCategoryId: string | null;
  awayCategoryId: string | null;
  homeScore: number | null;
  awayScore: number | null;
}): string | null {
  if (!match.homeCategoryId || !match.awayCategoryId) return null;
  if (match.status === "wo_home") return match.homeCategoryId;
  if (match.status === "wo_away") return match.awayCategoryId;
  if (match.status !== "finished" || match.homeScore == null || match.awayScore == null) {
    return null;
  }
  if (match.homeScore > match.awayScore) return match.homeCategoryId;
  if (match.awayScore > match.homeScore) return match.awayCategoryId;
  return null;
}

export function resolveLoserCategoryId(match: {
  status: string;
  homeCategoryId: string | null;
  awayCategoryId: string | null;
  homeScore: number | null;
  awayScore: number | null;
}): string | null {
  const winner = resolveWinnerCategoryId(match);
  if (!winner) return null;
  if (winner === match.homeCategoryId) return match.awayCategoryId;
  return match.homeCategoryId;
}
