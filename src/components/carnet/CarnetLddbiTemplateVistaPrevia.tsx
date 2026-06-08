"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { splitApellidosParaCarnet } from "@/lib/carnet/carnetInstitucionalText";
import {
  layoutCarnetFirmaSlots,
  resolveCarnetFirmaSlots,
} from "@/lib/carnet/carnetSignatureMode";
import {
  CARNET_THEME_PRESET_LABELS,
  parseCarnetSignatureMode,
} from "@/lib/carnet/carnetTheme";
import {
  LDDBI_HEADER_PREVIEW_MM,
  resolveLddbiEncabezadoLineas,
} from "@/lib/carnet/lddbiEncabezadoText";
import {
  createLddbiTemplateMeasureDoc,
  layoutLddbiTemplateAnversoCampos,
  VALOR_LINE_HEIGHT_FACTOR,
} from "@/lib/carnet/lddbiTemplateAnversoLayout";
import {
  LDDBI_TEMPLATE,
  LDDBI_TEMPLATE_ASPECT_CSS,
  LDDBI_TEMPLATE_GOLD_HEX,
  LDDBI_TEMPLATE_WHITE_HEX,
  lddbiTemplateCorrelativoOffsetFromPhotoBottomMm,
  lddbiTemplateFotoFrameTopMm,
  lddbiTemplateFotoY,
} from "@/lib/carnet/lddbiTemplateLayout";
import {
  LDDBI_TEMPLATE_ANVERSO_PUBLIC_PATH,
  LDDBI_TEMPLATE_REVERSO_PUBLIC_PATH,
} from "@/lib/carnet/lddbiTemplatePaths";
import {
  LDDBI_PREMIUM_ACCENT_HEX,
  LDDBI_PREMIUM_PRIMARY_HEX,
} from "@/lib/carnet/lddbiPremiumTheme";
import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";

function mmX(mm: number) {
  return `${(mm / LDDBI_TEMPLATE.pageW) * 100}%`;
}

function mmY(mm: number) {
  return `${(mm / LDDBI_TEMPLATE.pageH) * 100}%`;
}

function mmW(mm: number) {
  return `${(mm / LDDBI_TEMPLATE.pageW) * 100}%`;
}

function mmH(mm: number) {
  return `${(mm / LDDBI_TEMPLATE.pageH) * 100}%`;
}

function previewFontSizeCqw(mm: number) {
  return `${((mm / LDDBI_TEMPLATE.pageW) * 100).toFixed(3)}cqw`;
}

/** Convierte puntos tipográficos a milímetros (1 pt = 25.4/72 mm). */
function ptToMm(pt: number): number {
  return (pt * 25.4) / 72;
}

function previewTopFromBaselineMm(baselineMm: number, capMm: number) {
  return mmY(Math.max(0, baselineMm - capMm));
}

