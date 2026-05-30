"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Layers, Loader2, Search } from "lucide-react";
import Image from "next/image";
import {
  listarCategoriasBusqueda365,
  listarPlantillaPorCategoriaId,
} from "@/lib/actions/busqueda365";
import type {
  Busqueda365CategoriaOpcion,
  Busqueda365ClubBloque,
  Busqueda365JugadorSeguro,
} from "@/lib/actions/busqueda365";
import { PlayerDetailsModal } from "./PlayerDetailsModal";

import { actualizarEstadoJugadorBusqueda365Action } from "@/lib/actions/busqueda365-admin";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type ModalPlayer = {
  id: string;
  imageUrl: string | null;
  fullName: string;
  poloNumber: number | null;
  clubName: string;
  categoryLabel: string;
  status: string;
};

export function Busqueda365Client({
  leagueId,
  showQuickStatusEdit = false,
}: {
  leagueId: string;
  showQuickStatusEdit?: boolean;
}) {
  const [categorias, setCategorias] = useState<Busqueda365CategoriaOpcion[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [categoriaIdSel, setCategoriaIdSel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [clubs, setClubs] = useState<Busqueda365ClubBloque[]>([]);
  const [cargandoPlantilla, setCargandoPlantilla] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlayer, setModalPlayer] = useState<ModalPlayer | null>(null);
  const plantillaRequestRef = useRef(0);

  const onUpdateStatus = async (playerId: string, newStatus: any) => {
    if (!showQuickStatusEdit) return;
    const previousClubs = [...clubs];
    
    // Optimistic update
    setClubs((prev) =>
      prev.map((c) => ({
        ...c,
        players: c.players.map((p) =>
          p.id === playerId ? { ...p, status: newStatus } : p
        ),
      }))
    );

    const res = await actualizarEstadoJugadorBusqueda365Action(playerId, newStatus);
    if (!res.success) {
      setClubs(previousClubs);
      setError("No se pudo actualizar el estado. Reintentando...");
    }
  };

  useEffect(() => {
    let ok = true;
    (async () => {
      setCargandoCategorias(true);
      setError(null);
      const res = await listarCategoriasBusqueda365(leagueId);
      if (!ok) return;
      if (!res.success) {
        setError(res.error);
        setCategorias([]);
      } else {
        setCategorias(res.data);
      }
      setCargandoCategorias(false);
    })();
    return () => {
      ok = false;
    };
  }, [leagueId]);

  const cargarPlantilla = useCallback(async (categoryId: string, term: string = "") => {
    if (!categoryId) {
      setClubs([]);
      return;
    }
    const requestId = ++plantillaRequestRef.current;
    setError(null);
    setCargandoPlantilla(true);
    try {
      const res = await listarPlantillaPorCategoriaId(leagueId, categoryId, term);
      if (requestId !== plantillaRequestRef.current) return;
      if (!res.success) {
        setClubs([]);
        setError(res.error);
        return;
      }
      setClubs(res.clubs);
    } finally {
      if (requestId === plantillaRequestRef.current) {
        setCargandoPlantilla(false);
      }
    }
  }, [leagueId]);

  const onElegirCategoria = (id: string) => {
    setCategoriaIdSel(id);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (categoriaIdSel) {
        void cargarPlantilla(categoriaIdSel, searchTerm);
      } else {
        setClubs([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [categoriaIdSel, searchTerm, cargarPlantilla]);

  const openModal = (j: Busqueda365JugadorSeguro) => {
    setModalPlayer({
      id: j.id,
      imageUrl: j.imageUrl,
      fullName: j.fullName,
      poloNumber: j.poloNumber,
      clubName: j.clubName,
      categoryLabel: j.categoryLabel,
      status: j.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const totalJug = clubs.reduce((n, c) => n + c.players.length, 0);

  return (
    <div className="space-y-6" data-testid="busqueda365-root">
      <div className="rounded-2xl border border-indigo-300/35 bg-white/35 p-3 shadow-sm shadow-indigo-950/10 backdrop-blur-sm sm:p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Layers className="h-4 w-4 text-[#005CEE]" />
          Filtrar por categoría
        </div>

        <div className="relative mt-2">
          <label htmlFor="busq365-select-cat" className="sr-only">
            Seleccionar categoría
          </label>
          <select
            id="busq365-select-cat"
            data-testid="busqueda365-category-select"
            value={categoriaIdSel}
            onChange={(e) => onElegirCategoria(e.target.value)}
            disabled={cargandoCategorias || categorias.length === 0}
            className="w-full appearance-none rounded-xl border border-slate-200/90 bg-white/75 py-3 pl-4 pr-10 text-sm font-medium text-[#1e3a5f] shadow-inner outline-none focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/20 disabled:opacity-50"
          >
            <option value="">
              {cargandoCategorias
                ? "Cargando categorías…"
                : categorias.length === 0
                  ? "No hay categorías registradas"
                  : "Selecciona una categoría…"}
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clubName} · {c.nombreCategoria}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative mt-3">
          <label htmlFor="busq365-search" className="sr-only">
            Buscar jugador
          </label>
          <input
            id="busq365-search"
            type="search"
            placeholder="Buscar por nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!categoriaIdSel || cargandoCategorias}
            className="w-full rounded-xl border border-slate-200/90 bg-white/75 py-3 pl-10 pr-4 text-sm font-medium text-[#1e3a5f] shadow-inner outline-none focus:border-[#005CEE] focus:ring-2 focus:ring-[#005CEE]/20 disabled:opacity-50"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        {cargandoCategorias && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#005CEE]" />
            Cargando categorías…
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 backdrop-blur-sm">
          {error}
        </div>
      )}

      {cargandoPlantilla && (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-[#005CEE]" />
          Cargando plantilla…
        </p>
      )}

      {!cargandoPlantilla && categoriaIdSel && clubs.length > 0 && (
        <p className="text-center text-sm font-medium text-[#1e3a5f]">
          {totalJug} jugador{totalJug !== 1 ? "es" : ""}
        </p>
      )}

      {!cargandoPlantilla && categoriaIdSel && clubs.length === 0 && !error && (
        <p className="text-center text-sm text-slate-600">No hay deportistas asignados a esta categoría.</p>
      )}

      <div className="space-y-12">
        {clubs.map((bloque, ci) => (
          <section
            key={bloque.clubId}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backdrop-blur-[2px] sm:p-6"
          >
            <header className="mb-5 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-inner">
                {bloque.clubLogoUrl ? (
                  <Image
                    src={bloque.clubLogoUrl}
                    alt={bloque.clubName}
                    width={56}
                    height={56}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-lg font-bold text-[#1e3a5f]/40">
                    {initialsFromName(bloque.clubName)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#1e3a5f]">
                  {bloque.clubName}
                </h2>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[#005CEE]">
                  {bloque.equipoNombre}
                </p>
              </div>
            </header>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {bloque.players.map((j, ji) => (
                <li key={j.id} className="relative group">
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(ci * 0.04 + ji * 0.02, 0.35) }}
                    onClick={() => openModal(j)}
                    className="group flex w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-center shadow-md shadow-slate-200/50 ring-1 ring-slate-900/5 transition hover:border-[#005CEE]/30 hover:shadow-lg hover:shadow-[#005CEE]/10"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                      {j.imageUrl ? (
                        <Image
                          src={j.imageUrl}
                          alt={j.fullName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 120px, 200px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-bold text-slate-300">
                          {initialsFromName(j.fullName)}
                        </div>
                      )}
                      
                      {/* Badge de Estado */}
                      <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-tighter shadow-sm z-10 ${
                        j.status === "ACTIVO" ? "bg-green-500 text-white" :
                        j.status === "SUSPENDIDO" ? "bg-red-500 text-white" :
                        j.status === "INACTIVO" ? "bg-slate-500 text-white" :
                        "bg-amber-500 text-white"
                      }`}>
                        {j.status === "PENDIENTE_PAGO" ? "PENDIENTE" : j.status}
                      </div>
                    </div>
                    <p className="line-clamp-2 min-h-10 px-1.5 py-1.5 text-[10px] font-bold uppercase leading-tight text-[#1e3a5f] group-hover:text-[#005CEE] sm:text-[11px]">
                      {j.fullName}
                    </p>
                    <p className="pb-2 text-[10px] font-semibold tabular-nums text-slate-500 sm:text-xs">
                      N° {j.poloNumber != null ? j.poloNumber : "—"}
                    </p>
                  </motion.button>
                  
                  {showQuickStatusEdit && (
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <select 
                      value={j.status}
                      onChange={(e) => onUpdateStatus(j.id, e.target.value)}
                      className="bg-white/90 border border-slate-200 rounded text-[9px] font-bold p-0.5 cursor-pointer shadow-sm outline-none hover:border-[#005CEE]"
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="PENDIENTE_PAGO">PENDIENTE</option>
                      <option value="SUSPENDIDO">SUSP.</option>
                      <option value="INACTIVO">INACT.</option>
                    </select>
                  </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {modalPlayer && (
        <PlayerDetailsModal
          open={modalOpen}
          onClose={closeModal}
          imageUrl={modalPlayer.imageUrl}
          fullName={modalPlayer.fullName}
          poloNumber={modalPlayer.poloNumber}
          clubName={modalPlayer.clubName}
          categoryLabel={modalPlayer.categoryLabel}
        />
      )}
    </div>
  );
}
