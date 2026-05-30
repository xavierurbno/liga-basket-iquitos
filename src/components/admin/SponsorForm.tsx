"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { upsertSponsorAction } from "@/lib/actions/sponsors";
import { Sponsor } from "@/lib/types/sponsor";
import { ActionResult } from "@/lib/types/league";
import { CheckCircle, Upload, X } from "lucide-react";

interface SponsorFormProps {
  leagues: { id: string; name: string }[];
  sponsor?: Sponsor;
  onSuccess?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  SOCIOS_PATROCINADORES: "Socios Patrocinadores",
  PATR_TECNICO: "Patrocinador Técnico",
  PATROCINADORES_OFICIALES: "Patrocinadores Oficiales",
  PROVEEDORES: "Proveedores",
  INSTITUCIONALES: "Institucionales",
};

export function SponsorForm({ leagues, sponsor, onSuccess }: SponsorFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(sponsor?.logoUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  const [state, action, isPending] = useActionState(
    async (_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> => {
      // Inyectar el archivo real desde la referencia para evitar que se pierda
      if (selectedFileRef.current) {
        formData.set("logo", selectedFileRef.current);
      }
      
      const result = await upsertSponsorAction(formData);
      if (result.success && onSuccess) onSuccess();
      return result;
    },
    null
  );

  // Reset form on success
  useEffect(() => {
    if (state?.success && !sponsor) {
      formRef.current?.reset();
      setLogoPreview(null);
      setFileName(null);
      selectedFileRef.current = null;
    }
  }, [state?.success, sponsor]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedFileRef.current = file;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoPreview(null);
    setFileName(null);
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-5 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      {sponsor && <input type="hidden" name="id" value={sponsor.id} />}
      {sponsor && <input type="hidden" name="currentLogoUrl" value={sponsor.logoUrl} />}

      {/* Hidden File Input (Always Mounted) */}
      <input
        ref={fileInputRef}
        type="file"
        name="logo"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleLogoChange}
        className="hidden"
      />

      {/* Liga */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
          Liga
        </label>
        <select
          name="leagueId"
          defaultValue={sponsor?.leagueId || (leagues.length === 1 ? leagues[0].id : "")}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-4 focus:ring-[#005CEE]/10 focus:border-[#005CEE] transition-all"
          required
        >
          <option value="" disabled>Seleccionar Liga…</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Nombre */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
          Nombre del Patrocinador
        </label>
        <input
          type="text"
          name="name"
          defaultValue={sponsor?.name}
          placeholder="Ej: Nike, Municipalidad de Iquitos…"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-[#005CEE]/10 focus:border-[#005CEE] transition-all"
          required
        />
      </div>

      {/* Categoría */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
          Categoría
        </label>
        <select
          name="category"
          defaultValue={sponsor?.category || "PATROCINADORES_OFICIALES"}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-4 focus:ring-[#005CEE]/10 focus:border-[#005CEE] transition-all"
          required
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
          Sitio Web <span className="normal-case font-medium text-slate-400">(opcional)</span>
        </label>
        <input
          type="url"
          name="websiteUrl"
          defaultValue={sponsor?.websiteUrl || ""}
          placeholder="https://…"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-[#005CEE]/10 focus:border-[#005CEE] transition-all"
        />
      </div>

      {/* Orden */}
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
          Orden de Aparición
        </label>
        <input
          type="number"
          name="displayOrder"
          defaultValue={sponsor?.displayOrder ?? 0}
          min={0}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-4 focus:ring-[#005CEE]/10 focus:border-[#005CEE] transition-all"
        />
      </div>

      {/* Logo Display */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
          Logo {!sponsor && <span className="text-red-500">*</span>}
        </label>
        <p className="text-[11px] leading-snug text-slate-500 ml-1">
          Portal y pie estilo FEB (fondo negro): PNG <strong>blanco</strong> con fondo transparente.
        </p>

        {logoPreview ? (
          <div className="relative flex flex-col items-center gap-3 p-5 bg-slate-50 rounded-2xl border-2 border-[#005CEE]/20">
            <button
              type="button"
              onClick={clearLogo}
              className="absolute top-2 right-2 p-1 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
            >
              <X size={14} />
            </button>
            <img
              src={logoPreview}
              alt="Vista previa"
              className="h-20 w-auto max-w-full object-contain drop-shadow-sm"
            />
            <p className="text-[10px] font-bold text-slate-400 truncate max-w-full">{fileName || "Logo actual"}</p>
            <button 
              type="button"
              onClick={triggerFileInput}
              className="text-xs font-bold text-[#005CEE] hover:underline"
            >
              Cambiar logo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={triggerFileInput}
            className="w-full flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={20} className="text-[#005CEE]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Subir logo</p>
              <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WebP o SVG</p>
            </div>
          </button>
        )}
      </div>

      {/* Error */}
      {state?.success === false && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* Success */}
      {state?.success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" />
          Patrocinador guardado correctamente. El footer se actualizó.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 bg-[#005CEE] text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-[#004FCC] transition-all shadow-lg shadow-blue-100 hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Guardando…"
          : sponsor
          ? "Actualizar Patrocinador"
          : "Registrar Patrocinador"}
      </button>
    </form>
  );
}
