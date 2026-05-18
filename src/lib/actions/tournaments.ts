"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db/client";
import {
  categories,
  clubs,
  leagues,
  tournamentGroups,
  tournamentMatches,
  tournamentParticipants,
  tournamentStandings,
  tournaments,
} from "@/lib/db/schema";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import type { ActionResult } from "@/lib/types/league";
import { settingsRepository } from "@/repositories/settingsRepository";
import { buildSettingsOverride, resolveTournamentRules } from "@/lib/tournaments/defaults";
import {
  distributeTeamsIntoGroups,
  generateFixture,
  generateGroupsFixture,
} from "@/lib/tournaments/fixture-generator";
import { calculateStandings, type MatchResultInput } from "@/lib/tournaments/standings";
import { slugifyTournamentName } from "@/lib/tournaments/slug";
import {
  advancePlayoffWinner,
  buildPlayoffBracketFromStandings,
  insertPlayoffBracket,
  isPlayoffsFormat,
} from "@/lib/tournaments/generate-playoffs";
import type { TournamentSettings } from "@/lib/db/schema";
import {
  hasAnyQuarterInput,
  validateQuarterScores,
} from "@/lib/tournaments/score-quarters";
import {
  createTournamentSchema,
  recordMatchResultSchema,
  type CreateTournamentInput,
  type RecordMatchResultInput,
} from "@/lib/tournaments/validations";

function resolveLeagueId(context: AuthContext): string | null {
  return context.leagueId?.trim() || null;
}

async function assertCategoriesInLeague(leagueId: string, categoryIds: string[]) {
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(and(eq(clubs.leagueId, leagueId), inArray(categories.id, categoryIds)));

  if (rows.length !== categoryIds.length) {
    throw new Error("Uno o más equipos no pertenecen a esta liga.");
  }
}

async function recalcStandingsForGroup(
  tournamentId: string,
  groupId: string,
  leagueId: string
) {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);
  if (!tournament) return;

  const leagueSettings = await settingsRepository.getLeagueSettings(leagueId);
  const rules = resolveTournamentRules(leagueSettings, tournament.settings);

  const participants = await db
    .select({ categoryId: tournamentParticipants.categoryId })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.groupId, groupId));

  const categoryIds = participants.map((p) => p.categoryId);

  const matches = await db
    .select()
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.groupId, groupId),
        inArray(tournamentMatches.status, ["finished", "wo_home", "wo_away"])
      )
    );

  const results: MatchResultInput[] = [];
  for (const m of matches) {
    if (!m.homeCategoryId || !m.awayCategoryId) continue;
    if (m.status === "wo_home" || m.status === "wo_away") {
      results.push({
        homeCategoryId: m.homeCategoryId,
        awayCategoryId: m.awayCategoryId,
        homeScore: 0,
        awayScore: 0,
        status: m.status,
      });
    } else if (m.status === "finished" && m.homeScore != null && m.awayScore != null) {
      results.push({
        homeCategoryId: m.homeCategoryId,
        awayCategoryId: m.awayCategoryId,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: "finished",
      });
    }
  }

  const computed = calculateStandings(categoryIds, results, {
    pointsWin: rules.pointsWin,
    pointsLoss: rules.pointsLoss,
    pointsWalkover: rules.pointsWalkover,
    pointsWoLoser: rules.pointsWoLoser,
    woScore: rules.woScore,
  });

  for (const row of computed) {
    await db
      .update(tournamentStandings)
      .set({
        played: row.played,
        won: row.won,
        lost: row.lost,
        woWon: row.woWon,
        woLost: row.woLost,
        points: row.points,
        pointsFor: row.pointsFor,
        pointsAgainst: row.pointsAgainst,
        pointDiff: row.pointDiff,
        position: row.position,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tournamentStandings.groupId, groupId),
          eq(tournamentStandings.categoryId, row.categoryId)
        )
      );
  }
}

export type CreateTournamentResult =
  | { success: true; tournamentId: string }
  | { success: false; error: string };

