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
import { createLeagueAction, type CreateLeagueState } from "@/actions/leagues";

type CreateLeagueModalPanelProps = {
  onRequestClose: () => void;
};

function hasValidationFieldErrors(state: CreateLeagueState): boolean {
  const e = state.errors;
  if (!e || typeof e !== "object") return false;
  return Object.values(e).some(
    (msgs) => Array.isArray(msgs) && msgs.some((m) => typeof m === "string" && m.length > 0)
  );
}

function shouldToastServerOrGlobalError(state: CreateLeagueState): boolean | string {
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

/**
 * Panel: encapsula `useActionState`. Montado con `key` controlada por el contenedor
 * para reiniciar el estado de la acción en cada apertura.
 */
function CreateLeagueModalPanel({ onRequestClose }: CreateLeagueModalPanelProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createLeagueAction,
    { success: false } as CreateLeagueState
  );

  const successHandledRef = useRef(false);
  const prevPendingRef = useRef(false);

  const fieldErrors = "errors" in state && state.errors ? state.errors : undefined;

  const [slugValue, setSlugValue] = useState("");
  const [manuallyEdited, setManuallyEdited] = useState(false);

  const closeModal = useCallback(() => {
    onRequestClose();
    setSlugValue("");
    setManuallyEdited(false);
  }, [onRequestClose]);

  useEffect(() => {
    if (isPending) {
      successHandledRef.current = false;
    }
  }, [isPending]);

  /** Errores distintos a validación de campos: servidor, permisos, slug duplicado, etc. → solo toast. */
  useEffect(() => {
    const finishedSubmit = prevPendingRef.current && !isPending;
    prevPendingRef.current = isPending;

    if (!finishedSubmit || state.success) return;

    const toastPayload = shouldToastServerOrGlobalError(state);
    if (typeof toastPayload === "string") {
      toast.error(toastPayload);
    }
  }, [isPending, state]);

  useEffect(() => {
    if (!state.success || isPending || successHandledRef.current) return;

    successHandledRef.current = true;

    const message =
      "message" in state && state.message ? state.message : "Liga creada correctamente";
    toast.success(message);

    closeModal();

    if ("leagueId" in state && state.leagueId) {
      router.push("/liga/");
    } else {
      router.refresh();
    }
  }, [closeModal, state, isPending, router]);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .slice(0, 50);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!manuallyEdited) {
      setSlugValue(slugify(e.target.value));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Crear Nueva Liga</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Configuración Inicial
            </p>
          </div>
          <button
            type="button"
            onClick={() => closeModal()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="p-8 space-y-6">
          {!state.success && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Nombre de la Liga
                </label>
                <input
                  name="name"
                  type="text"
                  onChange={handleNameChange}
                  placeholder="Ej: Liga de Basket de Loreto"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  required
                />
                {fieldErrors?.name?.[0] ? (
                  <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.name[0]}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Slug (URL)
                </label>
                <div className="relative">
                  <input
                    name="slug"
                    type="text"
                    value={slugValue}
                    onChange={(e) => {
                      setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                      setManuallyEdited(true);
                    }}
                    placeholder="liga-loreto"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 pl-12"
                    required
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                </div>
                {fieldErrors?.slug?.[0] ? (
                  <p className="text-[10px] text-red-500 font-bold ml-1">{fieldErrors.slug[0]}</p>
                ) : null}
                <p className="text-[9px] text-slate-400 font-bold ml-1 leading-tight">
                  Solo minúsculas, números y guiones. Será la URL: lddbi.com/tu-slug
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-blue-700 disabled:bg-slate-200 active:scale-95 shadow-lg shadow-blue-200/50 flex items-center justify-center gap-3"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>Crear Liga</span>
                  )}
                </button>
              </div>
            </>
          )}
          {state.success && (
            <div className="py-12 text-center text-sm font-semibold text-slate-500" aria-live="polite">
              Cerrando…
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/**
 * Contenedor: controla apertura y fuerza remontaje del panel (nuevo `useActionState`)
 * cuando el modal pasa de cerrado → abierto.
 */
const defaultTriggerClassName =
  "group relative flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-xl shadow-blue-200/50 transition-all hover:bg-blue-700 active:scale-95";

export function CreateLeagueModal({
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
    if (isOpen && !wasOpenRef.current) {
      setPanelKey((k) => k + 1);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const btnClass = triggerClassName ?? defaultTriggerClassName;
  const isDefaultTrigger = !triggerClassName;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={btnClass}
      >
        {isDefaultTrigger ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 transition-transform group-hover:rotate-90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        ) : null}
        <span>{triggerLabel}</span>
      </button>

      {isOpen && (
        <CreateLeagueModalPanel key={panelKey} onRequestClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
