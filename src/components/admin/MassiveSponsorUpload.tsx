"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bulkUpsertSponsorsAction } from "@/lib/actions/sponsors";
import { Upload, X, CheckCircle, Loader2, Building2, Layers } from "lucide-react";

interface MassiveSponsorUploadProps {
  leagues: { id: string; name: string }[];
}

interface PendingSponsor {
  id: string;
  file: File;
  preview: string;
  name: string;
  category: string;
  leagueId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  SOCIOS_PATROCINADORES: "Socios Patrocinadores",
  PATR_TECNICO: "Patrocinador Técnico",
  PATROCINADORES_OFICIALES: "Patrocinadores Oficiales",
  PROVEEDORES: "Proveedores",
  INSTITUCIONALES: "Institucionales",
};

export function MassiveSponsorUpload({ leagues }: MassiveSponsorUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingSponsors, setPendingSponsors] = useState<PendingSponsor[]>([]);
  const [globalLeague, setGlobalLeague] = useState(leagues.length > 0 ? leagues[0].id : "");
  const [globalCategory, setGlobalCategory] = useState("PATROCINADORES_OFICIALES");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSponsor: PendingSponsor = {
          id: crypto.randomUUID(),
          file,
          preview: reader.result as string,
          name: file.name.split(".")[0].replace(/[-_]/g, " "),
          category: globalCategory,
          leagueId: globalLeague,
        };
        setPendingSponsors((prev) => [...prev, newSponsor]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSponsor = (id: string) => {
    setPendingSponsors((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSponsor = (id: string, updates: Partial<PendingSponsor>) => {
    setPendingSponsors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const applyGlobalLeague = (leagueId: string) => {
    setGlobalLeague(leagueId);
    setPendingSponsors((prev) => prev.map((s) => ({ ...s, leagueId })));
  };

  const applyGlobalCategory = (category: string) => {
    setGlobalCategory(category);
    setPendingSponsors((prev) => prev.map((s) => ({ ...s, category })));
  };

  const handleUpload = async () => {
    if (pendingSponsors.length === 0) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();
      const metadata = pendingSponsors.map((s) => ({
        name: s.name,
        category: s.category,
        leagueId: s.leagueId,
        displayOrder: 0,
      }));

      pendingSponsors.forEach((s) => {
        formData.append("files", s.file);
      });
      formData.append("metadata", JSON.stringify(metadata));

      const result = await bulkUpsertSponsorsAction(formData);
      if (result.success) {
        setSuccess(true);
        setPendingSponsors([]);
      } else {
        setError(result.error || "Error en la subida masiva.");
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── Controles Globales ── */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Building2 size={12} className="text-[#005CEE]" />
            Asignar Liga a Todos
          </label>
          <select
            value={globalLeague}
            onChange={(e) => applyGlobalLeague(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-4 focus:ring-[#005CEE]/10 focus:border-[#005CEE] outline-none transition-all"
          >
            <option value="" disabled>Seleccionar Liga…</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <Layers size={12} className="text-[#005CEE]" />
            Asignar Categoría a Todos
          </label>
          <select
            value={globalCategory}
            onChange={(e) => applyGlobalCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-4 focus:ring-[#005CEE]/10 focus:border-[#005CEE] outline-none transition-all"
          >
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-[#005CEE] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#004FCC] transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          <Upload size={18} />
          Seleccionar Logos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* ── Grid de Previsualización ── */}
      <AnimatePresence mode="popLayout">
        {pendingSponsors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {pendingSponsors.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white rounded-3xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => removeSponsor(s.id)}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm flex items-center justify-center z-10 transition-all"
                >
                  <X size={14} strokeWidth={3} />
                </button>

                <div className="aspect-video w-full mb-4 bg-slate-50 rounded-2xl flex items-center justify-center p-4 border border-slate-100">
                  <img src={s.preview} alt={s.name} className="h-full w-auto object-contain drop-shadow-sm" />
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSponsor(s.id, { name: e.target.value })}
                    className="w-full text-xs font-black uppercase tracking-tight text-slate-900 border-b border-transparent focus:border-blue-500 outline-none pb-1 bg-transparent"
                    placeholder="Nombre..."
                  />
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría</span>
                    <select
                      value={s.category}
                      onChange={(e) => updateSponsor(s.id, { category: e.target.value })}
                      className="text-[10px] font-bold text-[#005CEE] bg-[#005CEE]/5 text-[#005CEE]"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Estado Vacío ── */}
      {pendingSponsors.length === 0 && !success && (
        <div className="py-20 text-center rounded-[3rem] border-4 border-dashed border-slate-100 bg-white/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Upload size={32} />
          </div>
          <p className="text-xl font-black text-slate-300 tracking-tighter">SUELTA LOS LOGOS AQUÍ</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            Puedes seleccionar varios archivos a la vez
          </p>
        </div>
      )}

      {/* ── Feedback y Acción Final ── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4">
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="mb-4 p-4 bg-emerald-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
            >
              <CheckCircle size={20} />
              ¡Subida masiva completada con éxito!
              <button onClick={() => setSuccess(false)} className="ml-auto text-white/60 hover:text-white">
                <X size={16} />
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="mb-4 p-4 bg-red-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
            >
              <X size={20} />
              {error}
            </motion.div>
          )}

          {pendingSponsors.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              onClick={handleUpload}
              disabled={isPending}
              className="w-full py-5 bg-[#005CEE] text-white rounded-[2rem] font-black text-base tracking-[0.2em] shadow-[0_20px_50px_-10px_rgba(0,92,238,0.4)] hover:bg-[#004FCC] hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale"
            >
              {isPending ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>PROCESANDO {pendingSponsors.length}...</span>
                </>
              ) : (
                <>
                  <span>CONFIRMAR {pendingSponsors.length} PATROCINADORES</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