export const createTournamentWithFixture = withAuth(
  async (
    input: CreateTournamentInput,
    _user: User,
    context: AuthContext
  ): Promise<CreateTournamentResult> => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) {
      return { success: false, error: "No se encontró la liga activa en tu sesión." };
    }

    const parsed = createTournamentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const data = parsed.data;
    const uniqueIds = [...new Set(data.categoryIds)];

    try {
      await assertCategoriesInLeague(leagueId, uniqueIds);
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Equipos no válidos.",
      };
    }

    const isGroupPhaseFormat = data.format === "groups" || data.format === "groups_playoffs";
    const numGroups = data.numberOfGroups ?? 2;
    const shuffleGroups = data.shuffleGroups ?? false;

    const leagueSettings = await settingsRepository.getLeagueSettings(leagueId);
    const settings = buildSettingsOverride(leagueSettings, {
      pointsWin: data.pointsWin,
      pointsLoss: data.pointsLoss,
      pointsWalkover: data.pointsWalkover,
      rulesNote: data.rulesNote,
      numberOfGroups: isGroupPhaseFormat ? numGroups : undefined,
      shuffleGroups: isGroupPhaseFormat && shuffleGroups ? true : undefined,
      teamsPerGroupToAdvance:
        data.format === "groups_playoffs" ? (data.teamsPerGroupToAdvance ?? 2) : undefined,
      thirdPlaceMatch:
        data.format === "groups_playoffs" ? data.thirdPlaceMatch === true : undefined,
      useQuarters: data.useQuarters === true ? true : undefined,
    });

    let baseSlug = slugifyTournamentName(data.name);
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const [existing] = await db
        .select({ id: tournaments.id })
        .from(tournaments)
        .where(and(eq(tournaments.leagueId, leagueId), eq(tournaments.slug, slug)))
        .limit(1);
      if (!existing) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [tournament] = await tx
          .insert(tournaments)
          .values({
            leagueId,
            name: data.name.trim(),
            slug,
            format: data.format,
            status: "draft",
            settings,
            createdBy: context.userId,
          })
          .returning({ id: tournaments.id });

        const tournamentId = tournament.id;

        if (isGroupPhaseFormat) {
          const distributed = distributeTeamsIntoGroups(uniqueIds, numGroups, shuffleGroups);
          const groupFixtures = generateGroupsFixture(distributed, "linear", false);

          for (let i = 0; i < distributed.length; i++) {
            const dist = distributed[i];
            const fixture = groupFixtures[i].fixture;

            const [groupRow] = await tx
              .insert(tournamentGroups)
              .values({
                tournamentId,
                name: dist.groupName,
                sortOrder: i,
                isDefault: i === 0,
              })
              .returning({ id: tournamentGroups.id });

            const groupId = groupRow.id;

            await tx.insert(tournamentParticipants).values(
              dist.teamIds.map((categoryId) => ({
                tournamentId,
                groupId,
                categoryId,
              }))
            );

            const matchRows = fixture.rounds.flatMap((round) =>
              round.matches.map((m) => ({
                tournamentId,
                groupId,
                round: m.round,
                matchNumber: m.matchNumber,
                phase: "group" as const,
                homeCategoryId: m.homeTeamId,
                awayCategoryId: m.awayTeamId,
                status: "scheduled" as const,
              }))
            );

            if (matchRows.length > 0) {
              await tx.insert(tournamentMatches).values(matchRows);
            }

            await tx.insert(tournamentStandings).values(
              dist.teamIds.map((categoryId) => ({
                tournamentId,
                groupId,
                categoryId,
              }))
            );
          }
        } else {
          const [defaultGroup] = await tx
            .insert(tournamentGroups)
            .values({
              tournamentId,
              name: "Principal",
              sortOrder: 0,
              isDefault: true,
            })
            .returning({ id: tournamentGroups.id });

          const groupId = defaultGroup.id;

          await tx.insert(tournamentParticipants).values(
            uniqueIds.map((categoryId) => ({
              tournamentId,
              groupId,
              categoryId,
            }))
          );

          const fixture = generateFixture({
            teamIds: uniqueIds,
            format: data.format as "linear" | "home_and_away",
          });

          const matchRows = fixture.rounds.flatMap((round) =>
            round.matches.map((m) => ({
              tournamentId,
              groupId,
              round: m.round,
              matchNumber: m.matchNumber,
              phase: "group" as const,
              homeCategoryId: m.homeTeamId,
              awayCategoryId: m.awayTeamId,
              status: "scheduled" as const,
            }))
          );

          if (matchRows.length > 0) {
            await tx.insert(tournamentMatches).values(matchRows);
          }

          await tx.insert(tournamentStandings).values(
            uniqueIds.map((categoryId) => ({
              tournamentId,
              groupId,
              categoryId,
            }))
          );
        }

        return tournamentId;
      });

      revalidatePath("/liga/torneos");
      return { success: true, tournamentId: result };
    } catch (err) {
      console.error("[createTournamentWithFixture]", err);
      const msg =
        err instanceof Error && err.message.includes("relation")
          ? "Las tablas de torneos no existen. Aplica la migración 0013_tournaments_module.sql en Supabase."
          : "No se pudo crear el torneo. Intenta nuevamente.";
      return { success: false, error: msg };
    }
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

