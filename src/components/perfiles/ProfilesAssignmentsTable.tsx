"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProfileAssignmentAction } from "@/actions/profile.actions";
import type { DelegateClubPickerOption } from "@/components/perfiles/PerfilesHubHeader";
import { ManageProfileFormPanel, type EditProfileInitial } from "@/components/perfiles/ManageProfileFormPanel";
import type { Role } from "@/lib/auth/withAuth";
import type { UserRole } from "@/lib/db/schema";

export type ProfileAssignmentRow = {
  assignmentKey: string;
  userId: string;
  leagueId: string | null;
  clubId: string | null;
  /** Liga del club cuando el rol es delegado (alcance para edición LEAGUE_ADMIN). */
  delegateClubLeagueId: string | null;
  displayName: string;
  email: string;
  role: UserRole;
};

function roleBadgeClasses(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-rose-100 text-rose-800 ring-rose-200";
    case "LEAGUE_ADMIN":
      return "bg-blue-100 text-blue-800 ring-blue-200";
    case "CLUB_DELEGATE":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super admin";
    case "LEAGUE_ADMIN":
      return "Admin de liga";
    case "CLUB_DELEGATE":
      return "Delegado";
    default:
      return role;
  }
}

export function canActorEditProfileRow(
  actorRole: Role | undefined,
  actorLeagueId: string | undefined,
  row: ProfileAssignmentRow,
): boolean {
  if (!actorRole) return false;
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole !== "LEAGUE_ADMIN") return false;
  const lid = actorLeagueId?.trim();
  if (!lid) return false;
  if (row.role !== "CLUB_DELEGATE" || !row.clubId) return false;
  return row.delegateClubLeagueId === lid;
}

type ProfilesAssignmentsTableProps = {
  rows: ProfileAssignmentRow[];
  canDelete: boolean;
  canEdit?: boolean;
  clubOptions?: DelegateClubPickerOption[];
  actorRole?: Role;
  actorLeagueId?: string | null;
};

export function ProfilesAssignmentsTable({
  rows,
  canDelete,
  canEdit = false,
  clubOptions = [],
  actorRole,
  actorLeagueId,
}: ProfilesAssignmentsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editInitial, setEditInitial] = useState<EditProfileInitial | null>(null);

  const showActionsColumn = Boolean(canDelete || canEdit);

  function openEdit(row: ProfileAssignmentRow) {
    if (!canActorEditProfileRow(actorRole, actorLeagueId ?? undefined, row)) return;
    setEditInitial({
      userId: row.userId,
      leagueId: row.leagueId,
      clubId: row.clubId,
      fullName: row.displayName,
      email: row.email,
      role: row.role as EditProfileInitial["role"],
    });
  }

  function handleDelete(row: ProfileAssignmentRow) {
    if (
      !confirm(
        `¿Eliminar por completo la cuenta de ${row.email} en Auth y su asignación? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProfileAssignmentAction({
        userId: row.userId,
        leagueId: row.leagueId,
        clubId: row.clubId,
      });

      if (result && typeof result === "object" && "error" in result && result.error) {
        toast.error(String(result.error));
        return;
      }

      if (result?.success === true) {
        toast.success(
          "message" in result && typeof result.message === "string"
            ? result.message
            : "Usuario eliminado.",
        );
        router.refresh();
        return;
      }

      const msg =
        result && typeof result === "object" && "message" in result && typeof result.message === "string"
          ? result.message
          : "No se pudo eliminar.";
      toast.error(msg);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#BFDBFE] bg-white shadow-[0_20px_50px_-35px_rgba(59,130,246,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#BFDBFE] bg-slate-50/90">
                <th className="px-4 py-3 font-black uppercase tracking-wider text-[11px] text-slate-500">
                  Nombre
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-wider text-[11px] text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 font-black uppercase tracking-wider text-[11px] text-slate-500">
                  Rol
                </th>
                {showActionsColumn ? (
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wider text-[11px] text-slate-500">
                    Acciones
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BFDBFE]/70">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActionsColumn ? 4 : 3}
                    className="px-4 py-12 text-center text-sm font-medium text-slate-500"
                  >
                    No hay asignaciones registradas.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const canEditRow = Boolean(
                    canEdit && canActorEditProfileRow(actorRole, actorLeagueId ?? undefined, r),
                  );
                  return (
                    <tr key={r.assignmentKey} className="transition hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.displayName}</td>
                      <td className="px-4 py-3 text-slate-600">{r.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ring-1 ring-inset ${roleBadgeClasses(r.role)}`}
                        >
                          {roleLabel(r.role)}
                        </span>
                      </td>
                      {showActionsColumn ? (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {canEditRow ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => openEdit(r)}
                                className="inline-flex items-center justify-center rounded-lg border border-[#BFDBFE] bg-white p-2 text-[#005CEE] transition hover:bg-blue-50 disabled:opacity-50"
                                title="Editar asignación y datos"
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                                <span className="sr-only">Editar</span>
                              </button>
                            ) : null}
                            {canDelete ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDelete(r)}
                                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                                title="Eliminar usuario y revocar acceso"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                                <span className="sr-only">Eliminar</span>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editInitial ? (
        <ManageProfileFormPanel
          key={`edit-${editInitial.userId}-${editInitial.leagueId ?? ""}-${editInitial.clubId ?? ""}`}
          mode="edit"
          editInitial={editInitial}
          clubOptions={clubOptions}
          onRequestClose={() => setEditInitial(null)}
        />
      ) : null}
    </>
  );
}
