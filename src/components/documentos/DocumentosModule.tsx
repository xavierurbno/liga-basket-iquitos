"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer } from "lucide-react";
import Image from "next/image";
import {
  buscarJugadorPorDocumento,
  type JugadorDocumental,
} from "@/lib/actions/buscarJugadorPorDocumento";
import {
  generarDocumentoInstitucional,
  type TipoDocumento,
} from "@/lib/pdf/documentosInstitucionalesPdf";
import {
  buscarClubParaDocumento,
  type ClubDocumental,
} from "@/lib/actions/buscarClubParaDocumento";
import {
  registrarEmisionDocumento,
  obtenerUltimasEmisiones,
} from "@/lib/actions/documentHistory";
import type { DocumentoInput } from "@/lib/pdf/documentosInstitucionalesPdf";
import { getInstitutionalLogosAction } from "@/lib/actions/assets";
import { getEntityValidationUrlAction } from "@/lib/actions/validation-url";

interface EmisionDocumento {
  id: string;
  type: string;
  shortIdentifier: string;
  correlative: number;
  createdAt: Date | string;
  snapshot: any;
}


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function categoriaLabel(cat: string): string {
  const map: Record<string, string> = {
    SUB_13: "SUB-13",
    SUB_15: "SUB-15",
    SUB_17: "SUB-17",
    MAYORES: "MAYORES",
    VETERANOS: "VETERANOS",
  };
  return map[cat] ?? cat;
}

