"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createLeagueWizardAction, type CreateLeagueState } from "@/actions/leagues";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

const STEPS = [
  { id: 1, title: "Identidad", subtitle: "Nombre y URL pública" },
  { id: 2, title: "Temporada", subtitle: "Configuración inicial" },
  { id: 3, title: "Administrador", subtitle: "Primer LEAGUE_ADMIN" },
] as const;

const defaultSeasonName = () => `Temporada ${new Date().getFullYear()}`;

function hasValidationFieldErrors(state: CreateLeagueState): boolean {
  const e = state.errors;
  if (!e || typeof e !== "object") return false;
  return Object.values(e).some(
    (msgs) => Array.isArray(msgs) && msgs.some((m) => typeof m === "string" && m.length > 0),
  );
}

function CreateLeagueWizardPanel({ onRequestClose }: { onRequestClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, formAction, isPending] = useActionState(createLeagueWizardAction, {
    success: false,
  } as CreateLeagueState);

  const [leagueName, setLeagueName] = useState("");
  const [slugValue, setSlugValue] = useState("");
  const [seasonName, setSeasonName] = useState(defaultSeasonName);
  const [leagueKind, setLeagueKind] = useState<"federated" | "tournament">("tournament");
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [assignAdmin, setAssignAdmin] = useState(true);
  const successHandledRef = useRef(false);

  const fieldErrors = "errors" in state && state.errors ? state.errors : undefined;

  const slugify = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .slice(0, 50);

  const handleDismiss = useCallback(() => {
    onRequestClose();
  }, [onRequestClose]);

  useEffect(() => {
    if (!state.success || isPending || successHandledRef.current) return;
    successHandledRef.current = true;
    toast.success("message" in state && state.message ? state.message : "Liga creada");
    onRequestClose();
    if ("leagueId" in state && state.leagueId) {
      router.push(`/super-admin/leagues/${state.leagueId}/?onboarding=1`);
    } else {
      router.refresh();
    }
  }, [onRequestClose, state, isPending, router]);

  useEffect(() => {
    if (isPending) successHandledRef.current = false;
  }, [isPending]);

  useEffect(() => {
    if (isPending || state.success) return;

    if (fieldErrors?.name?.[0] || fieldErrors?.slug?.[0]) {
      setStep(1);
    } else if (fieldErrors?.adminFullName?.[0] || fieldErrors?.adminEmail?.[0]) {
      setStep(3);
    }

    const msg =
      ("error" in state && typeof state.error === "string" && state.error) ||
      ("message" in state && typeof state.message === "string" && state.message) ||
      null;

    if (msg && (!hasValidationFieldErrors(state) || msg.includes("administrador"))) {
      toast.error(msg);
    } else if (hasValidationFieldErrors(state) && msg) {
      toast.error(msg);
    }
  }, [isPending, state, fieldErrors]);

  const portalPreview = slugValue ? leaguePortalHome(slugValue) : "/l/tu-slug/";

  const canGoToStep2 = leagueName.trim().length >= 3 && slugValue.trim().length >= 3;

  const goNext = () => {
    if (step === 1 && !canGoToStep2) {
      toast.error("Indica el nombre de la liga (mín. 3 caracteres) y un slug válido.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">Nueva liga</h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              Paso {step} de {STEPS.length} · {STEPS[step - 1].title}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 px-8 pt-4">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s.id <= step ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <form action={formAction} className="space-y-6 p-8">
          {/* Siempre en el POST: los pasos 2–3 no montan los inputs de identidad */}
          <input type="hidden" name="name" value={leagueName} readOnly />
          <input type="hidden" name="slug" value={slugValue} readOnly />
          <input type="hidden" name="seasonName" value={seasonName} readOnly />
          <input type="hidden" name="leagueKind" value={leagueKind} readOnly />
          <input type="hidden" name="assignAdmin" value={assignAdmin ? "true" : "false"} />

          {!isPending && !state.success && "message" in state && state.message ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
            >
              {state.message}
            </div>
          ) : null}

          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <p className="text-sm font-medium text-slate-600">{STEPS[0].subtitle}</p>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nombre de la liga
                </label>
                <input
                  type="text"
                  required
                  value={leagueName}
                  placeholder="Ej: Liga de Basket de Yurimaguas"
                  onChange={(e) => {
                    const v = e.target.value;
                    setLeagueName(v);
                    if (!manuallyEdited) setSlugValue(slugify(v));
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                {fieldErrors?.name?.[0] ? (
                  <p className="ml-1 text-[10px] font-bold text-red-500">{fieldErrors.name[0]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Slug (URL pública)
                </label>
                <input
                  type="text"
                  required
                  value={slugValue}
                  onChange={(e) => {
                    setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    setManuallyEdited(true);
                  }}
                  placeholder="yurimaguas"
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                {fieldErrors?.slug?.[0] ? (
                  <p className="ml-1 text-[10px] font-bold text-red-500">{fieldErrors.slug[0]}</p>
                ) : null}
                <p className="ml-1 font-mono text-[10px] font-bold text-[#005CEE]">{portalPreview}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <p className="text-sm font-medium text-slate-600">{STEPS[1].subtitle}</p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-bold text-slate-800">{leagueName}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-mono text-xs">{portalPreview}</span>
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nombre de temporada
                </label>
                <input
                  type="text"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder={defaultSeasonName()}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div className="space-y-2">
                <p className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tipo de liga
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "tournament" as const,
                        title: "Torneo local",
                        hint: "Sin federación en carnet/PDF; serial y colores propios.",
                      },
                      {
                        value: "federated" as const,
                        title: "Liga federada",
                        hint: "Plantilla LDDBI: FDPB, firmas presidente y secretario.",
                      },
                    ] as const
                  ).map(({ value, title, hint }) => {
                    const active = leagueKind === value;
                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer flex-col rounded-2xl border px-4 py-3 transition ${
                          active
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="leagueKindChoice"
                          className="sr-only"
                          checked={active}
                          onChange={() => setLeagueKind(value)}
                        />
                        <span className="text-sm font-bold text-slate-800">{title}</span>
                        <span className="mt-1 text-xs text-slate-500">{hint}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-bold text-slate-800">{leagueName}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-mono text-xs">{portalPreview}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">
                Asigna quien operará la intranet <span className="font-mono text-xs">/liga/</span>.
                No se asigna SUPER_ADMIN.
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={assignAdmin}
                  onChange={(e) => setAssignAdmin(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Crear administrador de liga ahora
                </span>
              </label>
              {assignAdmin ? (
                <>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nombre completo
                    </label>
                    <input
                      name="adminFullName"
                      type="text"
                      required={assignAdmin}
                      className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold text-slate-700 outline-none transition focus:border-blue-500"
                    />
                    {fieldErrors?.adminFullName?.[0] ? (
                      <p className="ml-1 text-[10px] font-bold text-red-500">
                        {fieldErrors.adminFullName[0]}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Correo Gmail
                    </label>
                    <input
                      name="adminEmail"
                      type="email"
                      required={assignAdmin}
                      placeholder="admin@liga.pe"
                      className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold text-slate-700 outline-none transition focus:border-blue-500"
                    />
                    {fieldErrors?.adminEmail?.[0] ? (
                      <p className="ml-1 text-[10px] font-bold text-red-500">
                        {fieldErrors.adminEmail[0]}
                      </p>
                    ) : null}
                    <p className="ml-1 text-[10px] text-slate-400">
                      Si el correo es nuevo, recibirá invitación de Supabase para activar la cuenta.
                    </p>
                  </div>
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                  Podrás añadir un LEAGUE_ADMIN después desde la ficha de la liga o en{" "}
                  <span className="font-mono">/liga/perfiles/</span>.
                </p>
              )}
            </div>
          )}

          {isPending ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              <p className="text-sm font-semibold text-slate-600">Creando liga…</p>
            </div>
          ) : null}

          <div className={`flex gap-3 pt-2 ${isPending ? "hidden" : ""}`}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Atrás
              </button>
            ) : (
              <div className="flex-1" />
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-2xl bg-blue-600 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-blue-700"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending || !canGoToStep2}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-blue-700 disabled:bg-slate-200"
              >
                Crear liga
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const defaultTriggerClassName =
  "group relative flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-xl shadow-blue-200/50 transition-all hover:bg-blue-700 active:scale-95";

/** Wizard de alta de liga (3 pasos) para super-admin. */
export function CreateLeagueWizard({
  triggerLabel = "Nueva Liga",
  triggerClassName,
}: {
  triggerLabel?: string;
  triggerClassName?: string;
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const wasOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (isOpen && !wasOpenRef.current) setPanelKey((k) => k + 1);
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const btnClass = triggerClassName ?? defaultTriggerClassName;
  const isDefaultTrigger = !triggerClassName;

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={btnClass}>
        {isDefaultTrigger ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 transition-transform group-hover:rotate-90">
            <span className="text-lg leading-none" aria-hidden>
              +
            </span>
          </div>
        ) : null}
        <span>{triggerLabel}</span>
      </button>
      {isOpen && <CreateLeagueWizardPanel key={panelKey} onRequestClose={() => setIsOpen(false)} />}
    </>
  );
}
