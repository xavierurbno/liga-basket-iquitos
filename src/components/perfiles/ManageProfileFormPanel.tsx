"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  createProfileAssignmentAction,
  updateProfileAssignmentAction,
  type CreateProfileAssignmentState,
} from "@/actions/profile.actions";
import type { DelegateClubPickerOption } from "./PerfilesHubHeader";

export type AssignableStaffRole = "SUPER_ADMIN" | "LEAGUE_ADMIN" | "CLUB_DELEGATE";

export type EditProfileInitial = {
  userId: string;
  leagueId: string | null;
  clubId: string | null;
  fullName: string;
  email: string;
  role: AssignableStaffRole;
};

export type ManageProfileFormPanelProps = {
  clubOptions: DelegateClubPickerOption[];
  onRequestClose: () => void;
  mode?: "create" | "edit";
  editInitial?: EditProfileInitial;
  defaultLeagueId?: string | null;
  leagueName?: string | null;
  actorRole?: string;
};

type ProfileAssignmentActionState =
  | CreateProfileAssignmentState
  | { success: false; error: string };

function hasValidationFieldErrors(state: ProfileAssignmentActionState): boolean {
  if (!("errors" in state)) return false;
  const e = state.errors;
  if (!e || typeof e !== "object") return false;
  return Object.values(e).some(
    (msgs) => Array.isArray(msgs) && msgs.some((m) => typeof m === "string" && m.length > 0),
  );
}

function toastPayloadForServerError(state: ProfileAssignmentActionState): string | false {
  if (state.success) return false;
  if (hasValidationFieldErrors(state)) return false;
  if ("error" in state && typeof state.error === "string" && state.error.trim() !== "") {
    return state.error;
  }
  if ("message" in state && typeof state.message === "string" && state.message.trim() !== "") {
    return state.message;
  }
  return false;
}

function defaultRoleForCreate(
  actorRole: string | undefined,
  defaultLeagueId: string | null | undefined,
): AssignableStaffRole {
  if (actorRole === "SUPER_ADMIN" && defaultLeagueId) return "LEAGUE_ADMIN";
  if (actorRole === "LEAGUE_ADMIN") return "LEAGUE_ADMIN";
  return "SUPER_ADMIN";
}

