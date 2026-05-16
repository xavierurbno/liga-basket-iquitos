"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LastPlayerDraft, PlayerInitialData } from "@/lib/types/player";
import {
  registrarJugadorAction,
  editarDeportistaAction,
} from "@/lib/actions/system-dashboard";

export function RegistroMasivoDeportistasModal({
  clubId,
  categoryId,
  mode = "create",
  initialData,
  triggerLabel,
  triggerClassName,
}: {
  clubId: string;
  categoryId: string;
  mode?: "create" | "edit";
  initialData?: PlayerInitialData;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [lastPlayerDraft, setLastPlayerDraft] = useState<LastPlayerDraft | null>(null);
  const [currentDocType, setCurrentDocType] = useState("DNI");
  
  const formRef = useRef<HTMLFormElement | null>(null);
  const docTypeRef = useRef<HTMLSelectElement | null>(null);
  const docNumberRef = useRef<HTMLInputElement | null>(null);
  const fechaNacimientoRef = useRef<HTMLInputElement | null>(null);
  const apellidosRef = useRef<HTMLInputElement | null>(null);
  const nombresRef = useRef<HTMLInputElement | null>(null);
  const contactoRef = useRef<HTMLInputElement | null>(null);
  const numeroPoloRef = useRef<HTMLInputElement | null>(null);
  const edadRef = useRef<HTMLInputElement | null>(null);

  function calcularEdad(dateStr: string): string {
    if (!dateStr) return "";
    const nacimiento = new Date(dateStr);
    if (Number.isNaN(nacimiento.getTime())) return "";
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return String(Math.max(edad, 0));
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => apellidosRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (mode !== "edit" || !open || !initialData) return;
    const t = setTimeout(() => {
      if (docTypeRef.current) {
        docTypeRef.current.value = initialData.documentType;
        setCurrentDocType(initialData.documentType);
      }
      if (docNumberRef.current) docNumberRef.current.value = initialData.documentNumber;
      if (fechaNacimientoRef.current) fechaNacimientoRef.current.value = initialData.birthdate;
      if (apellidosRef.current) apellidosRef.current.value = initialData.lastname;
      if (nombresRef.current) nombresRef.current.value = initialData.name;
      if (contactoRef.current) contactoRef.current.value = initialData.contacto;
      if (numeroPoloRef.current) numeroPoloRef.current.value = initialData.numeroPolo;
      if (edadRef.current) edadRef.current.value = calcularEdad(initialData.birthdate);
    }, 100);
    return () => clearTimeout(t);
  }, [mode, open, initialData]);

  function closeAndRefresh() {
    setOpen(false);
    setError(null);
    setOk(null);
    router.refresh();
  }

  function loadPreviousPlayer() {
    if (!lastPlayerDraft) return;
    if (docTypeRef.current) {
      docTypeRef.current.value = lastPlayerDraft.documentType;
      setCurrentDocType(lastPlayerDraft.documentType);
    }
    if (docNumberRef.current) docNumberRef.current.value = lastPlayerDraft.documentNumber;
    if (fechaNacimientoRef.current) fechaNacimientoRef.current.value = lastPlayerDraft.birthdate;
    if (apellidosRef.current) apellidosRef.current.value = lastPlayerDraft.lastname;
    if (nombresRef.current) nombresRef.current.value = lastPlayerDraft.name;
    if (contactoRef.current) contactoRef.current.value = lastPlayerDraft.contacto;
    if (numeroPoloRef.current) numeroPoloRef.current.value = lastPlayerDraft.numeroPolo;
    if (edadRef.current) edadRef.current.value = calcularEdad(lastPlayerDraft.birthdate);
    setOk("Cargados datos del deportista anterior.");
    setError(null);
    apellidosRef.current?.focus();
  }

  function saveAndContinue() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    
    fd.set("clubId", clubId);
    fd.set("categoryId", categoryId);

    // Guardar borrador para el siguiente
    setLastPlayerDraft({
      documentType: String(fd.get("document_type") || "DNI"),
      documentNumber: String(fd.get("document_number") || ""),
      birthdate: String(fd.get("fecha_nacimiento") || ""),
      lastname: String(fd.get("apellidos") || ""),
      name: String(fd.get("nombres") || ""),
      contacto: String(fd.get("telefono") || ""),
      numeroPolo: String(fd.get("numeroPolo") || ""),
    });

    setError(null);
    setOk(null);
    startTransition(async () => {
      try {
        const res =
          mode === "edit" && initialData?.playerId
            ? await (() => {
                fd.set("playerId", initialData.playerId);
                return editarDeportistaAction(fd);
              })()
            : await registrarJugadorAction(fd);

        if (!res.success) {
          setError(res.error);
          return;
        }

        if (mode === "edit") {
          setOk("Deportista actualizado correctamente.");
          setTimeout(closeAndRefresh, 1000);
          return;
        }

        form.reset();
        setCurrentDocType("DNI");
        if (edadRef.current) edadRef.current.value = "";
        setOk("Deportista registrado. Continúa con el siguiente.");
        apellidosRef.current?.focus();
        router.refresh();
      } catch (err) {
        setError("Error al procesar el registro.");
      }
    });
  }

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]";
  const labelClass = "mb-1 block text-sm font-semibold text-slate-700";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? "inline-flex rounded-xl bg-[#005CEE] px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 shadow-blue-200"}
      >
        {triggerLabel ?? (mode === "edit" ? "Editar" : "Registro Masivo")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.18 }}
              className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#60A5FA] bg-[#F8FAFC] p-4 shadow-[0_25px_80px_-30px_rgba(59,130,246,0.65)]"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[#BFDBFE] pb-3">
                <h2 className="text-lg font-bold text-[#1e3a5f]">
                  {mode === "edit" ? "Editar Deportista" : "Registro Masivo de Deportistas"}
                </h2>
                <button
                  type="button"
                  onClick={closeAndRefresh}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>

              <form
                ref={formRef}
                noValidate
                className="space-y-5 rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveAndContinue();
                }}
              >
                {error && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 font-medium animate-shake">
                    ⚠️ {error}
                  </div>
                )}
                {ok && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700 font-bold">
                    ✓ {ok}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Apellidos *</label>
                    <input
                      ref={apellidosRef}
                      name="apellidos"
                      required
                      placeholder="Apellidos"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Nombres *</label>
                    <input
                      ref={nombresRef}
                      name="nombres"
                      required
                      placeholder="Nombres"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Documento *</label>
                    <select
                      ref={docTypeRef}
                      name="document_type"
                      className={inputClass}
                      onChange={(e) => setCurrentDocType(e.target.value)}
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">PASAPORTE</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>N° Documento Identidad *</label>
                    <input
                      ref={docNumberRef}
                      name="document_number"
                      required
                      placeholder={currentDocType === "DNI" ? "8 dígitos" : "Alfanumérico"}
                      autoComplete="off"
                      maxLength={currentDocType === "DNI" ? 8 : 20}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Fecha de Nacimiento *</label>
                    <input
                      ref={fechaNacimientoRef}
                      type="date"
                      name="fecha_nacimiento"
                      required
                      onChange={(e) => {
                        if (edadRef.current) edadRef.current.value = calcularEdad(e.target.value);
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Edad</label>
                    <input
                      ref={edadRef}
                      readOnly
                      placeholder="Automática"
                      className={`${inputClass} bg-slate-50`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Contacto</label>
                    <input
                      ref={contactoRef}
                      name="telefono"
                      placeholder="Celular o teléfono"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>N° de Polo</label>
                    <input
                      ref={numeroPoloRef}
                      name="numeroPolo"
                      placeholder="Ej: 23"
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Foto (archivo)</label>
                    <input
                      type="file"
                      name="foto_archivo"
                      accept="image/*"
                      className={inputClass}
                    />
                  </div>
                </div>

                <input type="hidden" name="genero" value="MIXTO" />
                <input type="hidden" name="direccion" value="" />
                {mode === "edit" && (
                  <input type="hidden" name="fotoActual" value={initialData?.fotoActual ?? ""} />
                )}

                <div className="flex items-center justify-between border-t border-[#BFDBFE] pt-5">
                  <div className="flex gap-2">
                    {mode === "create" && (
                      <button
                        type="button"
                        disabled={!lastPlayerDraft || pending}
                        onClick={loadPreviousPlayer}
                        title="Cargar jugador anterior"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        ←
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeAndRefresh}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Finalizar
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-[#005CEE] px-8 py-2 text-sm font-bold tracking-wide text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                  >
                    {pending
                      ? "Guardando..."
                      : mode === "edit"
                      ? "Guardar Cambios"
                      : "Guardar y Seguir"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
