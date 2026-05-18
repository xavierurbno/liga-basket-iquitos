import { countPendingGroupMatches } from "@/lib/tournaments/generate-playoffs";
import {
  getTournamentById,
  getTournamentGroups,
  getTournamentMatches,
  getTournamentParticipantsWithLabels,
  getTournamentStandingsRows,
} from "@/lib/tournaments/queries";
import { db } from "@/lib/db/client";
import { leagues } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TournamentMatchRow } from "@/components/tournaments/TournamentDetailView";

export type TournamentHubBundle = {
  tournament: {
    id: string;
    slug: string;
    name: string;
    format: string;
    status: string;
    settings: {
      rulesNote?: string;
      numberOfGroups?: number;
      playoffsGenerated?: boolean;
      teamsPerGroupToAdvance?: number;
      useQuarters?: boolean;
    } | null;
  };
  leagueSlug: string;
  isPublicFixture: boolean;
  groups: { id: string; name: string }[];
  participants: {
    categoryId: string;
    categoryName: string;
    clubName: string;
    groupId?: string;
  }[];
  matches: TournamentMatchRow[];
  standings: {
    groupId?: string;
    position: number;
    clubName: string;
    categoryName: string;
    played: number;
    won: number;
    lost: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDiff: number;
    points: number;
  }[];
  pendingGroupMatches: number;
};

export async function loadTournamentHubBundle(
  tournamentId: string,
  leagueId: string,
): Promise<TournamentHubBundle | null> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament || tournament.leagueId !== leagueId) return null;

  const [leagueRow, groups, participants, matchesRaw, standings] = await Promise.all([
    db.select({ slug: leagues.slug }).from(leagues).where(eq(leagues.id, leagueId)).limit(1),
    getTournamentGroups(tournamentId),
    getTournamentParticipantsWithLabels(tournamentId),
    getTournamentMatches(tournamentId),
    getTournamentStandingsRows(tournamentId),
  ]);

  const pendingGroupMatches =
    tournament.format === "groups_playoffs"
      ? await countPendingGroupMatches(db, tournamentId)
      : 0;

  const matches: TournamentMatchRow[] = matchesRaw.map((m) => ({
    id: m.id,
    groupId: m.groupId,
    phase: m.phase,
    playoffLabel: m.playoffLabel,
    round: m.round,
    homeLabel: m.homeLabel,
    awayLabel: m.awayLabel,
    homeLogoUrl: m.homeLogoUrl,
    awayLogoUrl: m.awayLogoUrl,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeQ1: m.homeQ1,
    awayQ1: m.awayQ1,
    homeQ2: m.homeQ2,
    awayQ2: m.awayQ2,
    homeQ3: m.homeQ3,
    awayQ3: m.awayQ3,
    homeQ4: m.homeQ4,
    awayQ4: m.awayQ4,
    homeOt: m.homeOt,
    awayOt: m.awayOt,
  }));

  return {
    tournament: {
      id: tournament.id,
      slug: tournament.slug,
      name: tournament.name,
      format: tournament.format,
      status: tournament.status,
      settings: tournament.settings,
    },
    leagueSlug: leagueRow[0]?.slug ?? "iquitos",
    isPublicFixture: tournament.isPublicFixture,
    groups,
    participants: participants.map((p) => ({
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      clubName: p.clubName,
      groupId: p.groupId,
    })),
    matches,
    standings: standings.map((s) => ({
      groupId: s.groupId,
      position: s.position,
      clubName: s.clubName,
      categoryName: s.categoryName,
      clubLogoUrl: s.clubLogoUrl?.trim() || null,
      played: s.played,
      won: s.won,
      lost: s.lost,
      pointsFor: s.pointsFor,
      pointsAgainst: s.pointsAgainst,
      pointDiff: s.pointDiff,
      points: s.points,
    })),
    pendingGroupMatches,
  };
}
