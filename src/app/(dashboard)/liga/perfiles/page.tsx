import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, inArray } from "drizzle-orm";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db/client";
import { clubs } from "@/lib/db/schema";
import { PerfilesHubHeader, type DelegateClubPickerOption } from "@/components/perfiles/PerfilesHubHeader";
import {
  ProfilesAssignmentsTable,
  type ProfileAssignmentRow,
} from "@/components/perfiles/ProfilesAssignmentsTable";
import type { Role } from "@/lib/auth/withAuth";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import { userAssignmentRepository } from "@/repositories/userAssignmentRepository";

export const dynamic = "force-dynamic";

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
    const clubRows = await db
      .select({ id: clubs.id, leagueId: clubs.leagueId })
      .from(clubs)
      .where(inArray(clubs.id, clubIdsNeedingLeague));
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
    /* Sin SERVICE_ROLE u otros errores: fallback al prefijo del correo */
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

export default async function LigaPerfilesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/");
  }

  const role = user.app_metadata?.role as Role | undefined;
  if (role !== "SUPER_ADMIN" && role !== "LEAGUE_ADMIN") {
    redirect("/liga/");
  }

  const tableRows = await buildAssignmentRows();

  const canManageDestructive = role === "SUPER_ADMIN";
  const canInviteStaff = role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";

  const clubRows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      slug: clubs.slug,
      leagueId: clubs.leagueId,
    })
    .from(clubs)
    .orderBy(asc(clubs.name));

  const leagueIdFromMeta =
    typeof user.app_metadata?.league_id === "string" ? user.app_metadata.league_id.trim() : "";

  const clubOptionsForPicker: DelegateClubPickerOption[] =
    role === "LEAGUE_ADMIN" && leagueIdFromMeta
      ? clubRows.filter((c) => c.leagueId === leagueIdFromMeta).map(({ id, name, slug }) => ({ id, name, slug }))
      : clubRows.map(({ id, name, slug }) => ({ id, name, slug }));

  return (
    <div className="space-y-8 pb-12">
      <PerfilesHubHeader canInviteStaff={canInviteStaff} clubOptions={clubOptionsForPicker} />

      <ProfilesAssignmentsTable
        rows={tableRows}
        canDelete={canManageDestructive}
        canEdit={canInviteStaff}
        clubOptions={clubOptionsForPicker}
        actorRole={role}
        actorLeagueId={
          typeof user.app_metadata?.league_id === "string" ? user.app_metadata.league_id : null
        }
      />
    </div>
  );
}
