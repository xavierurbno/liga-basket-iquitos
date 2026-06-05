"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import {
  formatGeneroCarnetEtiqueta,
  splitApellidosParaCarnet,
} from "@/lib/carnet/carnetInstitucionalText";
import { extractCarnetYear } from "@/lib/carnet/carnetColors";
import { splitFederationDisplayLines } from "@/lib/carnet/carnetTheme";
import {
  resolveLddbiEncabezadoLineas,
  resolveLddbiReversoLineas,
} from "@/lib/carnet/lddbiEncabezadoText";
import {
  LDDBI_PREMIUM_ACCENT_HEX,
  LDDBI_PREMIUM_PRIMARY_HEX,
} from "@/lib/carnet/lddbiPremiumTheme";
import { LDDBI_DEFAULT_WATERMARK_PUBLIC_PATH } from "@/lib/carnet/lddbiWatermarkPaths";
import { isCarnetValidacionMode } from "@/lib/carnet/isCarnetValidacionMode";
import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";

const CR80_ASPECT = "85.6 / 53.98";

const LDDBI_DIAGONAL_LINES_STYLE: CSSProperties = {
  backgroundImage: [
    "repeating-linear-gradient(32deg, transparent, transparent 7px, rgba(255,255,255,0.09) 7px, rgba(255,255,255,0.09) 8px)",
    "repeating-linear-gradient(-58deg, transparent, transparent 9px, rgba(180,220,255,0.06) 9px, rgba(180,220,255,0.06) 10px)",
    "repeating-linear-gradient(78deg, transparent, transparent 11px, rgba(255,255,255,0.04) 11px, rgba(255,255,255,0.04) 12px)",
  ].join(", "),
};

function hexRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "30, 58, 95";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function CarnetLddbiVistaPrevia(props: CarnetVistaPreviaProps) {
  const esValidacion = isCarnetValidacionMode(props);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [caraAdmin, setCaraAdmin] = useState<"anverso" | "reverso">("anverso");
  const cara = esValidacion ? "anverso" : caraAdmin;

  const primary = props.portalPrimaryColor ?? LDDBI_PREMIUM_PRIMARY_HEX;
  const accent = props.portalAccentColor ?? LDDBI_PREMIUM_ACCENT_HEX;
  const primaryRgb = hexRgb(primary);
  const accentRgb = hexRgb(accent);
  const showFed = props.carnetShowFederation !== false;
  const { lineaFederacion, lineaLiga } = resolveLddbiEncabezadoLineas(
    props.leagueDisplayName,
    props.carnetFederationDisplayName,
    showFed,
  );
  const reversoLineas = resolveLddbiReversoLineas(props.leagueDisplayName);
  const { apellidoPaterno, apellidoMaterno } = useMemo(
    () => splitApellidosParaCarnet(props.lastname),
    [props.lastname],
  );
  const generoLabel = formatGeneroCarnetEtiqueta(props.gender);
  const validationCode = useMemo(() => {
    if (props.validationUrl) {
      const seg = props.validationUrl.split("/").filter(Boolean).pop();
      if (seg) return seg.slice(0, 20).toUpperCase();
    }
    return props.playerId.replace(/-/g, "").slice(0, 20).toUpperCase();
  }, [props.validationUrl, props.playerId]);

  useEffect(() => {
    if (!props.validationUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(props.validationUrl, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 160,
      color: { dark: "#0f172a", light: "#FFFFFF" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [props.validationUrl]);

  const campos: [string, string][] = [
    ["APELLIDOS", `${apellidoPaterno} ${apellidoMaterno}`.trim()],
    ["NOMBRES", props.name.trim().toUpperCase()],
    ["DNI", props.documentNumber],
    ["F. DE NAC.", props.fechaNacimientoLabel],
    ["CLUB", props.clubName.trim().toUpperCase()],
    ["CATEGORÍA", props.categoriaNombre.trim().toUpperCase()],
  ];

  const watermarkSrc =
    props.carnetSportGraphicUrl ?? LDDBI_DEFAULT_WATERMARK_PUBLIC_PATH;
  const revWatermarkSrc =
    props.carnetSportGraphicUrl ??
    props.federacionLogoUrl ??
    props.leagueLogoUrl ??
    LDDBI_DEFAULT_WATERMARK_PUBLIC_PATH;
  const fedPieLines = splitFederationDisplayLines(
    props.carnetFederationDisplayName ?? null,
    showFed,
  );

  const shellStyle = {
    aspectRatio: CR80_ASPECT,
    background: `linear-gradient(135deg, rgb(${primaryRgb}) 0%, rgb(${accentRgb}) 100%)`,
  };

  const anversoCard = (
    <div
      className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-lg shadow-lg ring-1 ring-slate-400/60"
      style={shellStyle}
    >
          <div
            className="pointer-events-none absolute inset-0 bottom-[7.4%]"
            style={LDDBI_DIAGONAL_LINES_STYLE}
            aria-hidden
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={watermarkSrc}
            alt=""
            className="pointer-events-none absolute left-1/2 top-[22%] z-0 max-h-[52%] max-w-[46%] -translate-x-1/2 object-contain opacity-[0.12]"
          />
          <header className="relative z-10 grid min-h-12 grid-cols-[3rem_1fr_3rem] items-center gap-2 px-2.5 py-1.5">
            <div className="flex h-12 w-12 items-center justify-center">
              {props.federacionLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.federacionLogoUrl}
                  alt="Logo federación"
                  className="max-h-12 max-w-12 object-contain object-center"
                />
              ) : (
                <span className="text-[5px] text-white/40">FDPB</span>
              )}
            </div>
            <div className="flex min-h-12 flex-col items-center justify-center text-center leading-snug">
              <p className="text-[7.5px] font-bold uppercase tracking-tight text-white">
                {lineaFederacion}
              </p>
              <p className="mt-0.5 text-[6.5px] font-medium uppercase text-white">
                {lineaLiga}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center">
              {props.leagueLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.leagueLogoUrl}
                  alt="Logo liga"
                  className="max-h-12 max-w-12 object-contain object-center drop-shadow-sm"
                />
              ) : (
                <span className="text-[5px] text-white/40">Liga</span>
              )}
            </div>
          </header>

          <div className="relative z-10 flex flex-1 gap-2.5 px-2.5 pb-[9%] pt-1">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1.5">
              {campos.map(([label, value]) => (
                <p key={label} className="leading-snug">
                  <span className="text-[7.5px] font-medium uppercase text-sky-100">
                    {label}:
                  </span>{" "}
                  <span
                    className={`uppercase text-white ${
                      label === "APELLIDOS" ? "text-[9.5px] font-bold" : "text-[8.5px] font-bold"
                    }`}
                  >
                    {value}
                  </span>
                </p>
              ))}
            </div>
            <div className="flex w-[40%] shrink-0 flex-col items-center">
              <div
                className="w-full overflow-hidden rounded-md bg-white p-[2px]"
                style={{ boxShadow: `0 0 0 2px rgb(${accentRgb})` }}
              >
                <div className="relative aspect-5/6 w-full bg-white">
                  {props.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={props.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[7px] text-slate-400">
                      SIN FOTO
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-1 text-[5.5px] font-medium uppercase tracking-wide text-sky-100">
                Carnet número
              </p>
              <p className="text-[6.5px] font-bold leading-tight text-white">
                {props.carnetNumberDisplay ?? "—"}
              </p>
              <p className="mt-0.5 text-[7.5px] text-sky-50">Género: {generoLabel}</p>
              <p className="text-[8.5px] font-bold text-white">
                {extractCarnetYear(props.carnetNumberDisplay)}
              </p>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-[3px]"
            style={{ backgroundColor: accent, height: "7.4%" }}
          >
            <span className="text-[7.5px] font-bold uppercase text-white">Credencial deportiva</span>
            {props.carnetNumberDisplay ? (
              <span className="text-[7.5px] font-bold text-white">
                N° {props.carnetNumberDisplay}
              </span>
            ) : null}
          </div>
    </div>
  );

  const reversoCard = (
        <div className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-lg shadow-lg ring-1 ring-slate-400/60 bg-white">
          <header
            className="grid min-h-14 grid-cols-[2.5rem_1fr_auto] items-center gap-1.5 px-2.5 py-1.5"
            style={{ backgroundColor: primary }}
          >
            <div className="flex h-9 w-10 items-center justify-center">
              {props.leagueLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.leagueLogoUrl}
                  alt="Logo liga"
                  className="max-h-9 max-w-10 object-contain"
                />
              ) : null}
            </div>
            <div className="min-w-0 text-center leading-snug">
              <p className="text-[6px] font-bold uppercase tracking-tight text-white">
                {reversoLineas.lineaFederacion}
              </p>
              <p className="mt-0.5 text-[5.5px] font-medium uppercase text-white/95">
                {reversoLineas.lineaLiga}
              </p>
            </div>
            <div className="shrink-0 text-right text-[7px] font-bold uppercase text-white">
              <p>Vigencia</p>
              <p className="text-[6px] font-normal">{props.vigenciaLabel}</p>
            </div>
          </header>

          <div
            className="relative flex flex-col px-3 py-2 text-center"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.08)`,
              minHeight: "36%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={revWatermarkSrc}
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-h-[70%] max-w-[55%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.1]"
            />
            <div className="relative z-10 flex flex-1 items-center justify-center py-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" className="h-12 w-12 rounded bg-white p-0.5 shadow-sm" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-white text-[7px] text-slate-400">
                  Sin QR
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 px-3 pb-14 pt-1">
            <p className="text-center text-[7.5px] leading-relaxed text-slate-800">
              {props.authorizationText}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    firma: props.presidentSignatureUrl,
                    nombre: props.presidentDisplayName,
                    cargo: "PRESIDENTE",
                  },
                  {
                    firma: props.secretarySignatureUrl,
                    nombre: props.secretaryDisplayName,
                    cargo: "SECRETARIO",
                  },
                ] as const
              ).map((b) => (
                <div key={b.cargo} className="text-center">
                  {b.firma ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.firma} alt="" className="mx-auto h-6 object-contain" />
                  ) : null}
                  <div className="mx-auto mt-0.5 w-full border-b border-dotted border-slate-300" />
                  <p className="mt-0.5 text-[7px] font-bold uppercase">{b.nombre || "—"}</p>
                  <p className="text-[6px] text-slate-500">{b.cargo}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-[7px] font-bold uppercase text-slate-700">
              Vigencia hasta: {props.vigenciaLabel}
            </p>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-1 px-2 py-1"
            style={{ backgroundColor: primary, height: "10%" }}
          >
            <span className="font-mono text-[5.5px] font-bold text-white">{validationCode}</span>
            {props.leagueLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.leagueLogoUrl} alt="" className="h-6 object-contain" />
            ) : (
              <span />
            )}
            {fedPieLines ? (
              <div className="max-w-[38%] text-right text-[4.5px] font-medium uppercase leading-tight text-white/95">
                <p>{fedPieLines[0]}</p>
                {fedPieLines[1]?.trim() ? <p>{fedPieLines[1]}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
  );

  if (esValidacion) {
    return (
      <section className="flex justify-center" aria-label="Credencial deportiva">
        {anversoCard}
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Vista previa carnet LDDBI">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-800">Vista previa — plantilla LDDBI</h2>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCaraAdmin("anverso")}
            className={`rounded-md px-3 py-1.5 transition ${
              cara === "anverso" ? "bg-white text-[#1D4ED8] shadow-sm" : "text-slate-600"
            }`}
          >
            Anverso
          </button>
          <button
            type="button"
            onClick={() => setCaraAdmin("reverso")}
            className={`rounded-md px-3 py-1.5 transition ${
              cara === "reverso" ? "bg-white text-[#1D4ED8] shadow-sm" : "text-slate-600"
            }`}
          >
            Reverso
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Degradado, líneas geométricas y balón de fondo en anverso. CR80 85,6 × 53,98 mm.
      </p>

      {cara === "anverso" ? anversoCard : reversoCard}
    </section>
  );
}
