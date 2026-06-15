"use client";

import { useMemo, useState, useTransition } from "react";
import { registrarJugadorAction } from "@/lib/actions/system-dashboard";
import { formatClientActionError, translateActionError } from "@/lib/errors/translate-action-error";

export function CrearJugadorCategoriaForm({
  clubId,
  categoryId,
}: {
  clubId: string;
  categoryId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [birthdate, setFechaNacimiento] = useState("");
  const [documentType, setDocumentType] = useState<"DNI" | "CE" | "PASAPORTE">("DNI");

  const edad = useMemo(() => {
    if (!birthdate) return "";
    const d = new Date(birthdate);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    let years = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
    return String(Math.max(years, 0));
  }, [birthdate]);

  const isMinor = useMemo(() => {
    const e = parseInt(edad);
    return !isNaN(e) && e < 18;
  }, [edad]);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]";
  const labelClass = "mb-1 block text-sm font-semibold text-slate-700";

  return (
    <form
      noValidate
      className="space-y-4 rounded-2xl border border-[#BFDBFE] bg-[#F5F5F5] p-5 shadow-lg"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fd = new FormData(form);
        
        fd.set("clubId", clubId);
        fd.set("categoryId", categoryId);
        
        setError(null);
        setOk(null);
        startTransition(async () => {
          try {
            const res = await registrarJugadorAction(fd);
            if (!res.success) {
              setError(translateActionError(res.error, "No se pudo registrar al jugador."));
              return;
            }
            form.reset();
            setFechaNacimiento("");
            setDocumentType("DNI");
            setOk("Jugador registrado con éxito.");
          } catch (err) {
            setError(formatClientActionError(err, "Error al registrar jugador."));
          }
        });
      }}
      encType="multipart/form-data"
    >
      <h2 className="text-lg font-bold text-[#1e3a5f]">Nuevo Jugador</h2>
      
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}
      {ok && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700 font-bold">
          ✓ {ok}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass}>Foto del Jugador</label>
          <input type="file" name="foto" accept="image/*" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Apellidos *</label>
          <input name="lastname" required placeholder="Apellidos" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nombres *</label>
          <input name="name" required placeholder="Nombres" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Tipo de Documento *</label>
          <select 
            name="documentType" 
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as any)}
            className={inputClass}
          >
            <option value="DNI">DNI (Perú)</option>
            <option value="CE">Carnet Extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>N° Documento Identidad *</label>
          <input 
            name="documentNumber" 
            required 
            placeholder={documentType === "DNI" ? "8 dígitos" : "Alfanumérico (8-15)"} 
            className={inputClass}
            maxLength={documentType === "DNI" ? 8 : 15}
          />
        </div>

        <div>
          <label className={labelClass}>Fecha de Nacimiento *</label>
          <input
            type="date"
            name="birthdate"
            required
            value={birthdate}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Edad</label>
          <input readOnly value={edad} placeholder="Automática" className={`${inputClass} bg-slate-50`} />
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input name="phone" placeholder="Teléfono" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Género</label>
          <select name="gender" className={inputClass} defaultValue="FEMENINO">
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Dirección</label>
          <input name="address" placeholder="Dirección de domicilio" className={inputClass} />
        </div>

        {isMinor && (
          <div className="md:col-span-2 mt-2 space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <h3 className="text-sm font-bold text-amber-800">
              Padre, madre o tutor legal (obligatorio — menor de 18 años)
            </h3>
            <p className="text-xs text-amber-800/90">
              Datos del apoderado para protección del menor y contacto de emergencia.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>Nombre completo *</label>
                <input
                  name="tutorName"
                  required
                  placeholder="Nombre del padre, madre o tutor"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo de documento *</label>
                <select name="tutorDocumentType" required className={inputClass} defaultValue="DNI">
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                  <option value="PASAPORTE">PASAPORTE</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>N° de documento *</label>
                <input
                  name="tutorDocumentNumber"
                  required
                  placeholder="Documento del apoderado"
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Teléfono de contacto *</label>
                <input
                  name="tutorPhone"
                  required
                  placeholder="Celular del padre, madre o tutor"
                  inputMode="tel"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-xl bg-[#005CEE] px-8 py-3 text-sm font-bold tracking-wider text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Registrar Jugador"}
      </button>
    </form>
  );
}
