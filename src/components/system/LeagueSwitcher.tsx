"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";

interface League {
  id: string;
  name: string;
  slug: string;
}

interface LeagueSwitcherProps {
  leagues: League[];
  activeSlug?: string;
}

export function LeagueSwitcher({ leagues, activeSlug }: LeagueSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeLeague = leagues.find((l) => l.slug === activeSlug) || leagues[0];

  const handleSwitch = (slug: string) => {
    // Establecer la cookie y recargar
    document.cookie = `active_league_slug=${slug}; path=/; max-age=${60 * 60 * 24 * 7}`;
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-95"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Globe size={14} />
        </div>
        <span className="max-w-[150px] truncate">{activeLeague?.name}</span>
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
              Cambiar de Liga
            </p>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => handleSwitch(league.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    league.slug === activeSlug
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">{league.name}</span>
                  {league.slug === activeSlug && <Check size={14} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