export const publishTournament = withAuth(
  async (tournamentId: string, _user: User, context: AuthContext): Promise<ActionResult> => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) return { success: false, error: "Liga no definida." };

    const [t] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.leagueId, leagueId)))
      .limit(1);

    if (!t) return { success: false, error: "Torneo no encontrado." };
    if (t.status !== "draft") {
      return { success: false, error: "Solo se puede iniciar un torneo en borrador." };
    }

    await db
      .update(tournaments)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(tournaments.id, tournamentId));

    revalidatePath(`/liga/torneos/${tournamentId}`);
    revalidatePath("/liga/torneos");
    return { success: true };
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

export const generatePlayoffBracket = withAuth(
  async (tournamentId: string, _user: User, context: AuthContext): Promise<ActionResult> => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) return { success: false, error: "Liga no definida." };

    const [t] = await db
      .select()
      .from(tournaments)
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.leagueId, leagueId)))
      .limit(1);

    if (!t) return { success: false, error: "Torneo no encontrado." };
    if (!isPlayoffsFormat(t.format)) {
      return { success: false, error: "Este torneo no tiene formato de play-offs." };
    }
    if (t.settings?.playoffsGenerated) {
      return { success: false, error: "La llave de play-offs ya fue generada." };
    }
    if (t.status === "finished" || t.status === "cancelled") {
      return { success: false, error: "El torneo ya no admite cambios." };
    }

    try {
      const bracket = await buildPlayoffBracketFromStandings(db, tournamentId, t.settings);

      await db.transaction(async (tx) => {
        const groupCount = t.settings?.numberOfGroups ?? 2;
        await insertPlayoffBracket(tx, tournamentId, groupCount, bracket);

        const nextSettings: TournamentSettings = {
          ...(t.settings ?? {}),
          playoffsGenerated: true,
        };

        await tx
          .update(tournaments)
          .set({ settings: nextSettings, updatedAt: new Date() })
          .where(eq(tournaments.id, tournamentId));
      });

      revalidatePath(`/liga/torneos/${tournamentId}`);
      return { success: true };
    } catch (err) {
      console.error("[generatePlayoffBracket]", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "No se pudo generar la llave.",
      };
    }
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

export const finishTournament = withAuth(
  async (tournamentId: string, _user: User, context: AuthContext): Promise<ActionResult> => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) return { success: false, error: "Liga no definida." };

    await db
      .update(tournaments)
      .set({ status: "finished", updatedAt: new Date() })
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.leagueId, leagueId)));

    revalidatePath(`/liga/torneos/${tournamentId}`);
    revalidatePath("/liga/torneos");
    return { success: true };
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

