import { and, asc, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  tournamentGroups,
  tournamentMatches,
  tournamentStandings,
  type TournamentSettings,
} from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";
import {
  buildEliminationBracket,
  pickQualifiers,
  type BracketMatchDraft,
} from "@/lib/tournaments/playoff-bracket";

type Db = PostgresJsDatabase<typeof schema>;

export async function assertGroupPhaseComplete(
  db: Db,
  tournamentId: string,
  groupIds: string[]
) {
  const pending = await db
    .select({ id: tournamentMatches.id })
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.tournamentId, tournamentId),
        eq(tournamentMatches.phase, "group"),
        inArray(tournamentMatches.groupId, groupIds),
        inArray(tournamentMatches.status, ["scheduled", "postponed"])
      )
    )
    .limit(1);

  if (pending.length > 0) {
    throw new Error("Aún hay partidos de fase de grupos sin resultado.");
  }
}

export async function insertPlayoffBracket(
  tx: Db,
  tournamentId: string,
  sortOrderBase: number,
  bracket: { matches: BracketMatchDraft[]; playoffGroupName: string }
) {
  const [playoffGroup] = await tx
    .insert(tournamentGroups)
    .values({
      tournamentId,
      name: bracket.playoffGroupName,
      sortOrder: sortOrderBase,
      isDefault: false,
    })
    .returning({ id: tournamentGroups.id });

  const playoffGroupId = playoffGroup.id;
  const idByRoundMatch = new Map<string, string>();

  for (const draft of bracket.matches) {
    const [row] = await tx
      .insert(tournamentMatches)
      .values({
        tournamentId,
        groupId: playoffGroupId,
        round: draft.round,
        matchNumber: draft.matchNumber,
        phase: "playoff",
        playoffLabel: draft.playoffLabel,
        homeCategoryId: draft.homeCategoryId,
        awayCategoryId: draft.awayCategoryId,
        status: "scheduled",
      })
      .returning({ id: tournamentMatches.id });

    idByRoundMatch.set(`${draft.round}:${draft.matchNumber}`, row.id);
  }

  for (const draft of bracket.matches) {
    const id = idByRoundMatch.get(`${draft.round}:${draft.matchNumber}`);
    if (!id) continue;

    const patch: Partial<typeof tournamentMatches.$inferInsert> = {};

    if (draft.advancesToMatchNumber != null && draft.advancesAs) {
      const targetId = idByRoundMatch.get(
        `${draft.round + 1}:${draft.advancesToMatchNumber}`
      );
      if (targetId) {
        patch.advancesToMatchId = targetId;
        patch.advancesAs = draft.advancesAs;
      }
    }

    if (draft.loserAdvancesToMatchNumber != null && draft.loserAdvancesAs) {
      const targetId = idByRoundMatch.get(
        `${draft.round + 1}:${draft.loserAdvancesToMatchNumber}`
      );
      if (targetId) {
        patch.loserAdvancesToMatchId = targetId;
        patch.loserAdvancesAs = draft.loserAdvancesAs;
      }
    }

    if (Object.keys(patch).length > 0) {
      await tx.update(tournamentMatches).set(patch).where(eq(tournamentMatches.id, id));
    }
  }

  return playoffGroupId;
}

export async function buildPlayoffBracketFromStandings(
  db: Db,
  tournamentId: string,
  settings: TournamentSettings | null
) {
  const teamsPerGroup = settings?.teamsPerGroupToAdvance ?? 2;
  const thirdPlaceMatch = settings?.thirdPlaceMatch ?? false;
  const numGroups = settings?.numberOfGroups ?? 2;

  const groups = await db
    .select({ id: tournamentGroups.id, name: tournamentGroups.name })
    .from(tournamentGroups)
    .where(
      and(eq(tournamentGroups.tournamentId, tournamentId), eq(tournamentGroups.isDefault, false))
    )
    .orderBy(asc(tournamentGroups.sortOrder));

  if (groups.length < 2) {
    throw new Error("No se encontraron grupos de fase regular.");
  }

  const groupIds = groups.map((g) => g.id);
  await assertGroupPhaseComplete(db, tournamentId, groupIds);

  const standingsRows = await db
    .select({
      groupId: tournamentStandings.groupId,
      categoryId: tournamentStandings.categoryId,
      position: tournamentStandings.position,
    })
    .from(tournamentStandings)
    .where(
      and(
        eq(tournamentStandings.tournamentId, tournamentId),
        inArray(tournamentStandings.groupId, groupIds)
      )
    );

  const standingsByGroupId = new Map<string, { categoryId: string; position: number }[]>();
  for (const row of standingsRows) {
    const list = standingsByGroupId.get(row.groupId) ?? [];
    list.push({ categoryId: row.categoryId, position: row.position });
    standingsByGroupId.set(row.groupId, list);
  }

  const qualifiers = pickQualifiers(groups, standingsByGroupId, teamsPerGroup);
  return buildEliminationBracket(qualifiers, groups.length, teamsPerGroup, thirdPlaceMatch);
}

export async function advancePlayoffWinner(
  db: Db,
  match: {
    id: string;
    status: string;
    homeCategoryId: string | null;
    awayCategoryId: string | null;
    homeScore: number | null;
    awayScore: number | null;
    advancesToMatchId: string | null;
    advancesAs: string | null;
    loserAdvancesToMatchId: string | null;
    loserAdvancesAs: string | null;
  }
) {
  const { resolveLoserCategoryId, resolveWinnerCategoryId } = await import(
    "@/lib/tournaments/playoff-bracket"
  );

  const winner = resolveWinnerCategoryId(match);
  const loser = resolveLoserCategoryId(match);

  if (winner && match.advancesToMatchId && match.advancesAs) {
    const field =
      match.advancesAs === "home"
        ? { homeCategoryId: winner }
        : { awayCategoryId: winner };
    await db
      .update(tournamentMatches)
      .set({ ...field, updatedAt: new Date() })
      .where(eq(tournamentMatches.id, match.advancesToMatchId));
  }

  if (loser && match.loserAdvancesToMatchId && match.loserAdvancesAs) {
    const field =
      match.loserAdvancesAs === "home"
        ? { homeCategoryId: loser }
        : { awayCategoryId: loser };
    await db
      .update(tournamentMatches)
      .set({ ...field, updatedAt: new Date() })
      .where(eq(tournamentMatches.id, match.loserAdvancesToMatchId));
  }
}

export function isPlayoffsFormat(format: string) {
  return format === "groups_playoffs";
}

export async function countPendingGroupMatches(db: Db, tournamentId: string) {
  const rows = await db
    .select({ id: tournamentGroups.id })
    .from(tournamentGroups)
    .where(
      and(eq(tournamentGroups.tournamentId, tournamentId), eq(tournamentGroups.isDefault, false))
    );

  if (rows.length === 0) return 0;

  const pending = await db
    .select({ id: tournamentMatches.id })
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.tournamentId, tournamentId),
        eq(tournamentMatches.phase, "group"),
        inArray(
          tournamentMatches.groupId,
          rows.map((r) => r.id)
        ),
        inArray(tournamentMatches.status, ["scheduled", "postponed"])
      )
    );

  return pending.length;
}

export async function hasPlayoffPhase(db: Db, tournamentId: string) {
  const [row] = await db
    .select({ id: tournamentMatches.id })
    .from(tournamentMatches)
    .where(
      and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.phase, "playoff"))
    )
    .limit(1);
  return Boolean(row);
}
