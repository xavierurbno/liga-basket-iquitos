"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { LeagueSettingsModal } from "@/components/system/LeagueSettingsModal";
import { LeagueSwitcher } from "@/components/system/LeagueSwitcher";

interface DashboardHeaderProps {
  leagues: { id: string; name: string; slug: string }[];
  activeSlug?: string;
  /** `public`: portal sin enlaces de administración interna. */
  variant?: "public" | "staff";
}

/**
 * Client wrapper for the Dashboard header section.
 * Hosts the Settings icon and the LeagueSettingsModal.
 */
export function DashboardHeader({ leagues, activeSlug, variant = "staff" }: DashboardHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isPublic = variant === "public";

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500">
            {isPublic ? "PORTAL INSTITUCIONAL" : "CENTRO DE CONTROL"}
          </p>
          <h2 className="mt-1 text-3xl font-black text-slate-900">
            {isPublic ? "Vista general" : "Dashboard Ejecutivo"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {isPublic
              ? "Explora carruseles y galerías por liga. Cambia de liga con el selector para ver otro contexto."
              : "Monitorea en tiempo real el crecimiento de clubes, categorías y deportistas en una sola vista."}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-3">
          <LeagueSwitcher leagues={leagues} activeSlug={activeSlug} />

          {!isPublic ? (
            <>
              <a
                href="/super-admin/leagues"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-black active:scale-95"
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span>Panel Super Admin</span>
              </a>

              <button
                id="league-settings-btn"
                onClick={() => setModalOpen(true)}
                aria-label="Configurar Reloj Maestro"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
                title="Configurar Mercado de Pases"
                type="button"
              >
                <Settings size={20} color="#005CEE" strokeWidth={2} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <LeagueSettingsModal isOpen={modalOpen && !isPublic} onClose={() => setModalOpen(false)} />
    </>
  );
}
