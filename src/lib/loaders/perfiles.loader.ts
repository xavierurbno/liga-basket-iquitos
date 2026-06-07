import { clubRepository } from "@/repositories/clubRepository";
import { userAssignmentRepository } from "@/repositories/userAssignmentRepository";
import type { ProfileAssignmentRow } from "@/components/perfiles/ProfilesAssignmentsTable";

function displayNameFromAuthMeta(meta: unknown, email: string | null): string {
  if (meta && typeof meta === "object" && meta !== null && "full_name" in meta) {
    const fn = (meta as { full_name?: unknown }).full_name;
    if (typeof fn === "string" && fn.trim()) return fn.trim();
  }
  const normalized = email?.trim() ?? "";
  return normalized.split("@")[0] || "—";
}

async function buildAssignmentRows(): Promise<ProfileAssignmentRow[]> {
  const raw = await userAssignmentRepository.findAllWithEmail();

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

  return raw.map((r) => {
    const email = r.email?.trim() ?? "";
    const displayName = displayNameFromAuthMeta(r.rawUserMetaData, r.email);

    return {
      assignmentKey: `${r.userId}:${r.leagueId ?? ""}:${r.clubId ?? ""}`,
      userId: r.userId,
      leagueId: r.leagueId,
      clubId: r.clubId,
      delegateClubLeagueId:
        r.role === "CLUB_DELEGATE" && r.clubId ? clubLeagueById.get(r.clubId) ?? null : null,
      email,
      role: r.role,
      displayName,
    };
  });
}

export async function loadPerfilesPageData(leagueId?: string | null) {
  const scopedLeagueId = leagueId?.trim() || null;
  const [allRows, clubRows] = await Promise.all([
    buildAssignmentRows(),
    scopedLeagueId
      ? clubRepository.findByLeagueId(scopedLeagueId).then((rows) =>
          rows.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            leagueId: c.leagueId,
          })),
        )
      : clubRepository.findAllOrderedForPicker(),
  ]);
  return { allRows, clubRows };
}
