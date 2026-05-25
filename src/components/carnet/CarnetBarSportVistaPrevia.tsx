"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  formatGeneroCarnetEtiqueta,
  splitApellidosParaCarnet,
} from "@/lib/carnet/carnetInstitucionalText";
import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";
import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";

const CR80_ASPECT = "85.6 / 53.98";

export function CarnetBarSportVistaPrevia(props: CarnetVistaPreviaProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [cara, setCara] = useState<"anverso" | "reverso">("anverso");

  const primary = props.portalPrimaryColor ?? "#8b1538";
  const accent = props.portalAccentColor ?? primary;
  const leagueTitle = resolveFichaLeagueTitle(props.leagueDisplayName);
  const sportLabel = (props.carnetSportLabel || "BÁSQUET").toUpperCase();
  const fedTitle =
    props.carnetShowFederation !== false && props.carnetFederationDisplayName?.trim()
      ? props.carnetFederationDisplayName.trim().toUpperCase()
      : leagueTitle;
  const showFed = props.carnetShowFederation !== false;

  const { apellidoPaterno, apellidoMaterno } = useMemo(
    () => splitApellidosParaCarnet(props.lastname),
    [props.lastname],
  );
  const generoLabel = formatGeneroCarnetEtiqueta(props.gender);

  useEffect(() => {
    if (!props.validationUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(props.validationUrl, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 140,
      color: { dark: "#1a1c22", light: "#FFFFFF" },
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
    ["CLUB", props.clubName.trim().toUpperCase()],
    ["CATEGORÍA", props.categoriaNombre.trim().toUpperCase()],
    ["GÉNERO", generoLabel],
  ];

  return (
    <section className="space-y-4" aria-label="Vista previa carnet franjas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-800">Vista previa — plantilla franjas</h2>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCara("anverso")}
            className={`rounded-md px-3 py-1.5 transition ${
              cara === "anverso" ? "bg-white text-[#1D4ED8] shadow-sm" : "text-slate-600"
            }`}
          >
            Anverso
          </button>
          <button
            type="button"
            onClick={() => setCara("reverso")}
            className={`rounded-md px-3 py-1.5 transition ${
              cara === "reverso" ? "bg-white text-[#1D4ED8] shadow-sm" : "text-slate-600"
            }`}
          >
            Reverso
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Estilo inspirado en credenciales de fútbol/vóley, parametrizado para ligas de básquet (colores,
        federación opcional, gráfico central).
      </p>

      {cara === "anverso" ? (
        <div
          className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-300/80"
          style={{ aspectRatio: CR80_ASPECT }}
        >
          <header
            className="flex items-center gap-1 px-2 py-1.5"
            style={{ backgroundColor: primary, minHeight: "16%" }}
          >
            {showFed && props.federacionLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.federacionLogoUrl} alt="" className="h-7 w-7 object-contain" />
            ) : (
              <div className="h-7 w-7" />
            )}
            <p className="min-w-0 flex-1 text-center text-[5.5px] font-bold uppercase leading-tight text-white">
              {fedTitle}
            </p>
            <span className="text-[7px] font-bold text-white">{sportLabel}</span>
          </header>

          <div className="relative flex gap-1 px-2 py-2" style={{ minHeight: "68%" }}>
            <div className="flex w-[32%] flex-col justify-center gap-1">
              <p className="text-[6px] font-bold uppercase text-slate-800">Datos del deportista</p>
              {campos.map(([k, v]) => (
                <p key={k} className="text-[6px] leading-tight">
                  <span className="font-semibold text-slate-500">{k}:</span>{" "}
                  <span className="font-bold text-slate-900">{v}</span>
                </p>
              ))}
            </div>
            <div className="flex w-[26%] items-center justify-center bg-slate-50">
              {props.carnetSportGraphicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.carnetSportGraphicUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain opacity-90"
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-200">BÁSQUET</span>
              )}
            </div>
            <div className="flex w-[34%] flex-col items-center justify-center">
              <div
                className="w-full overflow-hidden rounded-md bg-white p-[2px]"
                style={{ boxShadow: `0 0 0 2px ${accent}` }}
              >
                <div className="relative aspect-[5/6] w-full">
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
              <p className="mt-1 text-[5px] text-slate-500">F. nac. {props.fechaNacimientoLabel}</p>
              {props.carnetNumberDisplay ? (
                <p className="text-[6px] font-bold" style={{ color: primary }}>
                  N° {props.carnetNumberDisplay}
                </p>
              ) : null}
            </div>
          </div>

          <footer
            className="absolute bottom-0 left-0 right-0 px-2 py-1 text-center"
            style={{ backgroundColor: primary, height: "9%" }}
          >
            <p className="text-[5.5px] font-bold uppercase text-white">{leagueTitle}</p>
          </footer>
        </div>
      ) : (
        <div
          className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-300/80"
          style={{ aspectRatio: CR80_ASPECT }}
        >
          <header
            className="flex items-center gap-2 px-2 py-1"
            style={{ backgroundColor: primary, minHeight: "22%" }}
          >
            <div className="shrink-0 rounded bg-white p-0.5">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" className="h-11 w-11" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center text-[6px] text-slate-400">
                  QR
                </div>
              )}
            </div>
            <div className="flex flex-1 justify-center">
              {(showFed ? props.federacionLogoUrl : props.leagueLogoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(showFed ? props.federacionLogoUrl : props.leagueLogoUrl) ?? ""}
                  alt=""
                  className="h-9 object-contain"
                />
              ) : null}
            </div>
            <div className="shrink-0 text-right text-[6px] font-bold uppercase text-white">
              <p>Deportista</p>
              <p className="mt-0.5 font-normal text-[5px]">Vigencia</p>
              <p className="font-normal">{props.vigenciaLabel}</p>
            </div>
          </header>

          <div className="space-y-2 px-3 py-2 pb-10">
            <p className="text-center text-[6px] leading-relaxed text-slate-700">
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
                    <img src={b.firma} alt="" className="mx-auto h-5 object-contain" />
                  ) : null}
                  <div className="mx-auto mt-0.5 w-full border-b border-dotted border-slate-300" />
                  <p className="text-[5px] font-bold uppercase">{b.nombre || "—"}</p>
                  <p className="text-[4.5px] text-slate-500">{b.cargo}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-[5px] font-bold uppercase text-slate-600">
              Vigencia hasta: {props.vigenciaLabel}
            </p>
          </div>

          <footer
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1"
            style={{ backgroundColor: primary, height: "9%" }}
          >
            <span className="font-mono text-[4px] text-white">
              {props.playerId.replace(/-/g, "").slice(0, 16).toUpperCase()}
            </span>
            {props.leagueLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.leagueLogoUrl} alt="" className="h-5 object-contain" />
            ) : null}
            <span className="text-[5px] font-bold text-white">JUGADOR</span>
          </footer>
        </div>
      )}
    </section>
  );
}
