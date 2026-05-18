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
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { SelectActiveLeaguePrompt } from "@/components/liga/SelectActiveLeaguePrompt";
import { leagueRepository } from "@/repositories/league.repository";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import { userAssignmentRepository } from "@/repositories/userAssignmentRepository";

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

function filterRowsForOperationalLeague(
  rows: ProfileAssignmentRow[],
  operationalLeagueId: string,
): ProfileAssignmentRow[] {
  return rows.filter((r) => {
    if (r.role === "SUPER_ADMIN") return true;
    if (r.role === "LEAGUE_ADMIN") return r.leagueId === operationalLeagueId;
    if (r.role === "CLUB_DELEGATE") {
      return r.delegateClubLeagueId === operationalLeagueId;
    }
    return false;
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

  const operationalLeagueId = resolveOperationalLeagueId(user, cookieStore);

  if (role === "LEAGUE_ADMIN" && !operationalLeagueId) {
    return (
      <SelectActiveLeaguePrompt role={role} leagues={[]} title="Liga no asignada" />
    );
  }

  if (role === "SUPER_ADMIN" && !operationalLeagueId) {
    const leagues = await leagueRepository.findAll();
    return (
      <SelectActiveLeaguePrompt
        role={role}
        leagues={leagues}
        title="Selecciona una liga para gestionar perfiles"
        description="Los administradores de liga y delegados se asignan en el contexto de una liga activa."
      />
    );
  }

  const leagueName = operationalLeagueId
    ? (await leagueRepository.findById(operationalLeagueId))?.name ?? null
    : null;

  const allRows = await buildAssignmentRows();
  const tableRows =
    role === "SUPER_ADMIN" && operationalLeagueId
      ? filterRowsForOperationalLeague(allRows, operationalLeagueId)
      : allRows;

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

  const clubOptionsForPicker: DelegateClubPickerOption[] = operationalLeagueId
    ? clubRows
        .filter((c) => c.leagueId === operationalLeagueId)
        .map(({ id, name, slug }) => ({ id, name, slug }))
    : [];

  return (
    <div className="space-y-8 pb-12">
      {leagueName ? (
        <p className="text-sm text-slate-600">
          Liga activa: <strong className="text-[#0f2040]">{leagueName}</strong>
          {role === "SUPER_ADMIN" ? (
            <span className="text-slate-500">
              {" "}
              · al crear un administrador de liga se usará esta liga por defecto
            </span>
          ) : null}
        </p>
      ) : null}

      <PerfilesHubHeader
        canInviteStaff={canInviteStaff}
        clubOptions={clubOptionsForPicker}
        defaultLeagueId={operationalLeagueId}
        leagueName={leagueName}
        actorRole={role}
      />

      <ProfilesAssignmentsTable
        rows={tableRows}
        canDelete={canManageDestructive}
        canEdit={canInviteStaff}
        clubOptions={clubOptionsForPicker}
        actorRole={role}
        actorLeagueId={operationalLeagueId}
        defaultLeagueId={operationalLeagueId}
        leagueName={leagueName}
      />
    </div>
  );
}
