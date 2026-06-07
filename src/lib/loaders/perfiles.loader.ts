import { clubRepository } from "@/repositories/clubRepository";
import {
  userAssignmentRepository,
  type AssignmentWithEmail,
} from "@/repositories/userAssignmentRepository";
import type { ProfileAssignmentRow } from "@/components/perfiles/ProfilesAssignmentsTable";

function displayNameFromAuthMeta(meta: unknown, email: string | null): string {
  if (meta && typeof meta === "object" && meta !== null && "full_name" in meta) {
    const fn = (meta as { full_name?: unknown }).full_name;
    if (typeof fn === "string" && fn.trim()) return fn.trim();
  }
  const normalized = email?.trim() ?? "";
  return normalized.split("@")[0] || "—";
}

function mapAssignmentRow(
  r: AssignmentWithEmail,
  delegateClubLeagueId: string | null,
): ProfileAssignmentRow {
  const email = r.email?.trim() ?? "";
  return {
    assignmentKey: `${r.userId}:${r.leagueId ?? ""}:${r.clubId ?? ""}`,
    userId: r.userId,
    leagueId: r.leagueId,
    clubId: r.clubId,
    delegateClubLeagueId,
    email,
    role: r.role,
    displayName: displayNameFromAuthMeta(r.rawUserMetaData, r.email),
  };
}

async function mapRowsWithClubLeagues(
  raw: AssignmentWithEmail[],
  fixedLeagueId?: string,
): Promise<ProfileAssignmentRow[]> {
  if (fixedLeagueId) {
    return raw.map((r) =>
      mapAssignmentRow(
        r,
        r.role === "CLUB_DELEGATE" && r.clubId ? fixedLeagueId : null,
      ),
    );
  }

  const clubIdsNeedingLeague = [
    ...new Set(
      raw
        .filter((r) => r.role === "CLUB_DELEGATE" && r.clubId)
        .map((r) => r.clubId as string),
    ),
  ];

  const clubLeagueById = new Map<string, string | null>();
  if (clubIdsNeedingLeague.length > 0) {
    const clubRows = await clubRepository.findLeagueIdsForClubIds(clubIdsNeedingLeague);
    for (const c of clubRows) {
      clubLeagueById.set(c.id, c.leagueId);
    }
  }

  return raw.map((r) =>
    mapAssignmentRow(
      r,
      r.role === "CLUB_DELEGATE" && r.clubId ? clubLeagueById.get(r.clubId) ?? null : null,
    ),
  );
}

export async function loadPerfilesPageData(
  leagueId: string,
  options?: { includeOrphans?: boolean },
) {
  const scopedLeagueId = leagueId.trim();
  const includeOrphans = options?.includeOrphans ?? false;

  const [leagueRaw, orphanRaw, clubRows] = await Promise.all([
    userAssignmentRepository.findForOperationalLeague(scopedLeagueId),
    includeOrphans
      ? userAssignmentRepository.findOrphansWithEmail()
      : Promise.resolve([] as AssignmentWithEmail[]),
    clubRepository.findByLeagueId(scopedLeagueId).then((rows) =>
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        leagueId: c.leagueId,
      })),
    ),
  ]);

  const [leagueRows, orphanRows] = await Promise.all([
    mapRowsWithClubLeagues(leagueRaw, scopedLeagueId),
    mapRowsWithClubLeagues(orphanRaw),
  ]);

  return { leagueRows, orphanRows, clubRows };
}