export function CarnetLddbiTemplateVistaPrevia(props: CarnetVistaPreviaProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [cara, setCara] = useState<"anverso" | "reverso">("anverso");
  const [templateError, setTemplateError] = useState(false);

  const primary = props.portalPrimaryColor ?? LDDBI_PREMIUM_PRIMARY_HEX;
  const accent = props.portalAccentColor ?? LDDBI_PREMIUM_ACCENT_HEX;

  const { apellidoPaterno, apellidoMaterno } = useMemo(
    () => splitApellidosParaCarnet(props.lastname),
    [props.lastname],
  );
  const R = LDDBI_TEMPLATE.reverso;
  const A = LDDBI_TEMPLATE.anverso;
  const signatureMode = parseCarnetSignatureMode(props.carnetSignatureMode);
  const firmaPreviewSlots = layoutCarnetFirmaSlots(
    signatureMode,
    resolveCarnetFirmaSlots(signatureMode, {
      presidentDisplayName: props.presidentDisplayName,
      secretaryDisplayName: props.secretaryDisplayName,
      presidentSignatureUrl: props.presidentSignatureUrl,
      secretarySignatureUrl: props.secretarySignatureUrl,
    }),
  );

  const encabezado = useMemo(
    () =>
      resolveLddbiEncabezadoLineas(
        props.leagueDisplayName,
        props.carnetFederationDisplayName,
        props.carnetShowFederation !== false,
        props.leagueSlug,
        props.carnetSportLabel,
      ),
    [
      props.leagueDisplayName,
      props.carnetFederationDisplayName,
      props.carnetShowFederation,
      props.leagueSlug,
      props.carnetSportLabel,
    ],
  );
  const headerFedMm =
    encabezado.headerLayout === "single-prominent"
      ? LDDBI_HEADER_PREVIEW_MM.singleProminent
      : LDDBI_HEADER_PREVIEW_MM.dualFed;
  const headerLigaMm =
    encabezado.headerLayout === "single-prominent"
      ? LDDBI_HEADER_PREVIEW_MM.singleProminent
      : LDDBI_HEADER_PREVIEW_MM.dualLiga;

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

  const campos = useMemo(() => {
    const doc = createLddbiTemplateMeasureDoc();
    return layoutLddbiTemplateAnversoCampos(doc, {
      apellidoPaterno: apellidoPaterno.toUpperCase(),
      apellidoMaterno: apellidoMaterno.toUpperCase(),
      nombres: props.name.trim().toUpperCase(),
      fechaNacimiento: props.fechaNacimientoLabel,
      clubName: props.clubName.trim().toUpperCase(),
      categoriaNombre: props.categoriaNombre.trim().toUpperCase(),
    });
  }, [
    apellidoPaterno,
    apellidoMaterno,
    props.name,
    props.fechaNacimientoLabel,
    props.clubName,
    props.categoriaNombre,
  ]);
  const idFoto = A.fotoIdentificacion;

  const fotoY = lddbiTemplateFotoY();
  const fotoFrameTop = lddbiTemplateFotoFrameTopMm();
  const labelFont = previewFontSizeCqw(A.labelFontHeightMm);
  const valorFont = previewFontSizeCqw(A.valorFontHeightMm);
  const dniFont = previewFontSizeCqw(A.dniFontHeightMm);
  const carnetFont = previewFontSizeCqw(A.carnetFontHeightMm);
  const dniDisplay = props.documentNumber.trim().toUpperCase() || "—";
  const carnetDisplay = props.carnetNumberDisplay?.trim().toUpperCase() || "—";
  const presetLabel = CARNET_THEME_PRESET_LABELS.lddbi_template;

  const templateBg =
    cara === "anverso"
      ? LDDBI_TEMPLATE_ANVERSO_PUBLIC_PATH
      : LDDBI_TEMPLATE_REVERSO_PUBLIC_PATH;

  return (
    <section className="space-y-4" aria-label="Vista previa carnet plantilla PNG">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Vista previa del carnet</h2>
          <p className="text-[11px] text-slate-500">
            Preset activo: <strong>{presetLabel}</strong> (
            <code className="font-mono">lddbi_template</code>) — plantilla PNG original + datos
            superpuestos.
          </p>
        </div>
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

      {templateError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Coloca tus PNG en{" "}
          <code className="font-mono">public/carnet/lddbi-template/</code> (
          <code>anverso-template.png</code>, <code>reverso-template.png</code>). Mientras tanto
          se muestra un fondo provisional.
        </p>
      )}

      <div className="mx-auto w-full max-w-[520px] rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-lg">
        <div
          className="@container relative w-full"
          style={{ aspectRatio: LDDBI_TEMPLATE_ASPECT_CSS }}
        >
          {!templateError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={templateBg}
              alt=""
              className="block h-full w-full rounded-[6px]"
              onError={() => setTemplateError(true)}
            />
          )}

          {templateError && (
            <div
              className="absolute inset-0 flex flex-col rounded-[6px]"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
            >
              <div className="h-[19%] w-full opacity-90" style={{ backgroundColor: primary }} />
              <div className="flex-1 bg-white" />
              <div className="h-[11%] w-full" style={{ backgroundColor: accent }} />
            </div>
          )}

          {cara === "anverso" ? (
            <>
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 flex items-center"
                style={{ height: mmH(A.headerMm) }}
              >
                {props.federacionLogoUrl && props.carnetShowFederation !== false ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.federacionLogoUrl}
                    alt=""
                    className="absolute object-contain object-center"
                    style={{
                      left: mmX(A.margenMm),
                      top: mmY((A.headerMm - A.headerLogoFedMm) / 2),
                      width: mmW(A.headerLogoFedMm),
                      height: mmH(A.headerLogoFedMm),
                      maxWidth: mmW(A.headerLogoFedMm),
                      maxHeight: mmH(A.headerLogoFedMm),
                    }}
                  />
                ) : null}
                {props.leagueLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.leagueLogoUrl}
                    alt=""
                    className="absolute object-cover object-top-right"
                    style={{
                      right: mmX(A.margenMm),
                      top: mmY((A.headerMm - A.headerLogoLeagueAnversoMm) / 2),
                      width: mmW(A.headerLogoLeagueAnversoMm),
                      height: mmH(A.headerLogoLeagueAnversoMm),
                    }}
                  />
                ) : null}
                <div
                  className="absolute inset-x-0 flex flex-col items-center justify-center px-[18%] text-center leading-tight"
                  style={{ top: mmY(1.2), bottom: mmY(0.6) }}
                >
                  {encabezado.lineaFederacion != null ? (
                    <p
                      className="font-bold uppercase"
                      style={{
                        fontSize: previewFontSizeCqw(headerFedMm),
                        color: LDDBI_TEMPLATE_WHITE_HEX,
                      }}
                    >
                      {encabezado.lineaFederacion}
                    </p>
                  ) : null}
                  <p
                    className={`font-bold uppercase ${encabezado.lineaFederacion != null ? "mt-[0.15em]" : ""}`}
                    style={{
                      fontSize: previewFontSizeCqw(headerLigaMm),
                      color: "rgba(248,252,255,0.95)",
                    }}
                  >
                    {encabezado.lineaLiga}
                  </p>
                </div>
              </div>

            {campos.map((campo) => {
              const rowTop = previewTopFromBaselineMm(campo.y, A.previewCapHeightMm);
              return (
                <div
                  key={campo.id}
                  className="absolute inset-x-0 uppercase"
                  style={{ top: rowTop, minHeight: mmH(campo.rowAdvanceMm) }}
                >
                  <span
                    className="absolute font-bold"
                    style={{
                      left: mmX(A.labelX),
                      top: 0,
                      fontSize: labelFont,
                      color: LDDBI_TEMPLATE_GOLD_HEX,
                      textShadow: "0 0.5px 1px rgba(0,0,0,0.35)",
                    }}
                  >
                    {campo.etiqueta}
                  </span>
                  <span
                    className="absolute font-bold"
                    style={{
                      left: mmX(A.colonX + A.colonCharBoxMm / 2),
                      top: 0,
                      transform: "translateX(-50%)",
                      fontSize: labelFont,
                      color: LDDBI_TEMPLATE_GOLD_HEX,
                      textShadow: "0 0.5px 1px rgba(0,0,0,0.35)",
                    }}
                  >
                    :
                  </span>
                  <span
                    className="absolute font-bold whitespace-normal wrap-break-word"
                    style={{
                      left: mmX(A.valorX),
                      top: 0,
                      maxWidth: mmW(A.datosMaxW),
                      fontSize: valorFont,
                      lineHeight: VALOR_LINE_HEIGHT_FACTOR,
                      color: LDDBI_TEMPLATE_WHITE_HEX,
                      textShadow: "0 0.5px 1px rgba(0,0,0,0.45)",
                    }}
                  >
                    {campo.val}
                  </span>
                </div>
              );
            })}

            <div
              className="absolute rounded-md border-2"
              style={{
                left: mmX(A.foto.x - A.fotoBorderMm),
                top: mmY(fotoFrameTop),
                width: mmW(A.foto.w + A.fotoBorderMm * 2),
                height: mmH(A.foto.h + A.fotoBorderMm * 2),
                borderColor: accent,
              }}
            />
            <div
              className="absolute overflow-hidden rounded-sm bg-white"
              style={{
                left: mmX(A.foto.x),
                top: mmY(fotoY),
                width: mmW(A.foto.w),
                height: mmH(A.foto.h),
              }}
            >
              {props.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={props.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-[8px] font-bold text-slate-400">
                  SIN FOTO
                </span>
              )}
            </div>

            <p
              className="absolute text-center font-bold uppercase leading-none"
              style={{
                left: mmX(A.foto.x),
                width: mmW(A.foto.w),
                top: mmY(fotoY + A.foto.h + idFoto.dniYOffsetMm),
                fontSize: dniFont,
                color: LDDBI_TEMPLATE_WHITE_HEX,
                textShadow: "0 0.5px 1px rgba(0,0,0,0.45)",
              }}
            >
              {dniDisplay}
            </p>
            <p
              className="absolute text-center font-bold uppercase leading-tight"
              style={{
                left: mmX(A.foto.x),
                width: mmW(A.foto.w),
                top: mmY(fotoY + A.foto.h + lddbiTemplateCorrelativoOffsetFromPhotoBottomMm()),
                fontSize:
                  carnetDisplay.length > 14
                    ? previewFontSizeCqw(ptToMm(A.carnetFontPtCompact))
                    : carnetFont,
                color: LDDBI_TEMPLATE_WHITE_HEX,
                textShadow: "0 0.5px 1px rgba(0,0,0,0.45)",
              }}
            >
              {carnetDisplay}
            </p>
            </>
          ) : (
            <>
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 flex items-center"
                style={{ height: mmH(R.headerMm) }}
              >
                {props.federacionLogoUrl && props.carnetShowFederation !== false ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.federacionLogoUrl}
                    alt=""
                    className="absolute object-contain object-center"
                    style={{
                      left: mmX(A.margenMm),
                      top: mmY((R.headerMm - R.headerLogoFedMm) / 2),
                      width: mmW(R.headerLogoFedMm),
                      height: mmH(R.headerLogoFedMm),
                    }}
                  />
                ) : null}
                {props.leagueLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.leagueLogoUrl}
                    alt=""
                    className="absolute object-cover object-center"
                    style={{
                      right: mmX(A.margenMm),
                      top: mmY((R.headerMm - R.headerLogoLeagueMm) / 2),
                      width: mmW(R.headerLogoLeagueMm),
                      height: mmH(R.headerLogoLeagueMm),
                    }}
                  />
                ) : null}
                <div
                  className="absolute inset-x-0 flex flex-col items-center justify-center px-[18%] text-center leading-tight"
                  style={{ top: mmY(1.2), bottom: mmY(0.6) }}
                >
                  {encabezado.lineaFederacion != null ? (
                    <p
                      className="font-bold uppercase"
                      style={{
                        fontSize: previewFontSizeCqw(headerFedMm),
                        color: LDDBI_TEMPLATE_WHITE_HEX,
                      }}
                    >
                      {encabezado.lineaFederacion}
                    </p>
                  ) : null}
                  <p
                    className={`font-bold uppercase ${encabezado.lineaFederacion != null ? "mt-[0.15em]" : ""}`}
                    style={{
                      fontSize: previewFontSizeCqw(headerLigaMm),
                      color: "rgba(248,252,255,0.95)",
                    }}
                  >
                    {encabezado.lineaLiga}
                  </p>
                </div>
              </div>

              <p
                className="absolute text-center font-normal"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: mmY(R.legal.y),
                  width: mmW(R.legal.maxW),
                  fontSize: previewFontSizeCqw(R.legal.previewFontHeightMm),
                  lineHeight: 1.35,
                  color: "rgba(248,252,255,0.95)",
                  textShadow: "0 0.5px 1px rgba(0,0,0,0.35)",
                }}
              >
                {props.authorizationText}
              </p>

              {firmaPreviewSlots.map((slot) => (
                <div
                  key={slot.cargo}
                  className="absolute text-center"
                  style={{
                    left: mmX(slot.xMm),
                    top: mmY(R.firmas.y),
                    width: mmW(slot.wMm),
                  }}
                >
                  {slot.firmaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.firmaUrl}
                      alt=""
                      className="mx-auto h-6 max-w-full object-contain"
                    />
                  ) : null}
                  <div className="mt-1 border-b border-dotted border-white/50" />
                  <p
                    className="mt-0.5 font-bold wrap-break-word uppercase leading-tight"
                    style={{
                      fontSize: previewFontSizeCqw(R.firmas.nombreFontHeightMm),
                      color: LDDBI_TEMPLATE_WHITE_HEX,
                    }}
                  >
                    {(slot.nombre || "—").toUpperCase()}
                  </p>
                  <p
                    className="mt-0.5 uppercase leading-none"
                    style={{
                      fontSize: previewFontSizeCqw(R.firmas.cargoFontHeightMm),
                      color: "rgba(220,228,238,0.95)",
                    }}
                  >
                    {slot.cargo}
                  </p>
                </div>
              ))}

              <p
                className="absolute wrap-break-word font-normal uppercase leading-tight"
                style={{
                  left: mmX(R.pieVigencia.x),
                  top: previewTopFromBaselineMm(R.pieVigencia.y, R.pieVigencia.fontHeightMm),
                  maxWidth: mmW(R.pieVigencia.maxW),
                  fontSize: previewFontSizeCqw(R.pieVigencia.fontHeightMm),
                  color: "rgba(235,242,252,0.92)",
                  textShadow: "0 0.5px 1px rgba(0,0,0,0.35)",
                }}
              >
                VIGENCIA HASTA: {props.vigenciaLabel.toUpperCase()}
              </p>

              {qrDataUrl && (
                <div
                  className="absolute rounded bg-white p-0.5 shadow-sm"
                  style={{
                    left: mmX(R.qr.x),
                    top: mmY(R.qr.y),
                    width: mmW(R.qr.size),
                    height: mmH(R.qr.size),
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR validación" className="h-full w-full" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] leading-snug text-slate-500">
        Se usa tu plantilla PNG tal cual (sin cabecera ni pie extra). El sistema solo añade logos,
        textos de federación/liga y datos del jugador.
      </p>
    </section>
  );
}
