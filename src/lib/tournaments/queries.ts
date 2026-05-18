import { db } from "@/lib/db/client";
import { withQueryTimeout } from "@/lib/db/query-timeout";
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
import type { TournamentExportPayload } from "@/lib/tournaments/export-types";
import { tournamentFormatLabel } from "@/lib/tournaments/format-labels";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";

export type CategoryPickOption = {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
};

export async function listCategoriesForTournamentPicker(leagueId: string) {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      clubId: categories.clubId,
      clubName: clubs.name,
    })
    .from(categories)
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(eq(clubs.leagueId, leagueId))
    .orderBy(asc(clubs.name), asc(categories.name));

  return rows as CategoryPickOption[];
}

const DB_QUERY_MS = 10_000;

export async function listTournamentsByLeague(leagueId: string) {
  return withQueryTimeout(
    db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        slug: tournaments.slug,
        format: tournaments.format,
        status: tournaments.status,
        createdAt: tournaments.createdAt,
      })
      .from(tournaments)
      .where(eq(tournaments.leagueId, leagueId))
      .orderBy(desc(tournaments.createdAt)),
    DB_QUERY_MS,
    "listTournamentsByLeague"
  );
}

export type TournamentPortalAdminRow = {
  id: string;
  name: string;
  slug: string;
  format: string;
  status: string;
  isPublicFixture: boolean;
  leagueSlug: string;
  createdAt: Date;
};

/** Listado para el hub «Portal y campeonatos» (gestión de visibilidad pública). */
export async function listTournamentsForPortalAdmin(leagueId: string) {
  return withQueryTimeout(
    db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        slug: tournaments.slug,
        format: tournaments.format,
        status: tournaments.status,
        isPublicFixture: tournaments.isPublicFixture,
        leagueSlug: leagues.slug,
        createdAt: tournaments.createdAt,
      })
      .from(tournaments)
      .innerJoin(leagues, eq(tournaments.leagueId, leagues.id))
      .where(eq(tournaments.leagueId, leagueId))
      .orderBy(desc(tournaments.createdAt)),
    DB_QUERY_MS,
    "listTournamentsForPortalAdmin"
  );
}

export async function getTournamentById(tournamentId: string) {
  const [row] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);
  return row ?? null;
}

export async function getTournamentParticipantsWithLabels(tournamentId: string) {
  return db
    .select({
      id: tournamentParticipants.id,
      categoryId: tournamentParticipants.categoryId,
      groupId: tournamentParticipants.groupId,
      categoryName: categories.name,
      clubName: clubs.name,
    })
    .from(tournamentParticipants)
    .innerJoin(categories, eq(tournamentParticipants.categoryId, categories.id))
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(eq(tournamentParticipants.tournamentId, tournamentId))
    .orderBy(asc(clubs.name), asc(categories.name));
}

export async function getTournamentGroups(tournamentId: string) {
  return db
    .select({
      id: tournamentGroups.id,
      name: tournamentGroups.name,
      sortOrder: tournamentGroups.sortOrder,
      isDefault: tournamentGroups.isDefault,
    })
    .from(tournamentGroups)
    .where(eq(tournamentGroups.tournamentId, tournamentId))
    .orderBy(asc(tournamentGroups.sortOrder));
}

/** Grupos de fase regular (excluye llave de play-offs). */
export async function getTournamentRegularGroups(tournamentId: string) {
  const all = await getTournamentGroups(tournamentId);
  return all.filter((g) => !g.name.toLowerCase().includes("play-off"));
}

