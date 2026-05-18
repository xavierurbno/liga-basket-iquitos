"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LastPlayerDraft, PlayerInitialData } from "@/lib/types/player";
import {
  registrarJugadorAction,
  editarDeportistaAction,
} from "@/lib/actions/system-dashboard";

type PlayerGender = "MASCULINO" | "FEMENINO";

function inferDefaultGender(categoryName?: string): PlayerGender {
  if (!categoryName) return "FEMENINO";
  const u = categoryName.toUpperCase();
  if (/(FEMENIN|DAMA|DAMAS)/.test(u)) return "FEMENINO";
  if (/(MASCULIN|VARON|VARONES)/.test(u)) return "MASCULINO";
  return "FEMENINO";
}

export function RegistroMasivoDeportistasModal({
  clubId,
  categoryId,
  categoryName,
  mode = "create",
  initialData,
  triggerLabel,
  triggerClassName,
}: {
  clubId: string;
  categoryId: string;
  /** Nombre de la categoría (ej. U 11 MIXTO) para sugerir género por defecto */
  categoryName?: string;
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
  const [gender, setGender] = useState<PlayerGender>(() => inferDefaultGender(categoryName));
  const [birthdate, setBirthdate] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  
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

  const edadNum = birthdate ? parseInt(calcularEdad(birthdate), 10) : NaN;
  const isMinor = !Number.isNaN(edadNum) && edadNum < 18;

  useEffect(() => {
    if (!open) return;
    setGender(inferDefaultGender(categoryName));
    const t = setTimeout(() => apellidosRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open, categoryName]);

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
      setBirthdate(initialData.birthdate);
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
    fd.set("gender", gender);

    // Guardar borrador para el siguiente
    setLastPlayerDraft({
      documentType: String(fd.get("documentType") || "DNI"),
      documentNumber: String(fd.get("documentNumber") || ""),
      birthdate: String(fd.get("birthdate") || ""),
      lastname: String(fd.get("lastname") || ""),
      name: String(fd.get("name") || ""),
      contacto: String(fd.get("phone") || ""),
      numeroPolo: String(fd.get("jerseyNumber") || ""),
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
        setGender(inferDefaultGender(categoryName));
        setBirthdate("");
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
              className="flex max-h-[min(88vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#60A5FA] bg-[#F8FAFC] shadow-[0_25px_80px_-30px_rgba(59,130,246,0.65)]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#BFDBFE] px-4 py-3">
                <h2 className="text-base font-bold text-[#1e3a5f]">
                  {mode === "edit" ? "Editar Deportista" : "Registro Masivo"}
                </h2>
                <button
                  type="button"
                  onClick={closeAndRefresh}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>

              <form
                ref={formRef}
                noValidate
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveAndContinue();
                }}
              >
                <div className={`min-h-0 overflow-y-auto px-4 py-3 ${isMinor ? "max-h-[50vh]" : "max-h-[58vh]"}`}>
                {error && (
                  <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    ⚠️ {error}
                  </div>
                )}
                {ok && (
                  <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    ✓ {ok}
                  </div>
                )}

                <input type="hidden" name="categoryId" value={categoryId} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Apellidos *</label>
                    <input
                      ref={apellidosRef}
                      name="lastname"
                      required
                      placeholder="Apellidos"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Nombres *</label>
                    <input
                      ref={nombresRef}
                      name="name"
                      required
                      placeholder="Nombres"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Documento *</label>
                    <select
                      ref={docTypeRef}
                      name="documentType"
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
                      name="documentNumber"
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
                      name="birthdate"
                      required
                      onChange={(e) => {
                        setBirthdate(e.target.value);
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
                    <label className={labelClass}>Género *</label>
                    <select
                      name="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as PlayerGender)}
                      className={inputClass}
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                    </select>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      La categoría puede ser mixta; indica el género del deportista.
                    </p>
                  </div>
                  {!isMinor && (
                    <>
                      <div>
                        <label className={labelClass}>Contacto</label>
                        <input ref={contactoRef} name="phone" placeholder="987654321" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>N° de Polo</label>
                        <input
                          ref={numeroPoloRef}
                          name="jerseyNumber"
                          placeholder="Ej: 23"
                          inputMode="numeric"
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Foto (archivo)</label>
                        <input type="file" name="foto" accept="image/*" className={inputClass} />
                      </div>
                    </>
                  )}
                </div>

                {isMinor && (
                  <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                    <p className="text-xs font-bold text-amber-900">Apoderado (obligatorio — menor de 18)</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Nombre completo *</label>
                        <input name="tutorName" required className={inputClass} placeholder="Padre, madre o tutor legal" />
                      </div>
                      <div>
                        <label className={labelClass}>Tipo doc. *</label>
                        <select name="tutorDocumentType" defaultValue="DNI" required className={inputClass}>
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                          <option value="PASAPORTE">PASAPORTE</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>N° de documento *</label>
                        <input name="tutorDocumentNumber" required className={inputClass} placeholder="Documento del apoderado" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Celular apoderado *</label>
                        <input
                          name="tutorPhone"
                          required
                          className={inputClass}
                          placeholder="9 dígitos, ej. 987654321"
                          inputMode="tel"
                          maxLength={9}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExtras((v) => !v)}
                      className="text-xs font-semibold text-[#005CEE] hover:underline"
                    >
                      {showExtras ? "Ocultar opciones" : "+ Contacto, polo y foto (opcional)"}
                    </button>
                    {showExtras && (
                      <div className="grid gap-2 border-t border-amber-200/80 pt-2 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Contacto deportista</label>
                          <input ref={contactoRef} name="phone" placeholder="987654321" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>N° de polo</label>
                          <input ref={numeroPoloRef} name="jerseyNumber" placeholder="23" inputMode="numeric" className={inputClass} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Foto</label>
                          <input type="file" name="foto" accept="image/*" className={inputClass} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <input type="hidden" name="address" value="" />
                {mode === "edit" && (
                  <input type="hidden" name="fotoActual" value={initialData?.fotoActual ?? ""} />
                )}
                </div>

                <div className="flex shrink-0 items-center justify-between border-t border-[#BFDBFE] bg-[#F8FAFC] px-4 py-3">
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