export function ManageProfileFormPanel({
  clubOptions,
  onRequestClose,
  mode = "create",
  editInitial,
  defaultLeagueId,
  leagueName,
  actorRole,
}: ManageProfileFormPanelProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && Boolean(editInitial);

  const formActionBinder = useCallback(
    (prevState: ProfileAssignmentActionState, formData: FormData): Promise<ProfileAssignmentActionState> => {
      if (isEdit) {
        return updateProfileAssignmentAction(prevState, formData);
      }
      return createProfileAssignmentAction(prevState, formData);
    },
    [isEdit],
  );

  const [state, formAction, isPending] = useActionState(
    formActionBinder,
    { success: false } as ProfileAssignmentActionState,
  );

  const successHandledRef = useRef(false);
  const prevPendingRef = useRef(false);

  const fieldErrors = "errors" in state ? state.errors : undefined;

  const [role, setRole] = useState<AssignableStaffRole>(
    editInitial?.role ?? defaultRoleForCreate(actorRole, defaultLeagueId),
  );

  const closeModal = useCallback(() => {
    onRequestClose();
    setRole(editInitial?.role ?? defaultRoleForCreate(actorRole, defaultLeagueId));
  }, [onRequestClose, editInitial?.role, actorRole, defaultLeagueId]);

  useEffect(() => {
    if (editInitial?.role) {
      setRole(editInitial.role);
    }
  }, [editInitial?.userId, editInitial?.role]);

  useEffect(() => {
    if (isPending) successHandledRef.current = false;
  }, [isPending]);

  useEffect(() => {
    const finishedSubmit = prevPendingRef.current && !isPending;
    prevPendingRef.current = isPending;

    if (!finishedSubmit || state.success) return;

    const payload = toastPayloadForServerError(state);
    if (typeof payload === "string") toast.error(payload);
  }, [isPending, state]);

  useEffect(() => {
    if (!state.success || isPending || successHandledRef.current) return;

    successHandledRef.current = true;

    const message =
      "message" in state && state.message
        ? state.message
        : isEdit
          ? "Perfil actualizado correctamente."
          : "Personal añadido correctamente.";
    toast.success(message);

    router.refresh();

    closeModal();
  }, [closeModal, isEdit, state, isPending, router]);

  if (isEdit && !editInitial) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-profile-title"
      onClick={() => closeModal()}
    >
      <div
        className="relative w-full max-w-lg rounded-4xl border border-[#BFDBFE] bg-white p-0 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.55)] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#BFDBFE] px-6 py-5">
          <div>
            <h2 id="manage-profile-title" className="text-xl font-black tracking-tight text-[#0f2040]">
              {isEdit ? "Editar personal" : "Añadir al personal"}
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isEdit
                ? "Actualiza nombre, rol o club del delegado sin cambiar el correo."
                : "Alta centralizada: los delegados se vinculan a un club real al guardar."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => closeModal()}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-5 px-6 py-6">
          {!state.success && (
            <>
              {isEdit && editInitial ? (
                <>
                  <input type="hidden" name="userId" value={editInitial.userId} />
                  <input
                    type="hidden"
                    name="oldLeagueId"
                    value={editInitial.leagueId ?? ""}
                  />
                  <input type="hidden" name="oldClubId" value={editInitial.clubId ?? ""} />

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Correo (no editable)
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={editInitial.email}
                      className="w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 outline-none"
                    />
                  </div>
                </>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  key={editInitial?.userId ?? "new-fullName"}
                  defaultValue={editInitial?.fullName}
                  placeholder="Ej: María Pérez García"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/15"
                />
                {fieldErrors?.fullName?.[0] ? (
                  <p className="text-[11px] font-bold text-red-600">{fieldErrors.fullName[0]}</p>
                ) : null}
              </div>

              {!isEdit ? (
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Correo electrónico (Gmail)
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="usuario@gmail.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/15"
                  />
                  {fieldErrors?.email?.[0] ? (
                    <p className="text-[11px] font-bold text-red-600">{fieldErrors.email[0]}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value as AssignableStaffRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/15"
                >
                  <option value="SUPER_ADMIN">Super administrador</option>
                  <option value="LEAGUE_ADMIN">Administrador de liga</option>
                  <option value="CLUB_DELEGATE">Delegado de club</option>
                </select>
                {fieldErrors?.role?.[0] ? (
                  <p className="text-[11px] font-bold text-red-600">{fieldErrors.role[0]}</p>
                ) : null}
              </div>

              {role === "LEAGUE_ADMIN" && defaultLeagueId ? (
                <div className="space-y-1.5 rounded-xl border border-[#BFDBFE] bg-blue-50/60 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Liga asignada
                  </p>
                  <p className="text-sm font-semibold text-[#0f2040]">
                    {leagueName ?? "Liga activa"}
                  </p>
                  <input type="hidden" name="leagueId" value={defaultLeagueId} />
                </div>
              ) : null}

              {role === "CLUB_DELEGATE" ? (
                <div className="space-y-1.5">
                  <label htmlFor="clubId" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Club asignado *
                  </label>
                  {clubOptions.length === 0 ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                      No hay clubes disponibles en tu contexto. Crea un club en «Clubes y categorías» antes de
                      invitar a un delegado.
                    </p>
                  ) : (
                    <select
                      id="clubId"
                      name="clubId"
                      required
                      key={`club-${editInitial?.clubId ?? "pick"}`}
                      defaultValue={editInitial?.clubId ?? ""}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/15"
                    >
                      {!editInitial?.clubId ? (
                        <option value="" disabled>
                          Selecciona un club…
                        </option>
                      ) : null}
                      {clubOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.slug})
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors?.clubId?.[0] ? (
                    <p className="text-[11px] font-bold text-red-600">{fieldErrors.clubId[0]}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isPending || (role === "CLUB_DELEGATE" && clubOptions.length === 0)}
                  className="w-full rounded-xl bg-[#005CEE] py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_12px_28px_-14px_rgba(0,92,238,0.85)] transition hover:brightness-110 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar asignación"}
                </button>
              </div>
            </>
          )}
          {state.success ? (
            <p className="py-8 text-center text-sm font-semibold text-slate-500" aria-live="polite">
              Cerrando…
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