export async function getTournamentMatches(tournamentId: string, groupId?: string) {
  const whereClause = groupId
    ? and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.groupId, groupId))
    : eq(tournamentMatches.tournamentId, tournamentId);

  const rows = await db
    .select({
      id: tournamentMatches.id,
      groupId: tournamentMatches.groupId,
      phase: tournamentMatches.phase,
      playoffLabel: tournamentMatches.playoffLabel,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      status: tournamentMatches.status,
      homeCategoryId: tournamentMatches.homeCategoryId,
      awayCategoryId: tournamentMatches.awayCategoryId,
      homeScore: tournamentMatches.homeScore,
      awayScore: tournamentMatches.awayScore,
      homeQ1: tournamentMatches.homeQ1,
      awayQ1: tournamentMatches.awayQ1,
      homeQ2: tournamentMatches.homeQ2,
      awayQ2: tournamentMatches.awayQ2,
      homeQ3: tournamentMatches.homeQ3,
      awayQ3: tournamentMatches.awayQ3,
      homeQ4: tournamentMatches.homeQ4,
      awayQ4: tournamentMatches.awayQ4,
      homeOt: tournamentMatches.homeOt,
      awayOt: tournamentMatches.awayOt,
      scheduledAt: tournamentMatches.scheduledAt,
      venue: tournamentMatches.venue,
    })
    .from(tournamentMatches)
    .where(whereClause)
    .orderBy(asc(tournamentMatches.round), asc(tournamentMatches.matchNumber));

  const categoryIds = [
    ...new Set(
      rows.flatMap((r) => [r.homeCategoryId, r.awayCategoryId].filter(Boolean) as string[])
    ),
  ];

  if (categoryIds.length === 0) {
    return rows.map((r) => ({
      ...r,
      homeLabel: "Descansa",
      awayLabel: "Descansa",
      homeLogoUrl: null as string | null,
      awayLogoUrl: null as string | null,
    }));
  }

  const labels = await db
    .select({
      id: categories.id,
      categoryName: categories.name,
      clubName: clubs.name,
      clubLogoUrl: clubs.logoUrl,
    })
    .from(categories)
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(inArray(categories.id, categoryIds));

  const labelMap = new Map(
    labels.map((l) => [l.id, `${l.clubName} · ${l.categoryName}`])
  );
  const logoMap = new Map(
    labels.map((l) => [l.id, l.clubLogoUrl?.trim() || null] as const)
  );

  return rows.map((r) => {
    const pending = r.phase === "playoff" ? "Por definir" : "Descansa";
    return {
      ...r,
      homeLabel: r.homeCategoryId ? labelMap.get(r.homeCategoryId) ?? "—" : pending,
      awayLabel: r.awayCategoryId ? labelMap.get(r.awayCategoryId) ?? "—" : pending,
      homeLogoUrl: r.homeCategoryId ? (logoMap.get(r.homeCategoryId) ?? null) : null,
      awayLogoUrl: r.awayCategoryId ? (logoMap.get(r.awayCategoryId) ?? null) : null,
    };
  });
}

export async function getTournamentStandingsRows(tournamentId: string, groupId?: string) {
  const whereClause = groupId
    ? and(
        eq(tournamentStandings.tournamentId, tournamentId),
        eq(tournamentStandings.groupId, groupId)
      )
    : eq(tournamentStandings.tournamentId, tournamentId);

  return db
    .select({
      groupId: tournamentStandings.groupId,
      categoryId: tournamentStandings.categoryId,
      played: tournamentStandings.played,
      won: tournamentStandings.won,
      lost: tournamentStandings.lost,
      woWon: tournamentStandings.woWon,
      woLost: tournamentStandings.woLost,
      points: tournamentStandings.points,
      pointsFor: tournamentStandings.pointsFor,
      pointsAgainst: tournamentStandings.pointsAgainst,
      pointDiff: tournamentStandings.pointDiff,
      position: tournamentStandings.position,
      categoryName: categories.name,
      clubName: clubs.name,
      clubLogoUrl: clubs.logoUrl,
    })
    .from(tournamentStandings)
    .innerJoin(categories, eq(tournamentStandings.categoryId, categories.id))
    .innerJoin(clubs, eq(categories.clubId, clubs.id))
    .where(whereClause)
    .orderBy(asc(tournamentStandings.position), desc(tournamentStandings.points));
}

export async function getClubTournamentSummary(leagueId: string, clubId: string) {
  const participantRows = await db
    .select({
      tournamentId: tournamentParticipants.tournamentId,
      tournamentName: tournaments.name,
      tournamentStatus: tournaments.status,
      categoryId: tournamentParticipants.categoryId,
      categoryName: categories.name,
    })
    .from(tournamentParticipants)
    .innerJoin(tournaments, eq(tournamentParticipants.tournamentId, tournaments.id))
    .innerJoin(categories, eq(tournamentParticipants.categoryId, categories.id))
    .where(and(eq(tournaments.leagueId, leagueId), eq(categories.clubId, clubId)));

  if (participantRows.length === 0) {
    return { tournaments: [], upcomingMatches: [] };
  }

  const categoryIds = participantRows.map((p) => p.categoryId);
  const tournamentIds = [...new Set(participantRows.map((p) => p.tournamentId))];

  const upcoming = await db
    .select({
      id: tournamentMatches.id,
      tournamentId: tournamentMatches.tournamentId,
      round: tournamentMatches.round,
      status: tournamentMatches.status,
      homeCategoryId: tournamentMatches.homeCategoryId,
      awayCategoryId: tournamentMatches.awayCategoryId,
      scheduledAt: tournamentMatches.scheduledAt,
    })
    .from(tournamentMatches)
    .where(
      and(
        inArray(tournamentMatches.tournamentId, tournamentIds),
        eq(tournamentMatches.status, "scheduled"),
        or(
          inArray(tournamentMatches.homeCategoryId, categoryIds),
          inArray(tournamentMatches.awayCategoryId, categoryIds)
        )
      )
    )
    .orderBy(asc(tournamentMatches.round))
    .limit(12);

  const uniqueTournaments = Array.from(
    new Map(
      participantRows.map((p) => [
        p.tournamentId,
        { id: p.tournamentId, name: p.tournamentName, status: p.tournamentStatus },
      ])
    ).values()
  );

  return { tournaments: uniqueTournaments, upcomingMatches: upcoming };
}

