import { clubRepository } from "@/repositories/clubRepository";
import { userAssignmentRepository } from "@/repositories/userAssignmentRepository";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import type { ProfileAssignmentRow } from "@/components/perfiles/ProfilesAssignmentsTable";

async function buildAssignmentRows(): Promise<ProfileAssignmentRow[]> {
  const raw = await userAssignmentRepository.findAllWithEmail();
  const uniqueUserIds = [...new Set(raw.map((r) => r.userId))];

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

  const displayByUserId = new Map<string, string>();

  try {
    const admin = getSupabaseAdmin();
    await Promise.all(
      uniqueUserIds.map(async (uid) => {
        const { data, error } = await admin.auth.admin.getUserById(uid);
        if (error || !data?.user) return;
        const meta = data.user.user_metadata;
        if (meta && typeof meta === "object" && meta !== null && "full_name" in meta) {
          const fn = (meta as { full_name?: unknown }).full_name;
          if (typeof fn === "string" && fn.trim()) {
            displayByUserId.set(uid, fn.trim());
          }
        }
      }),
    );
  } catch {
    /* Sin SERVICE_ROLE: fallback al prefijo del correo */
  }

  return raw.map((r) => {
    const email = r.email?.trim() ?? "";
    const fromAuth = displayByUserId.get(r.userId)?.trim() ?? "";
    const displayName =
      fromAuth.length > 0 ? fromAuth : email.split("@")[0] || "—";

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

export async function loadPerfilesPageData() {
  const [allRows, clubRows] = await Promise.all([
    buildAssignmentRows(),
    clubRepository.findAllOrderedForPicker(),
  ]);
  return { allRows, clubRows };
}
