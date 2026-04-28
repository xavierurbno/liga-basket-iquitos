/**
 * ============================================================
 * FORMULARIO DE INSCRIPCIÓN DE JUGADOR
 * ============================================================
 * Componente cliente con:
 * - react-hook-form + zodResolver para validación en tiempo real
 * - Preview de foto antes de subir
 * - Campos condicionales (tutor aparece solo si es menor de 18)
 * - Integración con Server Action para submit sin API routes
 * - Estados de carga y errores descriptivos
 * ============================================================
 */

"use client";

import { useState, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { registroJugadorSchema, type RegistroJugadorForm } from "@/lib/validations/schemas";
import { registrarJugadorAction } from "@/lib/actions/jugadores";

interface RegistroJugadorFormProps {
  clubId: string;
  clubSlug: string;
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

// Clases CSS reutilizables para inputs
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
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [esMenor, setEsMenor] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<RegistroJugadorForm>({
    resolver: zodResolver(registroJugadorSchema),
    mode: "onChange", // Valida en tiempo real mientras el usuario escribe
  });

  // Observamos la fecha de nacimiento para mostrar/ocultar campos de tutor
  const fechaNacimiento = watch("fechaNacimiento");

  const handleFechaNacimientoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = new Date(e.target.value);
    if (!isNaN(fecha.getTime())) {
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      setEsMenor(edad < 18);
    }
  };

  // Manejamos la selección de foto y generamos preview
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("foto", file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Submit: pasamos el FormData a la Server Action
  const onSubmit = async (data: RegistroJugadorForm) => {
    setServerError(null);

    if (!formRef.current) return;

    startTransition(async () => {
      const formData = new FormData(formRef.current!);

      const result = await registrarJugadorAction(clubId, clubSlug, formData);

      if (result && !result.success) {
        setServerError("Verifica los datos e inténtalo nuevamente.");
      }
      // Si el registro fue exitoso, la action hace redirect() internamente
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
      encType="multipart/form-data"
      noValidate
    >

      {/* ══════════════════════════════════════════════════════
          SECCIÓN 1: FOTO DEL JUGADOR
          ══════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          📷 Foto de Carnet
        </h3>

        <div className="flex items-center gap-6">
          {/* Preview circular */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden hover:border-[var(--club-primary)] transition-colors shrink-0 group"
          >
            {fotoPreview ? (
              <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <span className="text-2xl block">👤</span>
                <span className="text-xs text-slate-400 group-hover:text-slate-600 mt-1 block">
                  Subir foto
                </span>
              </div>
            )}
          </button>

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Seleccionar imagen
            </button>
            <p className="text-xs text-slate-400 mt-2">JPG, PNG o WEBP · Máximo 5MB</p>
            {errors.foto && (
              <p className="text-xs text-red-500 mt-1">⚠ {errors.foto.message}</p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            name="foto"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="hidden"
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECCIÓN 2: DATOS PERSONALES
          ══════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          👤 Datos Personales
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nombres" required error={errors.nombres?.message}>
            <input
              {...register("nombres")}
              name="nombres"
              type="text"
              placeholder="Ej: Carlos Andrés"
              className={`${INPUT_BASE} ${errors.nombres ? INPUT_ERROR : ""}`}
            />
          </FormField>

          <FormField label="Apellidos" required error={errors.apellidos?.message}>
            <input
              {...register("apellidos")}
              name="apellidos"
              type="text"
              placeholder="Ej: Ramirez Torres"
              className={`${INPUT_BASE} ${errors.apellidos ? INPUT_ERROR : ""}`}
            />
          </FormField>

          <FormField
            label="DNI"
            required
            error={errors.dni?.message}
            hint="8 dígitos sin puntos ni guiones"
          >
            <input
              {...register("dni")}
              name="dni"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="12345678"
              className={`${INPUT_BASE} ${errors.dni ? INPUT_ERROR : ""}`}
            />
          </FormField>

          <FormField label="Fecha de Nacimiento" required error={errors.fechaNacimiento?.message}>
            <input
              {...register("fechaNacimiento", {
                onChange: handleFechaNacimientoChange,
              })}
              name="fechaNacimiento"
              type="date"
              className={`${INPUT_BASE} ${errors.fechaNacimiento ? INPUT_ERROR : ""}`}
            />
          </FormField>

          <FormField label="Género" required error={errors.genero?.message}>
            <select
              {...register("genero")}
              name="genero"
              className={`${SELECT_BASE} ${errors.genero ? INPUT_ERROR : ""}`}
            >
              <option value="">Seleccionar...</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </FormField>

          <FormField label="Teléfono" error={errors.telefono?.message} hint="Número de celular (9 dígitos)">
            <input
              {...register("telefono")}
              name="telefono"
              type="tel"
              inputMode="numeric"
              placeholder="987654321"
              className={`${INPUT_BASE} ${errors.telefono ? INPUT_ERROR : ""}`}
            />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <input
              {...register("email")}
              name="email"
              type="email"
              placeholder="jugador@email.com"
              className={`${INPUT_BASE} ${errors.email ? INPUT_ERROR : ""}`}
            />
          </FormField>

          <FormField label="Dirección" error={errors.direccion?.message}>
            <input
              {...register("direccion")}
              name="direccion"
              type="text"
              placeholder="Jr. Putumayo 123, Iquitos"
              className={`${INPUT_BASE} ${errors.direccion ? INPUT_ERROR : ""}`}
            />
          </FormField>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECCIÓN 3: DATOS DEPORTIVOS
          ══════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          🏀 Datos Deportivos
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FormField label="Posición">
            <select
              {...register("posicion")}
              name="posicion"
              className={SELECT_BASE}
            >
              <option value="">—</option>
              <option value="BASE">Base (1)</option>
              <option value="ESCOLTA">Escolta (2)</option>
              <option value="ALERO">Alero (3)</option>
              <option value="ALA-PIVOT">Ala-Pívot (4)</option>
              <option value="PIVOT">Pívot (5)</option>
            </select>
          </FormField>

          <FormField label="N° Camiseta" error={errors.numeroCamiseta?.message}>
            <input
              {...register("numeroCamiseta", { valueAsNumber: true })}
              name="numeroCamiseta"
              type="number"
              min={0}
              max={99}
              placeholder="00"
              className={INPUT_BASE}
            />
          </FormField>

          <FormField label="Talla">
            <select {...register("talla")} name="talla" className={SELECT_BASE}>
              <option value="">—</option>
              {["XS", "S", "M", "L", "XL", "XXL"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Grupo Sanguíneo">
            <select
              {...register("grupoSanguineo")}
              name="grupoSanguineo"
              className={SELECT_BASE}
            >
              <option value="">—</option>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <FormField label="Contacto de Emergencia" error={errors.contactoEmergencia?.message}>
            <input
              {...register("contactoEmergencia")}
              name="contactoEmergencia"
              type="tel"
              placeholder="987654321"
              className={INPUT_BASE}
            />
          </FormField>

          <FormField label="Alergias conocidas">
            <input
              {...register("alergias")}
              name="alergias"
              type="text"
              placeholder="Penicilina, Ibuprofeno, etc. (dejar vacío si ninguna)"
              className={INPUT_BASE}
            />
          </FormField>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECCIÓN 4: DATOS DEL TUTOR (solo si es menor de 18)
          Animación suave de aparición/desaparición con Framer Motion
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {esMenor && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span>ℹ️</span>
                El jugador es menor de edad. Se requieren los datos del tutor o apoderado legal.
              </p>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              👨👦 Datos del Tutor / Apoderado
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField
                label="Nombre completo del tutor"
                required
                error={errors.nombreTutor?.message}
              >
                <input
                  {...register("nombreTutor")}
                  name="nombreTutor"
                  type="text"
                  placeholder="Nombre y apellidos"
                  className={`${INPUT_BASE} ${errors.nombreTutor ? INPUT_ERROR : ""}`}
                />
              </FormField>

              <FormField
                label="DNI del tutor"
                required
                error={errors.dniTutor?.message}
              >
                <input
                  {...register("dniTutor")}
                  name="dniTutor"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="12345678"
                  className={`${INPUT_BASE} ${errors.dniTutor ? INPUT_ERROR : ""}`}
                />
              </FormField>

              <FormField
                label="Teléfono del tutor"
                required
                error={errors.telefonoTutor?.message}
              >
                <input
                  {...register("telefonoTutor")}
                  name="telefonoTutor"
                  type="tel"
                  placeholder="987654321"
                  className={`${INPUT_BASE} ${errors.telefonoTutor ? INPUT_ERROR : ""}`}
                />
              </FormField>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── ERROR GLOBAL DE SERVIDOR ── */}
      {serverError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-700 dark:text-red-300">⚠️ {serverError}</p>
        </div>
      )}

      {/* ── BOTONES DE ACCIÓN ── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <a
          href={`/dashboard/${clubSlug}/jugadores`}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </a>

        <button
          type="submit"
          disabled={isPending}
          className="relative px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Registrando...
            </span>
          ) : (
            "✓ Inscribir Jugador"
          )}
        </button>
      </div>
    </form>
  );
}
