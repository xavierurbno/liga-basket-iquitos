"use client";

import { useState } from "react";
import QRCode from "qrcode";
import type { GenerateCarnetPDFProps } from "@/lib/types/carnet";
import {
  escalarFotoCarnetParaImpresion300Dpi,
  escalarLogoParaPdf,
} from "@/lib/pdf/imagenImpresion";
import {
  generarCarnetJugadorPdf,
  type CarnetJugadorInput,
} from "@/lib/pdf/carnetJugadorPdf";

async function fetchUrlToPngDataUrl(
  url: string | null,
  cache: RequestCache = "force-cache",
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors", cache });
    if (!res.ok) return null;
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function buildPlayerValidationUrl(playerId: string, baseOrigin: string): string | null {
  const id = playerId?.trim();
  if (!id) return null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || baseOrigin;
  if (!siteUrl) return null;
  return `${siteUrl.replace(/\/+$/, "")}/validar/${encodeURIComponent(id)}`;
}

export function GenerateCarnetPDF({
  label = "Carnet",
  className = "rounded-lg border border-[#BFDBFE] bg-white px-2.5 py-1 text-xs font-semibold text-[#1D4ED8] hover:bg-blue-50 disabled:opacity-60",
  ...props
}: GenerateCarnetPDFProps) {
  const [cargando, setCargando] = useState(false);

  async function generar() {
    setCargando(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const { getInstitutionalLogosAction } = await import("@/lib/actions/assets");
      const logosRes = await getInstitutionalLogosAction();

      const [ligaRaw, clubRaw, fotoRaw] = await Promise.all([
        Promise.resolve(logosRes.success ? logosRes.ligaBase64 : null),
        fetchUrlToPngDataUrl(props.clubLogoUrl, "force-cache"),
        props.photoUrl ? fetchUrlToPngDataUrl(props.photoUrl, "force-cache") : null,
      ]);

      const validationUrl = buildPlayerValidationUrl(props.playerId, base);

      const [ligaLogo, clubLogo, fotoCarnet, validationQrPngDataUrl] = await Promise.all([
        ligaRaw ? escalarLogoParaPdf(ligaRaw, 600) : null,
        clubRaw ? escalarLogoParaPdf(clubRaw, 400) : null,
        fotoRaw ? escalarFotoCarnetParaImpresion300Dpi(fotoRaw) : null,
        validationUrl
          ? QRCode.toDataURL(validationUrl, {
              errorCorrectionLevel: "M",
              margin: 0,
              width: 180,
              color: { dark: "#0f172a", light: "#FFFFFF" },
            })
          : Promise.resolve<string | null>(null),
      ]);

      const input: CarnetJugadorInput = {
        playerId: props.playerId,
        name: props.name,
        lastname: props.lastname,
        documentType: props.documentType,
        documentNumber: props.documentNumber,
        fechaNacimientoIso: props.fechaNacimientoIso,
        clubName: props.clubName,
        categoriaNombre: props.categoriaDetalle,
        carnetNumber: props.carnetNumber,
        fotoPngDataUrl: fotoCarnet,
        ligaLogoPngDataUrl: ligaLogo,
        clubLogoPngDataUrl: clubLogo,
        validationQrPngDataUrl,
        generatedAtIso: new Date().toISOString(),
      };

      const blob = generarCarnetJugadorPdf(input);
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(blob);
      enlace.download = `${props.fileName.replace(/\.pdf$/i, "")}.pdf`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void generar();
      }}
      disabled={cargando}
      className={className}
    >
      {cargando ? "…" : label}
    </button>
  );
}
