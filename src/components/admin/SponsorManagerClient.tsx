"use client";

import { useState } from "react";
import { SponsorForm } from "./SponsorForm";
import { SponsorList } from "./SponsorList";
import { MassiveSponsorUpload } from "./MassiveSponsorUpload";
import { Sponsor } from "@/lib/types/sponsor";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Library } from "lucide-react";

interface SponsorManagerClientProps {
  leagues: { id: string; name: string }[];
  initialSponsors: Sponsor[];
  leagueMap: Record<string, string>;
}

export function SponsorManagerClient({ 
  leagues, 
  initialSponsors, 
  leagueMap 
}: SponsorManagerClientProps) {
  const [activeTab, setActiveTab] = useState<"individual" | "masivo">("individual");

  return (
    <div className="space-y-12">
      {/* ── Selector de Modo (Tabs) ── */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("individual")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "individual" 
                ? "bg-white text-[#005CEE] shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus size={14} />
            Individual
          </button>
          <button
            onClick={() => setActiveTab("masivo")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "masivo" 
                ? "bg-white text-[#005CEE] shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Library size={14} />
            Masivo
          </button>
        </div>
      </div>

      {/* ── Área de Registro ── */}
      <div className="max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === "individual" ? (
            <motion.div
              key="individual"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start"
            >
              <div className="xl:col-span-1">
                <div className="mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black">1</span>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Nuevo Patrocinador</h2>
                </div>
                <SponsorForm leagues={leagues} />
              </div>
              <div className="xl:col-span-2">
                <div className="mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black">2</span>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Lista de Control</h2>
                </div>
                <SponsorList sponsors={initialSponsors} leagueMap={leagueMap} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="masivo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Carga Masiva de Logos</h2>
                  <p className="text-sm text-slate-500 font-medium mt-2">Arrastra todos los patrocinadores de la temporada y procésalos en segundos.</p>
                </div>
                <MassiveSponsorUpload leagues={leagues} />
              </div>

              <div className="pt-10 border-t border-slate-100">
                <div className="mb-8 flex items-center justify-center gap-3">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Vista Previa de Activos</h2>
                </div>
                <SponsorList sponsors={initialSponsors} leagueMap={leagueMap} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
