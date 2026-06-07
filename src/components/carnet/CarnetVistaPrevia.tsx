"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { extractCarnetYear } from "@/lib/carnet/carnetColors";
import { resolveCarnetPremiumPaletteFromHex } from "@/lib/carnet/carnetPremiumTheme";
import {
  formatGeneroCarnetEtiqueta,
  splitApellidosParaCarnet,
} from "@/lib/carnet/carnetInstitucionalText";
import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";
import { splitFederationDisplayLines } from "@/lib/carnet/carnetTheme";
import { CarnetPdfVistaPrevia } from "@/components/carnet/CarnetPdfVistaPrevia";
import { isCarnetValidacionMode } from "@/lib/carnet/isCarnetValidacionMode";
import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";

const CR80_ASPECT = "85.6 / 53.98";
const ACCENT_BAND_PCT = `${(4 / 53.98) * 100}%`;

function CarnetShell({
  children,
  palette,
  className = "",
}: {
  children: ReactNode;
  palette: ReturnType<typeof resolveCarnetPremiumPaletteFromHex>;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full max-w-[440px] overflow-hidden rounded-lg shadow-lg ring-1 ring-slate-300/80 ${className}`}
      style={{
        aspectRatio: CR80_ASPECT,
        background: `linear-gradient(180deg, ${palette.topHex} 0%, ${palette.bottomHex} 72%)`,
      }}
    >
      {children}
    </div>
  );
}

function FranjaAcento({
  left,
  right,
  accentHex,
}: {
  left: string;
  right?: string;
  accentHex: string;
}) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-[3px]"
      style={{
        height: ACCENT_BAND_PCT,
        backgroundColor: accentHex,
      }}
    >
      <span className="text-[6px] font-bold uppercase tracking-wide text-white">{left}</span>
      {right ? (
        <span className="text-[6px] font-bold uppercase text-white/95">{right}</span>
      ) : null}
    </div>
  );
}

function EncabezadoPremium({
  leagueTitle,
  leagueLogoUrl,
  federacionLogoUrl,
  subtitle,
}: {
  leagueTitle: string;
  leagueLogoUrl: string | null;
  federacionLogoUrl: string | null;
  subtitle?: string;
}) {
  return (
    <header className="relative z-10 border-b border-slate-300/60 px-2 pb-1 pt-1.5">
      <div className="flex items-center gap-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          {leagueLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leagueLogoUrl} alt="" className="max-h-full max-w-full object-contain" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[7px] font-bold uppercase leading-tight tracking-tight text-slate-900">
            {leagueTitle}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-[5.5px] font-medium uppercase tracking-wider text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        {federacionLogoUrl ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={federacionLogoUrl} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="h-8 w-8 shrink-0" />
        )}
      </div>
    </header>
  );
}

function CarnetAnversoPreview(
  props: CarnetVistaPreviaProps & {
    palette: ReturnType<typeof resolveCarnetPremiumPaletteFromHex>;
    leagueTitle: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    generoLabel: string;
    carnetYear: string;
  },
) {
  const campos: [string, string][] = [
    ["APELLIDO P.", props.apellidoPaterno],
    ["APELLIDO M.", props.apellidoMaterno],
    ["NOMBRE", props.name.trim().toUpperCase()],
    ["F. DE NAC.", props.fechaNacimientoLabel],
    ["CLUB", props.clubName.trim().toUpperCase()],
    ["CATEGORÍA", props.categoriaNombre.trim().toUpperCase()],
    ["GÉNERO", props.generoLabel],
  ];

  return (
    <CarnetShell palette={props.palette}>
      <div
        className="flex h-full flex-col pb-[7.5%]"
        style={{ paddingBottom: ACCENT_BAND_PCT }}
      >
        <EncabezadoPremium
          leagueTitle={props.leagueTitle}
          leagueLogoUrl={props.leagueLogoUrl}
          federacionLogoUrl={props.federacionLogoUrl}
        />

        <div className="flex min-h-0 flex-1 items-center gap-2 px-2 pb-1 pt-1.5">
          <div className="flex w-[38%] shrink-0 flex-col justify-center">
            <div className="overflow-hidden rounded-md border border-slate-300/80 bg-white shadow-sm">
              <div className="relative aspect-18/22 w-full">
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
            <p className="mt-1 text-[7px] font-bold text-slate-900">
              DNI: {props.documentNumber}
            </p>
            <p className="text-center text-[8px] font-bold text-slate-900">{props.carnetYear}</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center gap-[3px]">
            {campos.map(([label, value]) => (
              <p key={label} className="text-[7px] leading-tight">
                <span className="font-medium uppercase text-slate-500">{label} :</span>{" "}
                <span className="font-bold uppercase text-slate-900">{value}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
      <FranjaAcento
        accentHex={props.palette.accentHex}
        left="Credencial deportiva"
        right={props.carnetNumberDisplay ? `N° ${props.carnetNumberDisplay}` : undefined}
      />
    </CarnetShell>
  );
}

function CarnetReversoPreview(
  props: CarnetVistaPreviaProps & {
    palette: ReturnType<typeof resolveCarnetPremiumPaletteFromHex>;
    leagueTitle: string;
    qrDataUrl: string | null;
    validationCode: string;
    fedLines: [string, string] | null;
  },
) {
  return (
    <CarnetShell palette={props.palette}>
      <div
        className="relative z-10 flex h-full flex-col pb-[7.5%]"
        style={{ paddingBottom: ACCENT_BAND_PCT }}
      >
        <EncabezadoPremium
          leagueTitle={props.leagueTitle}
          leagueLogoUrl={props.leagueLogoUrl}
          federacionLogoUrl={props.federacionLogoUrl}
          subtitle="F.D.P.B. · Validación oficial"
        />

        <p className="px-3 pt-2 text-center text-[6.5px] font-normal leading-relaxed text-slate-800">
          {props.authorizationText}
        </p>

        <div className="flex flex-1 items-center gap-2.5 px-2.5 py-2">
          <div className="shrink-0 rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
            {props.qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.qrDataUrl}
                alt="QR validación"
                className="h-[3.1rem] w-[3.1rem]"
              />
            ) : (
              <div className="flex h-[3.1rem] w-[3.1rem] items-center justify-center text-[6px] text-slate-400">
                Sin QR
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-[7px] font-bold uppercase text-slate-900">Validación</p>
            <p className="text-[6px] leading-snug text-slate-500">
              Escanee el código QR en mesa de control
            </p>
            <p className="pt-1 font-mono text-[7px] font-bold" style={{ color: props.palette.accentHex }}>
              ID {props.validationCode}
            </p>
            {props.fedLines ? (
              <p className="text-[5.5px] leading-snug text-slate-500">
                {props.fedLines[0]}
                {props.fedLines[1] ? (
                  <>
                    <br />
                    {props.fedLines[1]}
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-2.5 pb-1">
          {(
            [
              { firma: props.presidentSignatureUrl, nombre: props.presidentDisplayName, cargo: "PRESIDENTE" },
              { firma: props.secretarySignatureUrl, nombre: props.secretaryDisplayName, cargo: "SECRETARIO" },
            ] as const
          ).map((b) => (
            <div key={b.cargo} className="text-center">
              <div className="relative mx-auto h-8 max-w-full">
                {b.firma ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.firma}
                    alt=""
                    className="absolute bottom-2 left-1/2 max-h-6 max-w-full -translate-x-1/2 object-contain"
                  />
                ) : null}
                <div className="absolute bottom-0 left-0 right-0 border-b border-dotted border-slate-400" />
              </div>
              <p className="mt-0.5 text-[6px] font-bold uppercase text-slate-900">
                {b.nombre.trim() || "—"}
              </p>
              <p className="text-[5px] uppercase text-slate-500">{b.cargo}</p>
            </div>
          ))}
        </div>
      </div>
      <FranjaAcento
        accentHex={props.palette.accentHex}
        left={`Vigencia: ${props.vigenciaLabel}`}
        right="Documento oficial"
      />
    </CarnetShell>
  );
}

function CarnetInstitutionalSoftVistaPrevia(props: CarnetVistaPreviaProps) {
  const esValidacion = isCarnetValidacionMode(props);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [caraAdmin, setCaraAdmin] = useState<"anverso" | "reverso">("anverso");
  const cara = esValidacion ? "anverso" : caraAdmin;

  const paletteAnverso = resolveCarnetPremiumPaletteFromHex(
    props.portalPrimaryColor,
    props.portalAccentColor,
    "anverso",
  );
  const paletteReverso = resolveCarnetPremiumPaletteFromHex(
    props.portalPrimaryColor,
    props.portalAccentColor,
    "reverso",
  );
  const leagueTitle = resolveFichaLeagueTitle(props.leagueDisplayName);
  const { apellidoPaterno, apellidoMaterno } = useMemo(
    () => splitApellidosParaCarnet(props.lastname),
    [props.lastname],
  );
  const generoLabel = formatGeneroCarnetEtiqueta(props.gender);
  const carnetYear = extractCarnetYear(props.carnetNumberDisplay);
  const validationCode = useMemo(() => {
    if (props.validationUrl) {
      const seg = props.validationUrl.split("/").filter(Boolean).pop();
      if (seg) return seg.slice(0, 12).toUpperCase();
    }
    return props.playerId.replace(/-/g, "").slice(0, 12).toUpperCase();
  }, [props.validationUrl, props.playerId]);

  const fedLines = splitFederationDisplayLines(
    props.carnetFederationDisplayName ?? null,
    props.carnetShowFederation !== false,
  );

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
      color: { dark: "#1a1c22", light: "#FFFFFF" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [props.validationUrl]);

  const anversoProps = {
    ...props,
    palette: paletteAnverso,
    leagueTitle,
    apellidoPaterno,
    apellidoMaterno,
    generoLabel,
    carnetYear,
  };

  if (esValidacion) {
    return (
      <section className="flex justify-center" aria-label="Credencial deportiva">
        <CarnetAnversoPreview {...anversoProps} />
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Vista previa del carnet">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-800">Vista previa — diseño institucional</h2>
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
        Fondo degradado suave, logos moderados, franja de acento con el color de la liga. CR80
        85,6 × 53,98 mm.
      </p>

      <div className="hidden gap-6 lg:grid lg:grid-cols-2 lg:justify-items-center">
        <div className="space-y-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Anverso
          </p>
          <CarnetAnversoPreview {...anversoProps} />
        </div>
        <div className="space-y-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Reverso
          </p>
          <CarnetReversoPreview
            {...props}
            palette={paletteReverso}
            leagueTitle={leagueTitle}
            qrDataUrl={qrDataUrl}
            validationCode={validationCode}
            fedLines={fedLines}
          />
        </div>
      </div>

      <div className="flex justify-center lg:hidden">
        {cara === "anverso" ? (
          <CarnetAnversoPreview {...anversoProps} />
        ) : (
          <CarnetReversoPreview
            {...props}
            palette={paletteReverso}
            leagueTitle={leagueTitle}
            qrDataUrl={qrDataUrl}
            validationCode={validationCode}
            fedLines={fedLines}
          />
        )}
      </div>
    </section>
  );
}

export function CarnetVistaPrevia(props: CarnetVistaPreviaProps) {
  return <CarnetPdfVistaPrevia {...props} />;
}
