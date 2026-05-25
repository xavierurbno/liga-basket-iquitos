"use client";

import { useMemo } from "react";
import { calcularEdad } from "@/lib/utils/age";
import {
  FICHA_COLUMNAS_TABLA,
  FICHA_T1,
  FICHA_T3,
  resolveFichaLeagueTitle,
} from "@/lib/pdf/fichaInstitucionalTextos";

import { FichaVistaPreviaJugador, FichaStaff, FichaVistaPreviaProps } from "@/lib/types/ficha";

function fmtFechaPeru(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function nombreStaff(s: FichaStaff): string {
  return [s.name, s.lastname].filter(Boolean).join(" ").trim() || "No registrado";
}

/** Documento completo en ficha oficial (registro administrativo de la liga). */
function formatDocumentoFicha(documentType: string | null, documentNumber: string | null): string {
  const num = documentNumber?.trim();
  if (!num) return "—";
  const type = (documentType || "DNI").trim();
  return `${type} ${num}`;
}

/** Mismos criterios que `generarFichaCategoriaPdf`. */
function ordenarJugadores(j: FichaVistaPreviaJugador[]) {
  return [...j].sort((a, b) => {
    const ap = a.lastname.localeCompare(b.lastname, "es", { sensitivity: "base" });
    if (ap !== 0) return ap;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

const HEAD_BG = "#2563EB";

export function FichaVistaPrevia({
  leagueDisplayName,
  leagueLogoUrl,
  clubName,
  clubLogoUrl,
  categoriaDetalle,
  players,
  entrenador,
  delegado,
}: FichaVistaPreviaProps) {
  const filas = useMemo(() => ordenarJugadores(players), [players]);
  const leagueTitle = resolveFichaLeagueTitle(leagueDisplayName);
  const hasLeagueLogo = Boolean(leagueLogoUrl?.trim());

  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      {/* Marca de agua (réplica del PDF: logo liga centrado, ~5% opacidad) */}
      {hasLeagueLogo ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={leagueLogoUrl}
            alt=""
            className="max-h-[72%] w-[88%] max-w-3xl object-contain opacity-[0.05]"
          />
        </div>
      ) : null}

      <div className="relative z-10 p-[14mm] pb-8 pt-[14mm]">
        {/* Cabecera institucional */}
        <header className="flex items-start gap-2">
          <div className="flex h-[38mm] w-[30mm] shrink-0 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/federacion.png"
              alt="Federación Deportiva Peruana de Basketball"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5 text-center">
            <p className="text-[11px] font-bold uppercase leading-tight text-slate-900 sm:text-xs md:text-[13px]">
              {FICHA_T1}
            </p>
            <p className="text-[11px] font-bold uppercase leading-tight text-slate-900 sm:text-xs md:text-[12px]">
              {leagueTitle}
            </p>
            <p className="pt-0 text-[11px] font-bold uppercase text-slate-900 sm:text-xs md:text-[12px]">
              {FICHA_T3}
            </p>
          </div>

          <div className="flex h-[38mm] w-[30mm] shrink-0 items-center justify-center">
            {hasLeagueLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={leagueLogoUrl}
                alt={leagueDisplayName}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50 px-1 text-center text-[7px] font-semibold uppercase leading-tight text-slate-400">
                Logo liga
              </div>
            )}
          </div>
        </header>

        <div className="my-3 border-t border-slate-300" />

        {/* Identidad: replica PDF (texto izquierda, sello derecha) */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1 pr-2 text-left text-sm font-bold uppercase text-slate-900">
            <p className="wrap-break-word">CLUB: {clubName.trim().toUpperCase()}</p>
            <p className="wrap-break-word">CATEGORÍA: {categoriaDetalle.toUpperCase()}</p>
          </div>
          <div className="h-[18mm] w-[18mm] shrink-0 overflow-hidden rounded border border-slate-200 bg-white">
            {clubLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clubLogoUrl} alt="" className="h-full w-full object-contain p-0.5" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[8px] text-slate-400">
                Logo
              </div>
            )}
          </div>
        </div>

        {/* Tabla (fondo transparente para ver marca de agua) */}
        <div className="overflow-x-auto rounded border border-slate-200/80">
          <table className="w-full min-w-[640px] border-collapse text-[11px]">
            <thead>
              <tr>
                {FICHA_COLUMNAS_TABLA.map((label, colIdx) => (
                  <th
                    key={`${colIdx}-${label}`}
                    className="border border-[#2a4470] px-1 py-2 text-center text-[9px] font-bold uppercase leading-tight text-white shadow-[inset_0_-3px_0_0_#0070f3]"
                    style={{ backgroundColor: HEAD_BG }}
                  >
                    <span className="drop-shadow-[0_0_1px_rgba(0,112,243,0.95)]">{label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((j, idx) => {
                const fn = new Date(j.fechaNacimientoIso);
                const edad = Number.isNaN(fn.getTime()) ? "—" : String(calcularEdad(fn));
                const nombreCompleto = `${j.lastname}, ${j.name}`.toUpperCase();
                const polo = j.jerseyNumber != null ? String(j.jerseyNumber) : "—";
                return (
                  <tr key={j.id} className="border-b border-slate-200/90 bg-transparent">
                    <td className="border border-slate-200/70 px-1 py-1.5 text-center align-middle font-medium uppercase text-slate-900">
                      {String(idx + 1)}
                    </td>
                    <td className="border border-slate-200/70 px-1 py-1.5 text-center align-middle font-medium uppercase text-slate-900">
                      {nombreCompleto}
                    </td>
                    <td className="border border-slate-200/70 px-1 py-1.5 text-center align-middle text-slate-800">
                      {formatDocumentoFicha(j.documentType, j.documentNumber)}
                    </td>
                    <td className="border border-slate-200/70 px-1 py-1.5 text-center align-middle text-slate-800">
                      {fmtFechaPeru(j.fechaNacimientoIso)}
                    </td>
                    <td className="border border-slate-200/70 px-1 py-1.5 text-center align-middle text-slate-800">
                      {edad}
                    </td>
                    <td className="border border-slate-200/70 px-1 py-1.5 text-center align-middle text-slate-800">
                      {polo}
                    </td>
                    <td className="border border-slate-200/70 px-0.5 py-0.5 text-center align-middle">
                      <div className="mx-auto flex h-[28mm] max-h-[28mm] w-[22mm] max-w-[22mm] items-center justify-center overflow-hidden bg-slate-50/50">
                        {j.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={j.photoUrl}
                            alt=""
                            className="max-h-full max-w-full object-cover"
                          />
                        ) : (
                          <span className="text-[8px] text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Responsables (réplica simplificada del pie del PDF) */}
        <div className="mt-6 border-t border-slate-300 pt-4">
          <p className="mb-3 text-sm font-bold text-slate-900">Responsables</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <StaffBloque etiqueta="Entrenador" staff={entrenador} />
            <StaffBloque etiqueta="Delegado" staff={delegado} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffBloque({ etiqueta, staff }: { etiqueta: string; staff: FichaStaff }) {
  return (
    <div className="text-sm">
      <p className="font-bold text-slate-900">{etiqueta}</p>
      <div className="mt-2 flex gap-3">
        <div className="h-28 w-24 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50">
          {staff.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={staff.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">Sin foto</div>
          )}
        </div>
        <div className="min-w-0 pt-1">
          <p className="font-normal text-slate-900">{nombreStaff(staff)}</p>
          {staff.documentNumber ? (
            <p className="mt-1 text-xs text-slate-600">
              {formatDocumentoFicha(staff.documentType, staff.documentNumber)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