export async function getDefaultGroupId(tournamentId: string) {
  const [g] = await db
    .select({ id: tournamentGroups.id })
    .from(tournamentGroups)
    .where(eq(tournamentGroups.tournamentId, tournamentId))
    .orderBy(asc(tournamentGroups.sortOrder))
    .limit(1);
  return g?.id ?? null;
}

export type PublicTournamentListItem = {
  id: string;
  name: string;
  slug: string;
  format: string;
  status: string;
  leagueSlug: string;
};

/** Torneos visibles en la portada del portal (mismos criterios que la página pública del torneo). */
export async function listPublicTournamentsByLeague(
  leagueId: string
): Promise<PublicTournamentListItem[]> {
  const rows = await withQueryTimeout(
    db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        slug: tournaments.slug,
        format: tournaments.format,
        status: tournaments.status,
        leagueSlug: leagues.slug,
        createdAt: tournaments.createdAt,
      })
      .from(tournaments)
      .innerJoin(leagues, eq(tournaments.leagueId, leagues.id))
      .where(
        and(
          eq(tournaments.leagueId, leagueId),
          eq(tournaments.isPublicFixture, true),
          inArray(tournaments.status, ["active", "finished"])
        )
      )
      .orderBy(desc(tournaments.createdAt)),
    DB_QUERY_MS,
    "listPublicTournamentsByLeague"
  );

  return rows
    .map(({ createdAt: _c, ...rest }) => rest)
    .sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
}

async function getPublicTournamentBySlugsInner(leagueSlug: string, tournamentSlug: string) {
  const [row] = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      slug: tournaments.slug,
      format: tournaments.format,
      status: tournaments.status,
      settings: tournaments.settings,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
    })
    .from(tournaments)
    .innerJoin(leagues, eq(tournaments.leagueId, leagues.id))
    .where(
      and(
        eq(leagues.slug, leagueSlug),
        eq(tournaments.slug, tournamentSlug),
        eq(tournaments.isPublicFixture, true),
        inArray(tournaments.status, ["active", "finished"])
      )
    )
    .limit(1);

  if (!row) return null;

  const [groups, matches, standings] = await Promise.all([
    getTournamentGroups(row.id),
    getTournamentMatches(row.id),
    getTournamentStandingsRows(row.id),
  ]);

  return { tournament: row, groups, matches, standings };
}

export async function getPublicTournamentBySlugs(leagueSlug: string, tournamentSlug: string) {
  try {
    return await withQueryTimeout(
      getPublicTournamentBySlugsInner(leagueSlug, tournamentSlug),
      DB_QUERY_MS,
      "getPublicTournamentBySlugs"
    );
  } catch (err) {
    console.error("[getPublicTournamentBySlugs]", err);
    return null;
  }
}

export async function getTournamentExportBundle(
  tournamentId: string,
  leagueId: string
): Promise<TournamentExportPayload | null> {
  const [t] = await db
    .select({
      name: tournaments.name,
      format: tournaments.format,
      status: tournaments.status,
      leagueName: leagues.name,
    })
    .from(tournaments)
    .innerJoin(leagues, eq(tournaments.leagueId, leagues.id))
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.leagueId, leagueId)))
    .limit(1);

  if (!t) return null;

  const groups = await getTournamentGroups(tournamentId);
  const regularGroups = groups.filter((g) => g.name !== "Play-offs");
  const standings = await getTournamentStandingsRows(tournamentId);
  const matches = await getTournamentMatches(tournamentId);

  const groupBlocks = regularGroups.map((g) => ({
    name: g.name,
    standings: standings
      .filter((s) => s.groupId === g.id)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        pos: s.position,
        team: `${s.clubName} · ${s.categoryName}`,
        pts: s.points,
      })),
  }));

  const roundMap = new Map<number, typeof matches>();
  for (const m of matches) {
    const list = roundMap.get(m.round) ?? [];
    list.push(m);
    roundMap.set(m.round, list);
  }

  const rounds = [...roundMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, list]) => {
      const isPlayoff = list[0]?.phase === "playoff";
      return {
        label: isPlayoff ? `Play-offs · Ronda ${round - 100}` : `Jornada ${round}`,
        matches: list.map((m) => {
          let score = "—";
          if (m.status === "finished" && m.homeScore != null && m.awayScore != null) {
            score = `${m.homeScore} - ${m.awayScore}`;
          } else if (m.status.startsWith("wo_")) {
            score = m.status === "wo_home" ? "W.O. local" : "W.O. visitante";
          }
          const prefix = m.playoffLabel ? `${m.playoffLabel}: ` : "";
          return {
            label: `${prefix}${m.homeLabel} vs ${m.awayLabel}`,
            score,
          };
        }),
      };
    });

  return {
    tournamentName: t.name,
    leagueName: t.leagueName,
    format: tournamentFormatLabel(t.format),
    status: t.status,
    groups: groupBlocks,
    rounds,
  };
}
