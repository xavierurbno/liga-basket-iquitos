"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClubAction, updateClubAction } from "@/lib/actions/club.actions";
import type { Club } from "@/lib/db/schema";

type FormFields = {
  name: string;
  courtAddress: string;
  adminPhone: string;
  foundationDate: string;
  presidentName: string;
  presidentLastname: string;
  presidentDocumentType: string;
  presidentDni: string;
  presidentBirthdate: string;
  presidentContact: string;
  presidentEmail: string;
  secretaryName: string;
  secretaryLastname: string;
  secretaryDocumentType: string;
  secretaryDni: string;
  secretaryBirthdate: string;
  secretaryContact: string;
  secretaryEmail: string;
  treasurerName: string;
  treasurerLastname: string;
  treasurerDocumentType: string;
  treasurerDni: string;
  treasurerBirthdate: string;
  treasurerContact: string;
  treasurerEmail: string;
};

function toInputDate(v: Date | string | null | undefined): string {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return "";
}

function normalizeDocType(v: string | null | undefined): string {
  if (v === "CE" || v === "PASAPORTE") return v;
  return "DNI";
}

function defaultFormState(): FormFields {
  return {
    name: "",
    courtAddress: "",
    adminPhone: "",
    foundationDate: "",
    presidentName: "",
    presidentLastname: "",
    presidentDocumentType: "DNI",
    presidentDni: "",
    presidentBirthdate: "",
    presidentContact: "",
    presidentEmail: "",
    secretaryName: "",
    secretaryLastname: "",
    secretaryDocumentType: "DNI",
    secretaryDni: "",
    secretaryBirthdate: "",
    secretaryContact: "",
    secretaryEmail: "",
    treasurerName: "",
    treasurerLastname: "",
    treasurerDocumentType: "DNI",
    treasurerDni: "",
    treasurerBirthdate: "",
    treasurerContact: "",
    treasurerEmail: "",
  };
}

function formStateFromClub(c: Club): FormFields {
  return {
    name: c.name ?? "",
    courtAddress: c.courtAddress ?? "",
    adminPhone: c.adminPhone ?? "",
    foundationDate: toInputDate(c.foundationDate),
    presidentName: c.presidentName ?? "",
    presidentLastname: c.presidentLastname ?? "",
    presidentDocumentType: normalizeDocType(c.presidentDocumentType),
    presidentDni: c.presidentDocumentNumber ?? "",
    presidentBirthdate: toInputDate(c.presidentBirthdate),
    presidentContact: c.presidentContact ?? "",
    presidentEmail: c.presidentEmail ?? "",
    secretaryName: c.secretaryName ?? "",
    secretaryLastname: c.secretaryLastname ?? "",
    secretaryDocumentType: normalizeDocType(c.secretaryDocumentType),
    secretaryDni: c.secretaryDocumentNumber ?? "",
    secretaryBirthdate: toInputDate(c.secretaryBirthdate),
    secretaryContact: c.secretaryContact ?? "",
    secretaryEmail: c.secretaryEmail ?? "",
    treasurerName: c.treasurerName ?? "",
    treasurerLastname: c.treasurerLastname ?? "",
    treasurerDocumentType: normalizeDocType(c.treasurerDocumentType),
    treasurerDni: c.treasurerDocumentNumber ?? "",
    treasurerBirthdate: toInputDate(c.treasurerBirthdate),
    treasurerContact: c.treasurerContact ?? "",
    treasurerEmail: c.treasurerEmail ?? "",
  };
}

export type CrearClubFormProps = {
  onSuccess?: () => void;
  /** Si viene definido, el formulario actúa en modo edición y usa `updateClubAction`. */
  initialData?: Club | null;
};