export const recordMatchResult = withAuth(
  async (
    input: RecordMatchResultInput,
    _user: User,
    context: AuthContext
  ): Promise<ActionResult> => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) return { success: false, error: "Liga no definida." };

    const parsed = recordMatchResultSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const {
      matchId,
      mode,
      homeScore,
      awayScore,
      homeQ1,
      awayQ1,
      homeQ2,
      awayQ2,
      homeQ3,
      awayQ3,
      homeQ4,
      awayQ4,
      homeOt,
      awayOt,
    } = parsed.data;

    const quarterFields = {
      homeQ1: homeQ1 ?? null,
      awayQ1: awayQ1 ?? null,
      homeQ2: homeQ2 ?? null,
      awayQ2: awayQ2 ?? null,
      homeQ3: homeQ3 ?? null,
      awayQ3: awayQ3 ?? null,
      homeQ4: homeQ4 ?? null,
      awayQ4: awayQ4 ?? null,
      homeOt: homeOt ?? null,
      awayOt: awayOt ?? null,
    };

    const clearQuarters = {
      homeQ1: null,
      awayQ1: null,
      homeQ2: null,
      awayQ2: null,
      homeQ3: null,
      awayQ3: null,
      homeQ4: null,
      awayQ4: null,
      homeOt: null,
      awayOt: null,
    };

    const [match] = await db
      .select({
        id: tournamentMatches.id,
        tournamentId: tournamentMatches.tournamentId,
        groupId: tournamentMatches.groupId,
        phase: tournamentMatches.phase,
        status: tournamentMatches.status,
        homeCategoryId: tournamentMatches.homeCategoryId,
        awayCategoryId: tournamentMatches.awayCategoryId,
        homeScore: tournamentMatches.homeScore,
        awayScore: tournamentMatches.awayScore,
        advancesToMatchId: tournamentMatches.advancesToMatchId,
        advancesAs: tournamentMatches.advancesAs,
        loserAdvancesToMatchId: tournamentMatches.loserAdvancesToMatchId,
        loserAdvancesAs: tournamentMatches.loserAdvancesAs,
      })
      .from(tournamentMatches)
      .innerJoin(tournaments, eq(tournamentMatches.tournamentId, tournaments.id))
      .where(and(eq(tournamentMatches.id, matchId), eq(tournaments.leagueId, leagueId)))
      .limit(1);

    if (!match) return { success: false, error: "Partido no encontrado." };
    if (!match.homeCategoryId || !match.awayCategoryId) {
      return { success: false, error: "Este slot es descanso (bye), sin resultado." };
    }

    const [tournament] = await db
      .select({ status: tournaments.status, settings: tournaments.settings })
      .from(tournaments)
      .where(eq(tournaments.id, match.tournamentId))
      .limit(1);

    if (tournament?.status === "finished") {
      return { success: false, error: "El torneo ya finalizó." };
    }

    const tournamentUseQuarters =
      (tournament?.settings as TournamentSettings | null)?.useQuarters === true;

    if (mode === "score") {
      if (homeScore === undefined || awayScore === undefined) {
        return { success: false, error: "Ingresa el marcador de ambos equipos." };
      }
      if (tournamentUseQuarters && hasAnyQuarterInput(quarterFields)) {
        const quarterErr = validateQuarterScores(homeScore, awayScore, quarterFields);
        if (quarterErr) return { success: false, error: quarterErr };
      }
    }

    let patch: Partial<typeof tournamentMatches.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (mode === "postpone") {
      patch = {
        ...patch,
        status: "postponed",
        homeScore: null,
        awayScore: null,
        ...clearQuarters,
      };
    } else if (mode === "wo_home") {
      patch = {
        ...patch,
        status: "wo_home",
        homeScore: null,
        awayScore: null,
        ...clearQuarters,
      };
    } else if (mode === "wo_away") {
      patch = {
        ...patch,
        status: "wo_away",
        homeScore: null,
        awayScore: null,
        ...clearQuarters,
      };
    } else {
      const quartersPatch =
        tournamentUseQuarters && hasAnyQuarterInput(quarterFields)
          ? quarterFields
          : clearQuarters;
      patch = {
        ...patch,
        status: "finished",
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        ...quartersPatch,
      };
    }

    await db.update(tournamentMatches).set(patch).where(eq(tournamentMatches.id, matchId));

    if (mode !== "postpone") {
      if (match.phase === "group") {
        await recalcStandingsForGroup(match.tournamentId, match.groupId, leagueId);
      } else if (match.phase === "playoff") {
        const updated = {
          ...match,
          status: patch.status ?? match.status,
          homeScore: patch.homeScore ?? match.homeScore,
          awayScore: patch.awayScore ?? match.awayScore,
        };
        await advancePlayoffWinner(db, updated);
      }
    }

    revalidatePath(`/liga/torneos/${match.tournamentId}`);
    return { success: true };
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