/** Convierte una URL remota (foto) a data URL base64 */
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Convierte /public path a data URL (para logos) */
async function publicPathToDataUrl(path: string): Promise<string | null> {
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "";
    return await urlToDataUrl(`${base}${path}`);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// VARIANTES FRAMER MOTION
// ─────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.32, ease: "easeOut" as const },
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

type Fase = "buscar" | "preview" | "generando";

type DocumentosModuleProps = {
  /** Liga operativa: filtra historial y prioriza branding en PDFs. */
  filterLeagueId?: string | null;
};

export function DocumentosModule({ filterLeagueId }: DocumentosModuleProps = {}) {
  const [fase, setFase] = useState<Fase>("buscar");
  const [dni, setDni] = useState("");
  const [docSearchType, setDocSearchType] = useState("DNI");
  const [error, setError] = useState<string | null>(null);
  const [isBuscando, setIsBuscando] = useState(false);
  const [jugador, setJugador] = useState<JugadorDocumental | null>(null);
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>("CONSTANCIA");
  const [isGenerando, setIsGenerando] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Club state
  const [clubQuery, setClubQuery] = useState("");
  const [clubResultados, setClubResultados] = useState<ClubDocumental[]>([]);
  const [clubSeleccionado, setClubSeleccionado] = useState<ClubDocumental | null>(null);
  const [errClub, setErrClub] = useState<string | null>(null);
  const [isBuscandoClub, setIsBuscandoClub] = useState(false);

  // Historial State
  const [historial, setHistorial] = useState<EmisionDocumento[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  // ── CARGAR HISTORIAL ───────────────────────────────────────
  const fetchHistorial = useCallback(async () => {
    try {
      setCargandoHistorial(true);
      const res = await obtenerUltimasEmisiones(filterLeagueId);
      if (res.ok) setHistorial(res.emisiones!);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setCargandoHistorial(false);
    }
  }, [filterLeagueId]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  // ── BUSCAR JUGADOR ─────────────────────────────────────────
  const handleBuscar = useCallback(async () => {
    const docNum = dni.trim();
    if (!docNum) {
      setError("Ingresa un número de documento.");
      return;
    }
    setError(null);
    setIsBuscando(true);
    try {
      const result = await buscarJugadorPorDocumento(docSearchType, docNum);
      if (!("ok" in result)) {
        setError("error" in result ? result.error : "No autenticado.");
        setJugador(null);
      } else if (!result.ok) {
        setError(result.error);
        setJugador(null);
      } else {
        setJugador(result.jugador);
        setFase("preview");
      }
    } catch (error: unknown) {
      setError("Error de conexión. Verifica tu red e inténtalo de nuevo.");
    } finally {
      setIsBuscando(false);
    }
  }, [dni, docSearchType]);

  // ── BUSCAR CLUB ────────────────────────────────────────────
  const handleBuscarClub = useCallback(async () => {
    const q = clubQuery.trim();
    if (q.length < 2) { setErrClub("Mínimo 2 caracteres."); return; }
    setErrClub(null); setIsBuscandoClub(true); setClubResultados([]);
    try {
      const res = await buscarClubParaDocumento(q);
      if (!res.ok) { setErrClub(res.error); }
      else { setClubResultados(res.clubs); }
    } catch (error: unknown) { setErrClub("Error de conexión."); }
    finally { setIsBuscandoClub(false); }
  }, [clubQuery]);

  // ── GENERAR PDF ────────────────────────────────────────────
  const handleGenerarPdf = useCallback(async () => {
    const isClub = tipoDoc === "SOLVENCIA_CLUB";
    if (isClub ? !clubSeleccionado : !jugador) return;
    setIsGenerando(true); setPdfError(null);
    try {
      const docLeagueId = isClub ? clubSeleccionado?.leagueId : jugador?.leagueId;
      const logosRes = await getInstitutionalLogosAction(docLeagueId);
      const federacionDataUrl = logosRes.success ? logosRes.federacionBase64 : null;
      const ligaDataUrl = logosRes.success ? logosRes.ligaBase64 : null;
      if (!federacionDataUrl || !ligaDataUrl) {
        setPdfError("No se pudieron cargar los logos de la liga.");
        setIsGenerando(false);
        return;
      }
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      let inputData: DocumentoInput & { shortIdentifier: string };

      if (isClub && clubSeleccionado) {
        inputData = {
          type: "SOLVENCIA_CLUB",
          entityId: clubSeleccionado.id,
          shortIdentifier: clubSeleccionado.name.substring(0, 3).toUpperCase(),
          clubName: clubSeleccionado.name,
          clubCodigoFederacion: clubSeleccionado.federationCode,
          clubPresidente: clubSeleccionado.presidentName
            ? `${clubSeleccionado.presidentName} ${clubSeleccionado.presidentLastname ?? ""}`.trim()
            : null,
          federacionLogoPngDataUrl: federacionDataUrl,
          ligaLogoPngDataUrl: ligaDataUrl,
          leagueId: docLeagueId ?? undefined,
          brandPrimaryRgb: logosRes.success ? logosRes.primaryRgb : undefined,
          brandAccentRgb: logosRes.success ? logosRes.accentRgb : undefined,
          leagueDisplayName: logosRes.success ? logosRes.leagueDisplayName : undefined,
          seasonLabel: logosRes.success ? logosRes.seasonLabel : undefined,
          siteUrl,
          generatedAtIso: new Date().toISOString(),
        };
      } else if (jugador) {
        const validationRes = await getEntityValidationUrlAction(jugador.id, "player");
        const fotoDataUrl = jugador.photoUrl ? await urlToDataUrl(jugador.photoUrl) : null;
        inputData = {
          type: tipoDoc as "CARTA_PASE" | "CONSTANCIA",
          entityId: jugador.id,
          validationUrl: validationRes.ok ? validationRes.url : null,
          shortIdentifier: jugador.documentNumber,
          name: jugador.name,
          lastname: jugador.lastname,
          documentType: jugador.documentType,
          documentNumber: jugador.documentNumber,
          clubName: jugador.clubName,
          categoriaNombre: jugador.categoriaNombre ?? categoriaLabel(jugador.category),
          fotoPngDataUrl: fotoDataUrl,
          fotoRemoteUrl: jugador.photoUrl ?? null,
          federacionLogoPngDataUrl: federacionDataUrl,
          ligaLogoPngDataUrl: ligaDataUrl,
          leagueId: docLeagueId ?? undefined,
          brandPrimaryRgb: logosRes.success ? logosRes.primaryRgb : undefined,
          brandAccentRgb: logosRes.success ? logosRes.accentRgb : undefined,
          leagueDisplayName: logosRes.success ? logosRes.leagueDisplayName : undefined,
          seasonLabel: logosRes.success ? logosRes.seasonLabel : undefined,
          siteUrl,
          generatedAtIso: new Date().toISOString(),
        };
      } else return;

      // 1. Registrar Emisión y obtener correlative
      const res = await registrarEmisionDocumento(inputData);
      if (!res.ok) {
        throw new Error(res.error);
      }

      // 2. Adjuntar serial al input
      inputData.correlative = res.correlative;
      inputData.fechaOriginal = res.createdAt;

      // 3. Generar PDF
      const blob = await generarDocumentoInstitucional(inputData);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const sufijo = tipoDoc === "CARTA_PASE" ? "carta-pase" : tipoDoc === "CONSTANCIA" ? "constancia" : "solvencia";
      a.href = url;
      a.download = isClub
        ? `${sufijo}_${clubSeleccionado!.name.toLowerCase().replace(/\s+/g, "-")}.pdf`
        : `${sufijo}_${jugador!.lastname.toLowerCase()}_${jugador!.documentNumber}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      
      // Actualizar historial
      fetchHistorial();
    } catch (error: unknown) {
      console.error("[DocumentosModule] Error:", error);
      setPdfError("Error al generar el PDF. Verifica los datos e inténtalo.");
    } finally { setIsGenerando(false); }
  }, [jugador, clubSeleccionado, tipoDoc, fetchHistorial]);

  // ── REIMPRIMIR ─────────────────────────────────────────────
  const handleReimprimir = useCallback(async (hist: any) => {
    try {
      const snap: DocumentoInput = hist.snapshot;
      const blob = await generarDocumentoInstitucional({
        ...snap,
        esCopia: true,
        correlative: hist.correlative,
        shortIdentifier: hist.shortIdentifier,
        fechaOriginal: hist.createdAt,
        generatedAtIso: new Date().toISOString(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reimpresion_${hist.type.toLowerCase()}_${hist.correlative}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error(error);
      alert("Error al reimprimir documento.");
    }
  }, []);

  // ── REINICIAR ──────────────────────────────────────────────
  const handleReiniciar = () => {
    setFase("buscar"); setDni(""); setDocSearchType("DNI"); setJugador(null); setError(null);
    setClubQuery(""); setClubResultados([]); setClubSeleccionado(null); setErrClub(null);
    setPdfError(null);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-10rem)] pb-10">
      {/* ── Header Simple ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0f172a]">
          Gestión Documental
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Emisión de Cartas de Pase, Constancias y Cartas de No Adeudo.
        </p>
      </div>

      {/* ── Contenido por Fase ── */}
      <AnimatePresence mode="wait">
        {/* ═══ FASE 1: BÚSQUEDA ═══ */}
        {fase === "buscar" && (
          <motion.section key="buscar" {...fadeSlide} className="w-full space-y-4">
            {/* Selector de type */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { type: "CONSTANCIA" as const, emoji: "📋", label: "Constancia" },
                { type: "CARTA_PASE" as const, emoji: "🔄", label: "Carta de Pase" },
                { type: "SOLVENCIA_CLUB" as const, emoji: "🏛️", label: "No Adeudo Club" },
              ]).map(({ type, emoji, label }) => {
                const active = tipoDoc === type;
                return (
                  <button key={type} onClick={() => { setTipoDoc(type); setJugador(null); setError(null); setClubResultados([]); setClubSeleccionado(null); setErrClub(""); }}
                    className={`rounded-2xl border-2 p-3 text-center transition-all duration-300 ${
                      active ? "border-[#005CEE] bg-[#005CEE] text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-[#005CEE]"
                    }`}>
                    <div className="text-xl">{emoji}</div>
                    <p className="mt-1 text-[11px] font-bold tracking-wide">{label}</p>
                  </button>
                );
              })}
            </div>

            {/* Tarjeta de búsqueda optimizada */}
            <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              {tipoDoc !== "SOLVENCIA_CLUB" ? (
                <div className="flex flex-col items-center">
                  <div className="mb-5 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#005CEE]/10 text-xl shadow-sm">
                      <span className="text-blue-600">🔍</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#005CEE]">Buscar Deportista</h2>
                    <p className="text-xs text-slate-500">Ingresa los datos para generar el documento</p>
                  </div>

                  <div className="w-full max-w-[320px] space-y-4 text-center">
                    <div>
                      <label htmlFor="dni-input" className="mb-1 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        NÚMERO DE DOCUMENTO
                      </label>
                      <div className="flex gap-2">
                        <select 
                          className="rounded-xl border-2 border-slate-100 bg-slate-50 px-2 text-[10px] font-bold outline-none"
                          value={docSearchType}
                          onChange={(e) => setDocSearchType(e.target.value)}
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">CE</option>
                          <option value="PASAPORTE">PASAPORTE</option>
                        </select>
                        <input 
                          id="dni-input" 
                          type="text" 
                          value={dni}
                          onChange={(e) => { setDni(e.target.value); setError(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter" && dni) handleBuscar(); }}
                          placeholder="Número..."
                          className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-center text-xl font-bold tracking-widest outline-none transition-all duration-300 ${
                            error 
                              ? "border-red-200 bg-red-50 text-red-700" 
                              : "border-slate-100 bg-slate-50 text-slate-900 focus:border-[#005CEE] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,92,238,0.1)]"
                          }`} 
                        />
                      </div>
                      {error && <p className="mt-1.5 text-[10px] font-medium text-red-500">{error}</p>}
                    </div>

                    <button 
                      id="btn-buscar-dni" 
                      onClick={handleBuscar} 
                      disabled={isBuscando || !dni}
                      className="w-full rounded-xl bg-[#005CEE] px-6 py-2.5 text-xs font-bold tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isBuscando ? (
                          <>
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            BUSCANDO...
                          </>
                        ) : (
                          "BUSCAR JUGADOR"
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-5 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl shadow-sm">
                      <span className="text-blue-500">🏛️</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#005CEE]">Buscar Club</h2>
                    <p className="text-xs text-slate-500">Ingresa el nombre del club</p>
                  </div>
                  
                  <div className="w-full max-w-[400px] space-y-3">
                    <div className="flex gap-2">
                      <input 
                        id="club-input" 
                        type="text" 
                        value={clubQuery}
                        onChange={(e) => { setClubQuery(e.target.value); setErrClub(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleBuscarClub(); }}
                        placeholder="Ej: Club Deportivo Loreto"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#005CEE] focus:bg-white" 
                      />
                      <button
                        onClick={handleBuscarClub}
                        disabled={clubQuery.length < 3 || isBuscandoClub}
                        className="rounded-xl bg-[#005CEE] px-4 py-2 text-white transition-all hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-md shadow-blue-100"
                      >
                        {isBuscandoClub ? "..." : "🔍"}
                      </button>
                    </div>
                    {errClub && <p className="text-[10px] text-red-500 font-medium text-center">{errClub}</p>}
                    {clubResultados.length > 0 && (
                      <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-inner">
                        {clubResultados.map((c) => (
                          <li key={c.id}>
                            <button 
                              onClick={() => { setClubSeleccionado(c); setFase("preview"); }}
                              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#EFF6FF] hover:text-[#005CEE] transition-colors"
                            >
                              {c.name}
                              {c.district && <span className="ml-2 text-[10px] font-normal text-slate-400">({c.district})</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── HISTORIAL DE EMISIONES ── */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Registro de Emisiones</h3>
              </div>
              <div className="p-0">
                {cargandoHistorial ? (
                  <p className="p-6 text-sm text-slate-500 text-center">Cargando historial...</p>
                ) : historial.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 text-center">No hay documentos generados aún.</p>
                ) : (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="px-6 py-3">Serial</th>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3">Sujeto</th>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historial.map((h) => {
                        return (
                          <tr key={h.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3 font-mono text-[11px] font-bold text-[#005CEE]">{`LDDBI - ${h.shortIdentifier} - ${h.correlative}`}</td>
                            <td className="px-6 py-3 font-medium text-slate-900">
                              {h.type === "CARTA_PASE" ? "CARTA DE PASE" : h.type === "CONSTANCIA" ? "CONSTANCIA" : "NO ADEUDO"}
                            </td>
                            <td className="px-6 py-3">{h.snapshot?.name ? `${h.snapshot.lastname}, ${h.snapshot.name}` : h.snapshot?.clubName}</td>
                            <td className="px-6 py-3 text-[11px]">{new Date(h.createdAt).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute:"2-digit" })}</td>
                            <td className="px-6 py-3 text-right">
                              <button onClick={() => handleReimprimir(h)} className="text-[#005CEE] hover:text-[#0047C0] hover:bg-blue-50 p-2 rounded-lg transition-all duration-300" title="Reimprimir">
                                <Printer className="w-5 h-5 inline-block" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* ═══ FASE 2: PREVIEW + SELECTOR + GENERACIÓN ═══ */}
        {(fase === "preview" || fase === "generando") && (jugador || clubSeleccionado) && (
          <motion.div key="preview" {...fadeSlide} className="w-full space-y-5">
            {/* Tarjeta club (SOLVENCIA_CLUB) */}
            {tipoDoc === "SOLVENCIA_CLUB" && clubSeleccionado && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-4 bg-linear-to-r from-[#005CEE] to-[#0047C0] px-6 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-lg font-black text-white">✓</div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-blue-100">CLUB ENCONTRADO</p>
                    <p className="text-sm font-bold text-white">{clubSeleccionado.name}</p>
                  </div>
                  <button onClick={handleReiniciar} className="ml-auto rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20">Nueva búsqueda</button>
                </div>
                <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
                  {[
                    { label: "CLUB", value: clubSeleccionado.name },
                    { label: "CÓD. FED.", value: clubSeleccionado.federationCode ?? "—" },
                    { label: "DISTRITO", value: clubSeleccionado.district ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <p className="text-[9px] font-bold tracking-widest text-slate-400">{label}</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-800 leading-tight">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Tarjeta del jugador */}
            {jugador && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.12)]">
              {/* Header tarjeta */}
              <div className="flex items-center gap-4 bg-linear-to-r from-[#005CEE] to-[#0047C0] px-6 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-lg font-black text-white shadow">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-blue-100">
                    JUGADOR ENCONTRADO
                  </p>
                  <p className="text-sm font-bold text-white">
                    {jugador.documentType} {jugador.documentNumber} verificado en base de datos
                  </p>
                </div>
                <button
                  onClick={handleReiniciar}
                  className="ml-auto rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20"
                >
                  Nueva búsqueda
                </button>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="flex flex-col gap-6 p-6 sm:flex-row">
                {/* Foto */}
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <div className="relative h-28 w-24 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100 shadow-md">
                    {jugador.photoUrl ? (
                      <img
                        src={jugador.photoUrl.trim()}
                        alt={`Foto de ${jugador.name}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                        <span className="text-3xl">👤</span>
                        <p className="text-center text-[9px] font-medium text-slate-400 leading-tight">
                          SIN FOTO
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Datos */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xl font-black text-slate-900">
                      {jugador.lastname.toUpperCase()},{" "}
                      {jugador.name.toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-sm font-mono text-slate-500">
                      {jugador.documentType}: {jugador.documentNumber}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { label: "CLUB", value: jugador.clubName },
                      {
                        label: "CATEGORÍA",
                        value:
                          jugador.categoriaNombre ??
                          categoriaLabel(jugador.category),
                      },
                      ...(jugador.carnetNumber
                        ? [{ label: "N° FICHA", value: jugador.carnetNumber }]
                        : []),
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100"
                      >
                        <p className="text-[9px] font-bold tracking-widest text-slate-400">
                          {label}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-slate-800 leading-tight">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Selector de type de documento (solo jugador) */}
            {tipoDoc !== "SOLVENCIA_CLUB" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-slate-500">
                Tipo de Documento
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      type: "CARTA_PASE" as TipoDocumento,
                      emoji: "🔄",
                      titulo: "Carta de Pase",
                      desc: "Para transferencia entre clubes. Certifica que el deportista queda en condición de jugador libre.",
                    },
                    {
                      type: "CONSTANCIA" as TipoDocumento,
                      emoji: "📋",
                      titulo: "Constancia de Jugador",
                      desc: "Acredita al deportista como jugador activo habilitado para competencias oficiales.",
                    },
                  ] satisfies {
                    type: TipoDocumento;
                    emoji: string;
                    titulo: string;
                    desc: string;
                  }[]
                ).map(({ type, emoji, titulo, desc }) => {
                  const active = tipoDoc === type;
                  return (
                    <button
                      key={type}
                      id={`type-doc-${type.toLowerCase()}`}
                      onClick={() => setTipoDoc(type)}
                      className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        active
                          ? "border-[#005CEE] bg-linear-to-br from-[#005CEE] to-[#0047C0] shadow-[0_8px_25px_-8px_rgba(0,92,238,0.5)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div>
                          <p
                            className={`font-extrabold text-sm ${active ? "text-white" : "text-slate-900"}`}
                          >
                            {titulo}
                          </p>
                          <p
                            className={`mt-1 text-xs leading-relaxed ${active ? "text-blue-200" : "text-slate-500"}`}
                          >
                            {desc}
                          </p>
                        </div>
                        {active && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-white text-[10px] font-black">
                            ✓
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* Botón de generación */}
            <div className="space-y-2">
              {pdfError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
                >
                  ⚠️ {pdfError}
                </motion.div>
              )}

              <button
                id="btn-generar-pdf"
                onClick={handleGenerarPdf}
                disabled={isGenerando}
                className="group w-full overflow-hidden rounded-2xl bg-linear-to-r from-[#005CEE] via-[#0047C0] to-[#005CEE] px-6 py-4 text-sm font-extrabold tracking-widest text-white shadow-[0_15px_40px_-15px_rgba(0,92,238,0.45)] transition-all duration-300 hover:shadow-[0_20px_50px_-15px_rgba(0,92,238,0.55)] hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                <span className="flex items-center justify-center gap-3">
                  {isGenerando ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      GENERANDO PDF...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">📄</span>
                      GENERAR Y DESCARGAR{" "}
                      {tipoDoc === "CARTA_PASE"
                        ? "CARTA DE PASE"
                        : "CONSTANCIA"}
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-[11px] text-slate-400">
                El documento incluirá marca de agua institucional y código QR de
                validación
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
