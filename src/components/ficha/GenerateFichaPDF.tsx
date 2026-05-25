"use client";

import { useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { GenerateFichaPDFJugador, GenerateFichaPDFProps } from "@/lib/types/ficha";
import { escalarLogoParaPdf } from "@/lib/pdf/imagenImpresion";
import {
  generarFichaCategoriaPdf,
  type FichaCategoriaPdfInput,
  type FichaPdfJugadorInput,
  type FichaPdfStaffInput,
} from "@/lib/pdf/fichaCategoriaPdf";
import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";

async function fetchUrlToPngDataUrl(
  url: string | null,
  cache: RequestCache = "force-cache"
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors", cache });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blobToPngDataUrl(blob);
  } catch {
    return null;
  }
}

async function blobToPngDataUrl(blob: Blob): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return canvas.toDataURL("image/png");
}

function nombreCompleto(n: string | null, a: string | null): string {
  return [n, a].filter(Boolean).join(" ").trim();
}

function buildValidationUrl(teamId: string, baseOrigin: string): string | null {
  const cleanTeamId = teamId?.trim();
  if (!cleanTeamId) return null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || baseOrigin;
  if (!siteUrl) return null;
  const normalizedSite = siteUrl.replace(/\/+$/, "");
  return `${normalizedSite}/validar/${encodeURIComponent(cleanTeamId)}`;
}

export function GenerateFichaPDF(props: GenerateFichaPDFProps) {
  const [cargando, setCargando] = useState(false);

  async function generar() {
    setCargando(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";

      const { getInstitutionalLogosAction } = await import("@/lib/actions/assets");
      const logosRes = await getInstitutionalLogosAction(props.leagueId);

      const [fedRaw, ligaRaw, clubRaw] = await Promise.all([
        Promise.resolve(logosRes.success ? logosRes.federacionBase64 : null),
        Promise.resolve(logosRes.success ? logosRes.ligaBase64 : null),
        fetchUrlToPngDataUrl(props.clubLogoUrl, "force-cache"),
      ]);
      if (logosRes.success && !ligaRaw && props.leagueId?.trim()) {
        toast.warning(
          "Esta liga no tiene logo en configuración; el PDF usará el nombre correcto pero sin logo de liga. Súbelo en la ficha de la liga o en /liga/configuración/.",
        );
      }

      const [fedUrl, ligaUrl, clubLogoPdf] = await Promise.all([
        fedRaw ? escalarLogoParaPdf(fedRaw) : null,
        ligaRaw ? escalarLogoParaPdf(ligaRaw, 2800) : null,
        clubRaw ? escalarLogoParaPdf(clubRaw, 1200) : null,
      ]);

      if (!fedUrl) {
        toast.error("No se pudo cargar el logo de la federación.");
        return;
      }

      const ordenados = [...props.players].sort((x, y) => {
        const c = x.lastname.localeCompare(y.lastname, "es", { sensitivity: "base" });
        if (c !== 0) return c;
        return x.name.localeCompare(y.name, "es", { sensitivity: "base" });
      });

      // Carga de fotos en paralelo: evita espera secuencial por cada jugador.
      const jugadoresPdf: FichaPdfJugadorInput[] = await Promise.all(
        ordenados.map(async (j) => {
          const fotoPng = j.photoUrl
            ? await fetchUrlToPngDataUrl(j.photoUrl, "force-cache")
            : null;
          return {
            name: j.name,
            lastname: j.lastname,
            documentType: j.documentType,
            documentNumber: j.documentNumber,
            fechaNacimientoIso: j.fechaNacimientoIso,
            fotoPngDataUrl: fotoPng,
            jerseyNumber: j.jerseyNumber,
          };
        })
      );

      const coachName = nombreCompleto(props.coachName, props.coachLastname);
      const delegateName = nombreCompleto(props.delegateName, props.delegateLastname);
      const generatedAtIso = new Date().toISOString();
      const validationUrl = buildValidationUrl(props.teamId, base);
      const [validationQrPngDataUrl, entFotoRaw, delFotoRaw] = await Promise.all([
        validationUrl
          ? QRCode.toDataURL(validationUrl, {
              errorCorrectionLevel: "M",
              margin: 0,
              width: 220,
              color: { dark: "#111111", light: "#FFFFFF" },
            })
          : Promise.resolve<string | null>(null),
        props.coachPhotoUrl
          ? fetchUrlToPngDataUrl(props.coachPhotoUrl, "force-cache")
          : Promise.resolve<string | null>(null),
        props.delegatePhotoUrl
          ? fetchUrlToPngDataUrl(props.delegatePhotoUrl, "force-cache")
          : Promise.resolve<string | null>(null),
      ]);
      const [entFoto, delFoto] = await Promise.all([
        entFotoRaw ? escalarLogoParaPdf(entFotoRaw, 900) : null,
        delFotoRaw ? escalarLogoParaPdf(delFotoRaw, 900) : null,
      ]);

      const entrenador: FichaPdfStaffInput = {
        etiqueta: "Entrenador",
        nombreCompleto: coachName || "No registrado",
        documentType: props.coachDocumentType,
        documentNumber: props.coachDocumentNumber,
        fotoPngDataUrl: entFoto,
      };
      const delegado: FichaPdfStaffInput = {
        etiqueta: "Delegado",
        nombreCompleto: delegateName || "No registrado",
        documentType: props.delegateDocumentType,
        documentNumber: props.delegateDocumentNumber,
        fotoPngDataUrl: delFoto,
      };

      const leagueTitle = resolveFichaLeagueTitle(
        logosRes.success ? logosRes.leagueDisplayName : props.leagueDisplayName,
      );

      const input: FichaCategoriaPdfInput = {
        leagueDisplayName: leagueTitle,
        clubName: props.clubName,
        categoriaDetalle: props.categoriaDetalle,
        federacionLogoPngDataUrl: fedUrl,
        ligaLogoPngDataUrl: ligaUrl,
        clubLogoPngDataUrl: clubLogoPdf,
        entrenador,
        delegado,
        players: jugadoresPdf,
        generatedAtIso,
        validationQrPngDataUrl,
      };

      const blob = generarFichaCategoriaPdf(input);
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
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
    >
      {cargando ? "Generando PDF…" : "Descargar ficha PDF"}
    </button>
  );
}