export const setTournamentPublicFixture = withAuth(
  async (
    tournamentId: string,
    isPublic: boolean,
    _user: User,
    context: AuthContext
  ): Promise<ActionResult> => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) return { success: false, error: "Liga no definida." };

    const [t] = await db
      .select({
        status: tournaments.status,
        slug: tournaments.slug,
        leagueSlug: leagues.slug,
      })
      .from(tournaments)
      .innerJoin(leagues, eq(tournaments.leagueId, leagues.id))
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.leagueId, leagueId)))
      .limit(1);

    if (!t) return { success: false, error: "Torneo no encontrado." };
    if (isPublic && t.status === "draft") {
      return {
        success: false,
        error: "Inicia el torneo antes de publicar el fixture.",
      };
    }

    await db
      .update(tournaments)
      .set({ isPublicFixture: isPublic, updatedAt: new Date() })
      .where(eq(tournaments.id, tournamentId));

    revalidatePath("/");
    revalidatePath("/liga/portal-publico");
    revalidatePath(`/liga/torneos/${tournamentId}`);
    revalidatePath(`/torneos/${t.leagueSlug}/${t.slug}`);
    return { success: true };
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

export const deleteTournament = withAuth(
  async (tournamentId: string, _user: User, context: AuthContext): Promise<ActionResult> => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) return { success: false, error: "Liga no definida." };

    const [row] = await db
      .select({
        slug: tournaments.slug,
        leagueSlug: leagues.slug,
        isPublicFixture: tournaments.isPublicFixture,
      })
      .from(tournaments)
      .innerJoin(leagues, eq(tournaments.leagueId, leagues.id))
      .where(and(eq(tournaments.id, tournamentId), eq(tournaments.leagueId, leagueId)))
      .limit(1);

    if (!row) return { success: false, error: "Torneo no encontrado." };

    await db.delete(tournaments).where(eq(tournaments.id, tournamentId));

    revalidatePath("/");
    revalidatePath("/liga/torneos");
    revalidatePath("/liga/portal-publico");
    if (row.isPublicFixture) {
      revalidatePath(`/torneos/${row.leagueSlug}/${row.slug}`);
    }
    return { success: true };
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

export type { TournamentExportPayload } from "@/lib/tournaments/export-types";

export const getTournamentExportData = withAuth(
  async (
    tournamentId: string,
    _user: User,
    context: AuthContext
  ): Promise<
    | { success: true; data: import("@/lib/tournaments/export-types").TournamentExportPayload }
    | { success: false; error: string }
  > => {
    const leagueId = resolveLeagueId(context);
    if (!leagueId) return { success: false, error: "Liga no definida." };

    const { getTournamentExportBundle } = await import("@/lib/tournaments/queries");
    const bundle = await getTournamentExportBundle(tournamentId, leagueId);
    if (!bundle) return { success: false, error: "Torneo no encontrado." };
    return { success: true, data: bundle };
  },
  ["LEAGUE_ADMIN", "SUPER_ADMIN"]
);