export function CrearClubForm({ onSuccess, initialData }: CrearClubFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormFields>(() =>
    initialData ? formStateFromClub(initialData) : defaultFormState(),
  );

  function calcularAge(dateStr: string) {
    if (!dateStr) return "";
    const nacimiento = new Date(dateStr);
    if (Number.isNaN(nacimiento.getTime())) return "";
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return String(Math.max(edad, 0));
  }

  const edadPresidente = calcularAge(formState.presidentBirthdate);
  const edadSecretario = calcularAge(formState.secretaryBirthdate);
  const edadTesorero = calcularAge(formState.treasurerBirthdate);

  const [files, setFiles] = useState<{
    logoFile: File | null;
    presidentPhotoFile: File | null;
    secretaryPhotoFile: File | null;
    treasurerPhotoFile: File | null;
  }>({
    logoFile: null,
    presidentPhotoFile: null,
    secretaryPhotoFile: null,
    treasurerPhotoFile: null,
  });

  const canGoNextStep1 =
    formState.name.trim().length > 0 && formState.courtAddress.trim().length > 0;

  const steps = [
    { id: 1, label: "Club" },
    { id: 2, label: "Presidente" },
    { id: 3, label: "Secretario" },
    { id: 4, label: "Tesorero" },
  ] as const;

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]";
  const labelClass = "mb-1 block text-sm font-semibold text-slate-700";

  useEffect(() => {
    if (canGoNextStep1) setError(null);
  }, [canGoNextStep1]);

  function goToStep(targetStep: number) {
    if (targetStep > 1 && !canGoNextStep1) {
      setError("Nombre y dirección de cancha son obligatorios para continuar.");
      setStep(1);
      return;
    }
    setError(null);
    setStep(targetStep);
  }

  return (
    <form
      noValidate
      className="space-y-5 rounded-2xl border border-[#BFDBFE] bg-[#F5F5F5] p-5 shadow-[0_20px_45px_-35px_rgba(59,130,246,0.7)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canGoNextStep1) {
          setError("Nombre y dirección de cancha son obligatorios.");
          setStep(1);
          return;
        }

        const fd = new FormData();
        fd.set("nombre_club", formState.name);
        fd.set("direccion_cancha", formState.courtAddress);
        fd.set("telefono_admin", formState.adminPhone);
        fd.set("fecha_fundacion", formState.foundationDate);

        fd.set("nombre_presidente", formState.presidentName);
        fd.set("apellido_presidente", formState.presidentLastname);
        fd.set("document_type_presidente", formState.presidentDocumentType);
        fd.set("dni_presidente", formState.presidentDni);
        fd.set("fecha_nacimiento_presidente", formState.presidentBirthdate);
        fd.set("contacto_presidente", formState.presidentContact);
        fd.set("correo_presidente", formState.presidentEmail);

        fd.set("nombre_secretario", formState.secretaryName);
        fd.set("apellido_secretario", formState.secretaryLastname);
        fd.set("document_type_secretario", formState.secretaryDocumentType);
        fd.set("dni_secretario", formState.secretaryDni);
        fd.set("fecha_nacimiento_secretario", formState.secretaryBirthdate);
        fd.set("contacto_secretario", formState.secretaryContact);
        fd.set("correo_secretario", formState.secretaryEmail);

        fd.set("nombre_tesorero", formState.treasurerName);
        fd.set("apellido_tesorero", formState.treasurerLastname);
        fd.set("document_type_tesorero", formState.treasurerDocumentType);
        fd.set("dni_tesorero", formState.treasurerDni);
        fd.set("fecha_nacimiento_tesorero", formState.treasurerBirthdate);
        fd.set("contacto_tesorero", formState.treasurerContact);
        fd.set("correo_tesorero", formState.treasurerEmail);

        if (files.logoFile) fd.set("logoFile", files.logoFile);
        if (files.presidentPhotoFile) fd.set("presidentPhotoFile", files.presidentPhotoFile);
        if (files.secretaryPhotoFile) fd.set("secretaryPhotoFile", files.secretaryPhotoFile);
        if (files.treasurerPhotoFile) fd.set("treasurerPhotoFile", files.treasurerPhotoFile);

        if (isEdit && initialData) {
          fd.set("clubId", initialData.id);
        }

        setError(null);
        setOk(null);

        startTransition(async () => {
          try {
            const res = isEdit
              ? await updateClubAction(fd)
              : await createClubAction(fd);
            if (!res || typeof res !== "object" || !("success" in res)) {
              setError("Respuesta inválida del servidor.");
              return;
            }
            if (!res.success) {
              setError("error" in res ? res.error : "Error al guardar.");
              return;
            }
            setOk(isEdit ? "Cambios guardados correctamente." : "Club creado correctamente.");
            onSuccess?.();
            router.refresh();
            if (!isEdit && res.clubSlug) {
              router.push(`/${res.clubSlug}/`);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado al guardar.");
          }
        });
      }}
      encType="multipart/form-data"
    >
      <h2 className="text-lg font-bold text-[#1e3a5f]">{isEdit ? "Editar club" : "Crear Club"}</h2>

      <div className="flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white p-2">
        {steps.map((s) => {
          const active = step === s.id;
          const completed = step > s.id;
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
                    : completed
                      ? "bg-[#DBEAFE] text-[#1E3A8A]"
                      : "bg-[#EFF6FF] text-[#1D4ED8]"
              }`}
            >
              <span>{s.id}.</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#005CEE] transition-[width] duration-300 ease-out"
          style={{ width: `${(step / 4) * 100}%` }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={4}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[#005CEE]/20 bg-[#F5F5F5] p-4 text-sm font-medium text-[#005CEE] shadow-sm animate-shake">
          <span className="mr-2 font-bold uppercase tracking-wider">⚠️ Error:</span> {error}
        </div>
      )}
      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-[#F5F5F5] p-4 text-sm font-bold text-emerald-700 shadow-sm">
          ✓ {ok}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nombre del Club *</label>
            <input
              name="nombre_club"
              required
              value={formState.name}
              onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
              placeholder="Nombre del club"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Cancha Principal / Dirección *</label>
            <input
              name="direccion_cancha"
              required
              value={formState.courtAddress}
              onChange={(e) => setFormState((s) => ({ ...s, courtAddress: e.target.value }))}
              placeholder="Sede / dirección"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contacto Administrativo</label>
            <input
              name="telefono_admin"
              value={formState.adminPhone}
              onChange={(e) => setFormState((s) => ({ ...s, adminPhone: e.target.value }))}
              placeholder="Teléfono de contacto"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Logo del Club</label>
            {isEdit && initialData?.logoUrl ? (
              <p className="mb-1 text-xs text-slate-500">
                Logo actual guardado. Sube una imagen solo si deseas reemplazarlo.
              </p>
            ) : null}
            <input
              type="file"
              name="logoFile"
              accept="image/*"
              className={inputClass}
              onChange={(e) => setFiles((f) => ({ ...f, logoFile: e.target.files?.[0] ?? null }))}
            />
          </div>
          <div>
            <label className={labelClass}>Fecha de Fundación</label>
            <input
              type="date"
              name="fecha_fundacion"
              value={formState.foundationDate}
              onChange={(e) => setFormState((s) => ({ ...s, foundationDate: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos de Presidente (opcional)</p>
          {isEdit && initialData?.presidentPhotoUrl ? (
            <p className="text-xs text-slate-500">Foto actual en el sistema; sube archivo para reemplazar.</p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className={labelClass}>Nombre</label><input name="nombre_presidente" value={formState.presidentName} onChange={(e) => setFormState((s) => ({ ...s, presidentName: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Apellido</label><input name="apellido_presidente" value={formState.presidentLastname} onChange={(e) => setFormState((s) => ({ ...s, presidentLastname: e.target.value }))} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Tipo Doc.</label>
              <select value={formState.presidentDocumentType} onChange={(e) => setFormState((s) => ({ ...s, presidentDocumentType: e.target.value }))} className={inputClass}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </div>
            <div><label className={labelClass}>N° Documento</label><input name="dni_presidente" value={formState.presidentDni} onChange={(e) => setFormState((s) => ({ ...s, presidentDni: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" name="fecha_nacimiento_presidente" value={formState.presidentBirthdate} onChange={(e) => setFormState((s) => ({ ...s, presidentBirthdate: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Edad</label><input readOnly value={edadPresidente} placeholder="Automática" className={`${inputClass} bg-slate-50`} /></div>
            <div><label className={labelClass}>Contacto</label><input name="contacto_presidente" value={formState.presidentContact} onChange={(e) => setFormState((s) => ({ ...s, presidentContact: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Email</label><input name="correo_presidente" value={formState.presidentEmail} onChange={(e) => setFormState((s) => ({ ...s, presidentEmail: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Foto</label><input type="file" name="presidentPhotoFile" accept="image/*" className={inputClass} onChange={(e) => setFiles((f) => ({ ...f, presidentPhotoFile: e.target.files?.[0] ?? null }))} /></div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos de Secretario (opcional)</p>
          {isEdit && initialData?.secretaryPhotoUrl ? (
            <p className="text-xs text-slate-500">Foto actual en el sistema; sube archivo para reemplazar.</p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className={labelClass}>Nombre</label><input name="nombre_secretario" value={formState.secretaryName} onChange={(e) => setFormState((s) => ({ ...s, secretaryName: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Apellido</label><input name="apellido_secretario" value={formState.secretaryLastname} onChange={(e) => setFormState((s) => ({ ...s, secretaryLastname: e.target.value }))} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Tipo Doc.</label>
              <select value={formState.secretaryDocumentType} onChange={(e) => setFormState((s) => ({ ...s, secretaryDocumentType: e.target.value }))} className={inputClass}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </div>
            <div><label className={labelClass}>N° Documento</label><input name="dni_secretario" value={formState.secretaryDni} onChange={(e) => setFormState((s) => ({ ...s, secretaryDni: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" name="fecha_nacimiento_secretario" value={formState.secretaryBirthdate} onChange={(e) => setFormState((s) => ({ ...s, secretaryBirthdate: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Edad</label><input readOnly value={edadSecretario} placeholder="Automática" className={`${inputClass} bg-slate-50`} /></div>
            <div><label className={labelClass}>Contacto</label><input name="contacto_secretario" value={formState.secretaryContact} onChange={(e) => setFormState((s) => ({ ...s, secretaryContact: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Email</label><input name="correo_secretario" value={formState.secretaryEmail} onChange={(e) => setFormState((s) => ({ ...s, secretaryEmail: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Foto</label><input type="file" name="secretaryPhotoFile" accept="image/*" className={inputClass} onChange={(e) => setFiles((f) => ({ ...f, secretaryPhotoFile: e.target.files?.[0] ?? null }))} /></div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos de Tesorero (opcional)</p>
          {isEdit && initialData?.treasurerPhotoUrl ? (
            <p className="text-xs text-slate-500">Foto actual en el sistema; sube archivo para reemplazar.</p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className={labelClass}>Nombre</label><input name="nombre_tesorero" value={formState.treasurerName} onChange={(e) => setFormState((s) => ({ ...s, treasurerName: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Apellido</label><input name="apellido_tesorero" value={formState.treasurerLastname} onChange={(e) => setFormState((s) => ({ ...s, treasurerLastname: e.target.value }))} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Tipo Doc.</label>
              <select value={formState.treasurerDocumentType} onChange={(e) => setFormState((s) => ({ ...s, treasurerDocumentType: e.target.value }))} className={inputClass}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </div>
            <div><label className={labelClass}>N° Documento</label><input name="dni_tesorero" value={formState.treasurerDni} onChange={(e) => setFormState((s) => ({ ...s, treasurerDni: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" name="fecha_nacimiento_tesorero" value={formState.treasurerBirthdate} onChange={(e) => setFormState((s) => ({ ...s, treasurerBirthdate: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Edad</label><input readOnly value={edadTesorero} placeholder="Automática" className={`${inputClass} bg-slate-50`} /></div>
            <div><label className={labelClass}>Contacto</label><input name="contacto_tesorero" value={formState.treasurerContact} onChange={(e) => setFormState((s) => ({ ...s, treasurerContact: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Email</label><input name="correo_tesorero" value={formState.treasurerEmail} onChange={(e) => setFormState((s) => ({ ...s, treasurerEmail: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>Foto</label><input type="file" name="treasurerPhotoFile" accept="image/*" className={inputClass} onChange={(e) => setFiles((f) => ({ ...f, treasurerPhotoFile: e.target.files?.[0] ?? null }))} /></div>
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

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={step === 1 && !canGoNextStep1}
            className="rounded-xl bg-[#005CEE] px-8 py-3 text-sm font-bold tracking-wider text-white shadow-[0_10px_20px_-5px_rgba(0,92,238,0.4)] transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[#005CEE] px-8 py-3 text-sm font-bold tracking-wider text-white shadow-[0_10px_20px_-5px_rgba(0,92,238,0.4)] transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Finalizar y Crear Club"}
          </button>
        )}
      </div>
    </form>
  );
}
