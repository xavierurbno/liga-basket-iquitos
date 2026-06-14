"use client";

import { useEffect, useState, useTransition } from "react";
import { CategoriaWizardInitialData } from "@/lib/types/category";
import {
  actualizarCategoriaAction,
  crearCategoriaAction,
} from "@/lib/actions/system-dashboard";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function asDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function calcularAge(transactionDate: string): string {
  if (!transactionDate) return "";
  const nacimiento = new Date(transactionDate);
  if (Number.isNaN(nacimiento.getTime())) return "";
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return String(Math.max(edad, 0));
}

export function CrearCategoriaForm({
  clubId,
  onSuccess,
  mode = "create",
  initialData,
  initialStep = 1,
}: {
  clubId: string;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  initialData?: CategoriaWizardInitialData;
  initialStep?: 1 | 2 | 3;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [step, setStep] = useState<number>(initialStep);
  const [formState, setFormState] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    coachLastname: initialData?.coachLastname ?? "",
    coachName: initialData?.coachName ?? "",
    coachDocumentType: initialData?.coachDocumentType ?? "DNI",
    coachDocumentNumber: initialData?.coachDocumentNumber ?? "",
    coachBirthdate: asDateInput(initialData?.coachBirthdate),
    coachContact: initialData?.coachContact ?? "",
    coachEmail: initialData?.coachEmail ?? "",
    delegateLastname: initialData?.delegateLastname ?? "",
    delegateName: initialData?.delegateName ?? "",
    delegateDocumentType: initialData?.delegateDocumentType ?? "DNI",
    delegateDocumentNumber: initialData?.delegateDocumentNumber ?? "",
    delegateBirthdate: asDateInput(initialData?.delegateBirthdate),
    delegateContact: initialData?.delegateContact ?? "",
    delegateEmail: initialData?.delegateEmail ?? "",
  });
  const [files, setFiles] = useState<{
    entrenadorFotoFile: File | null;
    delegadoFotoFile: File | null;
  }>({
    entrenadorFotoFile: null,
    delegadoFotoFile: null,
  });

  const canGoNextStep1 = formState.name.trim().length > 0;
  const steps = [
    { id: 1, label: "Categoría" },
    { id: 2, label: "Entrenador" },
    { id: 3, label: "Delegado" },
  ] as const;

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]";
  const labelClass = "mb-1 block text-sm font-semibold text-slate-700";

  useEffect(() => {
    if (canGoNextStep1) setError(null);
  }, [canGoNextStep1]);

  const edadCoach = calcularAge(formState.coachBirthdate);
  const edadDelegate = calcularAge(formState.delegateBirthdate);

  function goToStep(targetStep: number) {
    if (targetStep > 1 && !canGoNextStep1) {
      setError("Nombre de la categoría es obligatorio para continuar.");
      setStep(1);
      return;
    }
    setError(null);
    setStep(targetStep);
  }

  function mapClientActionError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    const lowered = msg.toLowerCase();
    if (lowered.includes("failed to fetch") || lowered.includes("err_connection_reset")) {
      return "Se perdió la conexión con el servidor (dev server reiniciando o red inestable). Vuelve a intentar en unos segundos.";
    }
    return msg || "Ocurrió un error inesperado al guardar la categoría.";
  }

  function isRetryableNetworkError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    const lowered = msg.toLowerCase();
    return lowered.includes("failed to fetch") || lowered.includes("err_connection_reset");
  }

  async function runCategoriaActionWithRetry(fd: FormData) {
    const run = () =>
      mode === "edit" ? actualizarCategoriaAction(fd) : crearCategoriaAction(fd);

    try {
      return await run();
    } catch (err) {
      if (!isRetryableNetworkError(err)) throw err;
      setRetrying(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      try {
        return await run();
      } finally {
        setRetrying(false);
      }
    }
  }

  function saveCategoria() {
    if (step !== 3) return;
    if (!canGoNextStep1) {
      setError("Nombre de la categoría es obligatorio para continuar.");
      setStep(1);
      return;
    }

    const fd = new FormData();
    fd.set("nombre_categoria", formState.name);
    fd.set("descripcion", formState.description);
    fd.set("apellido_entrenador", formState.coachLastname);
    fd.set("nombre_entrenador", formState.coachName);
    fd.set("document_type_entrenador", formState.coachDocumentType);
    fd.set("dni_entrenador", formState.coachDocumentNumber);
    fd.set("fecha_nacimiento_entrenador", formState.coachBirthdate);
    fd.set("contacto_entrenador", formState.coachContact);
    fd.set("correo_entrenador", formState.coachEmail);
    fd.set("apellido_delegado", formState.delegateLastname);
    fd.set("nombre_delegado", formState.delegateName);
    fd.set("document_type_delegado", formState.delegateDocumentType);
    fd.set("dni_delegado", formState.delegateDocumentNumber);
    fd.set("fecha_nacimiento_delegado", formState.delegateBirthdate);
    fd.set("contacto_delegado", formState.delegateContact);
    fd.set("correo_delegado", formState.delegateEmail);
    fd.set("clubId", clubId);
    if (mode === "edit" && initialData?.categoryId) {
      fd.set("categoryId", initialData.categoryId);
      fd.set("entrenadorFotoActual", initialData.coachPhotoUrl ?? "");
      fd.set("delegadoFotoActual", initialData.delegatePhotoUrl ?? "");
    }
    if (files.entrenadorFotoFile) fd.set("entrenadorFotoFile", files.entrenadorFotoFile);
    if (files.delegadoFotoFile) fd.set("delegadoFotoFile", files.delegadoFotoFile);
    setError(null);
    setOk(null);
    startTransition(async () => {
      try {
        const res = await runCategoriaActionWithRetry(fd);
        if (!res.success) {
          setError(res.error);
          return;
        }
        if (mode === "edit") {
          setOk("Categoría actualizada.");
          onSuccess?.();
          return;
        }
        setFormState({
          name: "",
          description: "",
          coachLastname: "",
          coachName: "",
          coachDocumentType: "DNI",
          coachDocumentNumber: "",
          coachBirthdate: "",
          coachContact: "",
          coachEmail: "",
          delegateLastname: "",
          delegateName: "",
          delegateDocumentType: "DNI",
          delegateDocumentNumber: "",
          delegateBirthdate: "",
          delegateContact: "",
          delegateEmail: "",
        });
        setFiles({
          entrenadorFotoFile: null,
          delegadoFotoFile: null,
        });
        setStep(1);
        setOk("Categoría creada.");
        onSuccess?.();
      } catch (err) {
        setError(mapClientActionError(err));
      }
    });
  }

  return (
    <form
      noValidate
      className="space-y-5 rounded-2xl border border-[#BFDBFE] bg-[#F5F5F5] p-5 shadow-[0_20px_45px_-35px_rgba(59,130,246,0.7)]"
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        const target = event.target as HTMLElement;
        if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;

        // Evitar que el Enter dispare el submit del formulario o cierre el modal
        event.preventDefault();
        event.stopPropagation();

        if (step === 1 && !canGoNextStep1) {
          setError("Nombre de la categoría es obligatorio para continuar.");
          return;
        }
        if (step < 3) {
          setStep((s) => s + 1);
          return;
        }
        saveCategoria();
      }}
      onSubmit={(event) => {
        event.preventDefault();
      }}
      encType="multipart/form-data"
    >
      <h2 className="text-lg font-bold text-[#1e3a5f]">
        {mode === "edit" ? "Editar Categoría" : "Crear Categoría"}
      </h2>

      {step === 1 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold text-amber-900">Distribución pedagógica institucional</p>
          <p className="mt-1 text-amber-900/90">
            Cada categoría contempla <strong>2 h</strong> de trabajo práctico en cancha y{" "}
            <strong>1 h</strong> de sesión teórica o de video-análisis, salvo indicación distinta de la liga.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#F8FAFC] p-2">
        {steps.map((s) => {
          const active = step === s.id;
          const blocked = s.id > 1 && !canGoNextStep1;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-[#005CEE] text-white shadow-lg shadow-blue-200"
                  : blocked
                  ? "bg-slate-100 text-slate-400 opacity-55"
                  : "bg-[#EFF6FF] text-[#1D4ED8]"
              }`}
            >
              <span>{s.id}.</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{ok}</p>}

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div>
            <label className={labelClass}>Nombre de la Categoría *</label>
            <input
              name="nombre_categoria"
              required
              placeholder="Ej: U14 Masculino"
              className={inputClass}
              value={formState.name}
              onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Descripción</label>
            <textarea
              name="descripcion"
              placeholder="Descripción (opcional)"
              className={inputClass}
              value={formState.description}
              onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Datos de Entrenador (opcional)
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className={labelClass}>Apellidos</label><input name="apellido_entrenador" placeholder="Apellidos del entrenador" value={formState.coachLastname} onChange={(e) => setFormState((s) => ({ ...s, coachLastname: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Nombres</label><input name="nombre_entrenador" placeholder="Nombres del entrenador" value={formState.coachName} onChange={(e) => setFormState((s) => ({ ...s, coachName: e.target.value }))} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Tipo Doc.</label>
              <select value={formState.coachDocumentType} onChange={(e) => setFormState((s) => ({ ...s, coachDocumentType: e.target.value }))} className={inputClass}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </div>
            <div><label className={labelClass}>N° Documento</label><input name="dni_entrenador" value={formState.coachDocumentNumber} onChange={(e) => setFormState((s) => ({ ...s, coachDocumentNumber: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" name="fecha_nacimiento_entrenador" value={formState.coachBirthdate} onChange={(e) => setFormState((s) => ({ ...s, coachBirthdate: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Edad</label><input readOnly value={edadCoach} placeholder="Automática" className={`${inputClass} bg-slate-50`} /></div>
            <div><label className={labelClass}>Contacto</label><input name="contacto_entrenador" value={formState.coachContact} onChange={(e) => setFormState((s) => ({ ...s, coachContact: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Email</label><input name="correo_entrenador" value={formState.coachEmail} onChange={(e) => setFormState((s) => ({ ...s, coachEmail: e.target.value }))} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Foto (archivo)</label>
              <input
                type="file"
                name="entrenadorFotoFile"
                accept="image/*"
                className={inputClass}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > MAX_UPLOAD_BYTES) {
                    setError("La imagen del entrenador supera 4MB. Comprime la foto e inténtalo de nuevo.");
                    e.currentTarget.value = "";
                    return;
                  }
                  setFiles((f) => ({ ...f, entrenadorFotoFile: file }));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Datos de Delegado (opcional)
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className={labelClass}>Apellidos</label><input name="apellido_delegado" placeholder="Apellidos del delegado" value={formState.delegateLastname} onChange={(e) => setFormState((s) => ({ ...s, delegateLastname: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Nombres</label><input name="nombre_delegado" placeholder="Nombres del delegado" value={formState.delegateName} onChange={(e) => setFormState((s) => ({ ...s, delegateName: e.target.value }))} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Tipo Doc.</label>
              <select value={formState.delegateDocumentType} onChange={(e) => setFormState((s) => ({ ...s, delegateDocumentType: e.target.value }))} className={inputClass}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </div>
            <div><label className={labelClass}>N° Documento</label><input name="dni_delegado" value={formState.delegateDocumentNumber} onChange={(e) => setFormState((s) => ({ ...s, delegateDocumentNumber: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" name="fecha_nacimiento_delegado" value={formState.delegateBirthdate} onChange={(e) => setFormState((s) => ({ ...s, delegateBirthdate: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Edad</label><input readOnly value={edadDelegate} placeholder="Automática" className={`${inputClass} bg-slate-50`} /></div>
            <div><label className={labelClass}>Contacto</label><input name="contacto_delegado" value={formState.delegateContact} onChange={(e) => setFormState((s) => ({ ...s, delegateContact: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Email</label><input name="correo_delegado" value={formState.delegateEmail} onChange={(e) => setFormState((s) => ({ ...s, delegateEmail: e.target.value }))} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Foto (archivo)</label>
              <input
                type="file"
                name="delegadoFotoFile"
                accept="image/*"
                className={inputClass}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > MAX_UPLOAD_BYTES) {
                    setError("La imagen del delegado supera 4MB. Comprime la foto e inténtalo de nuevo.");
                    e.currentTarget.value = "";
                    return;
                  }
                  setFiles((f) => ({ ...f, delegadoFotoFile: file }));
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-[#BFDBFE] pt-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className={`rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 ${
            step === 1 ? "invisible" : ""
          }`}
        >
          Atrás
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !canGoNextStep1) {
                setError("Nombre de la categoría es obligatorio para continuar.");
                return;
              }
              setStep((s) => Math.min(3, s + 1));
            }}
            disabled={step === 1 && !canGoNextStep1}
            className="rounded-xl bg-[#005CEE] px-8 py-3 text-sm font-bold tracking-wider text-white shadow-[0_10px_20px_-5px_rgba(0,92,238,0.4)] transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={saveCategoria}
            disabled={pending}
            className="rounded-xl bg-[#005CEE] px-8 py-3 text-sm font-bold tracking-wider text-white shadow-[0_10px_20px_-5px_rgba(0,92,238,0.4)] transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {pending
              ? retrying
                ? "Reconectando..."
                : "Guardando..."
              : mode === "edit"
              ? "Finalizar y Guardar Cambios"
              : "Finalizar y Crear Categoría"}
          </button>
        )}
      </div>
    </form>
  );
}
