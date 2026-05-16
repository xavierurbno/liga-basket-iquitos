"use client";

import { deleteSponsorAction } from "@/lib/actions/sponsors";
import { Sponsor } from "@/lib/types/sponsor";
import { ExternalLink, Trash2, Building2 } from "lucide-react";
import { useState, useTransition } from "react";

interface SponsorListProps {
  sponsors: Sponsor[];
  leagueMap?: Record<string, string>; // id → name
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  SOCIOS_PATROCINADORES:   { label: "Socio Patrocinador",    color: "bg-violet-100 text-violet-700" },
  PATR_TECNICO:            { label: "Patrocinador Técnico",   color: "bg-sky-100 text-sky-700" },
  PATROCINADORES_OFICIALES:{ label: "Patrocinador Oficial",   color: "bg-[#005CEE]/10 text-[#005CEE]" },
  PROVEEDORES:             { label: "Proveedor",              color: "bg-amber-100 text-amber-700" },
  INSTITUCIONALES:         { label: "Institucional",          color: "bg-emerald-100 text-emerald-700" },
};

export function SponsorList({ sponsors, leagueMap = {} }: SponsorListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este patrocinador? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteSponsorAction(id);
      setDeletingId(null);
    });
  };

  if (sponsors.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 text-center">
        <Building2 size={40} className="text-slate-200" />
        <div>
          <p className="text-base font-bold text-slate-400">No hay patrocinadores registrados</p>
          <p className="text-sm text-slate-300 mt-1">Agrega el primero usando el formulario.</p>
        </div>
      </div>
    );
  }

  // Agrupar por categoría para mejor visualización
  const grouped = sponsors.reduce((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  const categoryOrder = [
    "SOCIOS_PATROCINADORES",
    "PATR_TECNICO",
    "PATROCINADORES_OFICIALES",
    "PROVEEDORES",
    "INSTITUCIONALES",
  ];

  return (
    <div className="space-y-8">
      {categoryOrder
        .filter((cat) => grouped[cat]?.length)
        .map((category) => {
          const items = grouped[category];
          const meta = CATEGORY_LABELS[category];

          return (
            <div key={category} className="space-y-3">
              {/* Encabezado de categoría */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-xs font-bold text-slate-300">{items.length}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Tabla */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Logo</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Liga</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Orden</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((s) => (
                      <tr
                        key={s.id}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Logo */}
                        <td className="px-5 py-3">
                          <div className="w-12 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
                            <img
                              src={s.logoUrl}
                              alt={s.name}
                              className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                          </div>
                        </td>

                        {/* Nombre */}
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          {s.websiteUrl && (
                            <a
                              href={s.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#005CEE] hover:text-[#004FCC] mt-0.5 uppercase tracking-wider"
                            >
                              Web <ExternalLink size={9} />
                            </a>
                          )}
                        </td>

                        {/* Liga */}
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs font-semibold text-slate-500">
                            {leagueMap[s.leagueId] || s.leagueId.slice(0, 8) + "…"}
                          </span>
                        </td>

                        {/* Orden */}
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                            {s.displayOrder}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id || isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-bold disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">
                              {deletingId === s.id ? "…" : "Eliminar"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </div>
  );
}
