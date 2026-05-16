/**
 * ============================================================
 * FORMULARIO DE INSCRIPCIÓN DE JUGADOR (ATÓMICO)
 * ============================================================
 */

"use client";

import { useState, useRef, useMemo, useEffect, useActionState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  registroJugadorSchema,
  type RegistroJugadorForm,
  type RegistroJugadorFormInput,
} from "@/lib/validations/schemas";
import { registrarJugadorAction } from "@/lib/actions/system-dashboard";
import { calcularEdadAnios } from "@/lib/utils/category";

interface RegistroJugadorFormProps {
  clubId: string;
  clubSlug: string;
}

interface ActionState {
  success: boolean;
  playerId?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Campo de formulario reutilizable
// ─────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function FormField({ label, error, required, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <span>⚠</span> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const INPUT_BASE = `
  w-full px-3 py-2 rounded-lg text-sm border transition-colors
  bg-white dark:bg-slate-800
  border-slate-300 dark:border-slate-600
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  focus:outline-none focus:ring-2 focus:ring-[var(--club-primary,#1e3a5f)] focus:border-transparent
`;
const INPUT_ERROR = "border-red-400 focus:ring-red-400";
const SELECT_BASE = INPUT_BASE + " cursor-pointer";

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export function RegistroJugadorForm({ clubId, clubSlug }: RegistroJugadorFormProps) {
  const router = useRouter();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Integración con useActionState
  const [state, formAction, isPending] = useActionState<any, FormData>(
    registrarJugadorAction as any,
    { success: false }
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistroJugadorFormInput, unknown, RegistroJugadorForm>({
    resolver: zodResolver(
      registroJugadorSchema
    ) as Resolver<RegistroJugadorFormInput, unknown, RegistroJugadorForm>,
    mode: "onChange",
  });

  const birthdate = useWatch({ control, name: "birthdate" });

  const esMenor = useMemo(() => {
    if (!birthdate) return false;
    const d = birthdate instanceof Date ? birthdate : new Date(birthdate as unknown as string);
    if (Number.isNaN(d.getTime())) return false;
    return calcularEdadAnios(d) < 18;
  }, [birthdate]);

  useEffect(() => {
    if (state.success) {
      setSuccessMessage("¡Jugador registrado exitosamente! La base de datos y los archivos están sincronizados.");
      setServerError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFotoPreview(null);
      reset();

      const timeout = setTimeout(() => {
        router.push(`/${clubSlug}/players/${state.playerId}`);
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (state.error) {
      setServerError(state.error);
      setSuccessMessage(null);
    }
  }, [state, clubSlug, router, reset]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("foto", file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onValidSubmit = handleSubmit((_data, event) => {
    const form = event?.target as HTMLFormElement;
    if (!form) return;
    const formData = new FormData(form);
    formData.append("clubId", clubId);
    
    // Llamada manual a la acción de useActionState
    // Usamos startTransition si es necesario o simplemente formAction
    formAction(formData);
  });

  return (
    <form
      onSubmit={onValidSubmit}
      className="space-y-8"
      encType="multipart/form-data"
      noValidate
    >
      {/* SECCIÓN 1: FOTO DEL JUGADOR */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          📷 Foto de Carnet
        </h3>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden hover:border-(--club-primary) transition-colors shrink-0 group"
          >
            {fotoPreview ? (
              <Image src={fotoPreview} alt="Preview" fill className="object-cover" unoptimized />
            ) : (
              <div className="text-center">
                <span className="text-2xl block">👤</span>
                <span className="text-xs text-slate-400 group-hover:text-slate-600 mt-1 block">Subir foto</span>
              </div>
            )}
          </button>

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              Seleccionar imagen
            </button>
            <p className="text-xs text-slate-400 mt-2">JPG, PNG o WEBP · Máximo 5MB</p>
            {errors.foto && <p className="text-xs text-red-500 mt-1">⚠ {errors.foto.message}</p>}
          </div>

          <input ref={fileInputRef} type="file" name="foto" accept="image/*" onChange={handleFotoChange} className="hidden" />
        </div>
      </section>

      {/* SECCIÓN 2: DATOS PERSONALES */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
          👤 Datos Personales
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nombres" required error={errors.name?.message}>
            <input {...register("name")} type="text" className={`${INPUT_BASE} ${errors.name ? INPUT_ERROR : ""}`} />
          </FormField>
          <FormField label="Apellidos" required error={errors.lastname?.message}>
            <input {...register("lastname")} type="text" className={`${INPUT_BASE} ${errors.lastname ? INPUT_ERROR : ""}`} />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Tipo Doc." required error={errors.documentType?.message}>
              <select {...register("documentType")} className={SELECT_BASE}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
              </select>
            </FormField>
            <div className="col-span-2">
              <FormField label="N° de Documento" required error={errors.documentNumber?.message}>
                <input {...register("documentNumber")} type="text" className={`${INPUT_BASE} ${errors.documentNumber ? INPUT_ERROR : ""}`} />
              </FormField>
            </div>
          </div>

          <FormField label="Fecha de Nacimiento" required error={errors.birthdate?.message}>
            <input {...register("birthdate")} type="date" className={`${INPUT_BASE} ${errors.birthdate ? INPUT_ERROR : ""}`} />
          </FormField>

          <FormField label="Género" required error={errors.gender?.message}>
            <select {...register("gender")} className={SELECT_BASE}>
              <option value="">Seleccionar...</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </FormField>

          <FormField label="Teléfono" error={errors.phone?.message}>
            <input {...register("phone")} type="tel" className={INPUT_BASE} />
          </FormField>
        </div>
      </section>

      {/* SECCIÓN 3: DATOS DEPORTIVOS */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
          🏀 Datos Deportivos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FormField label="Posición">
            <select {...register("position")} className={SELECT_BASE}>
              <option value="">—</option>
              <option value="BASE">Base (1)</option>
              <option value="ESCOLTA">Escolta (2)</option>
              <option value="ALERO">Alero (3)</option>
              <option value="ALA-PIVOT">Ala-Pívot (4)</option>
              <option value="PIVOT">Pívot (5)</option>
            </select>
          </FormField>
          <FormField label="N° Camiseta" error={errors.jerseyNumber?.message}>
            <input {...register("jerseyNumber", { valueAsNumber: true })} type="number" className={INPUT_BASE} />
          </FormField>
          <FormField label="Talla">
            <select {...register("size")} className={SELECT_BASE}>
              <option value="">—</option>
              {["XS", "S", "M", "L", "XL", "XXL"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Grupo Sanguíneo">
            <select {...register("bloodType")} className={SELECT_BASE}>
              <option value="">—</option>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>
        </div>
      </section>

      {/* SECCIÓN 4: TUTOR */}
      <AnimatePresence>
        {esMenor && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-700">
              ℹ️ Jugador menor de edad. Se requieren datos del tutor.
            </div>
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <FormField label="Nombre tutor" required error={errors.tutorName?.message}>
                  <input {...register("tutorName")} type="text" className={INPUT_BASE} />
                </FormField>
              </div>
              <FormField label="Tipo Doc." required error={errors.tutorDocumentType?.message}>
                <select {...register("tutorDocumentType")} className={SELECT_BASE}><option value="DNI">DNI</option></select>
              </FormField>
              <FormField label="Documento" required error={errors.tutorDocumentNumber?.message}>
                <input {...register("tutorDocumentNumber")} type="text" className={INPUT_BASE} />
              </FormField>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* BANNERS */}
      {serverError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">⚠️ {serverError}</div>}
      {successMessage && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">✅ {successMessage}</div>}

      {/* BOTONES */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-700">Cancelar</button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#1e3a5f] disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isPending ? "Registrando..." : "✓ Inscribir Jugador"}
        </button>
      </div>
    </form>
  );
}
