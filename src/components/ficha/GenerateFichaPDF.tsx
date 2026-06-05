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
import { prepareFichaPdfDataAction } from "@/lib/actions/ficha-pdf";
import {
  isServerActionNetworkError,
  serverActionNetworkMessage,
} from "@/lib/client/server-action-error";
import { resolveFichaLeagueTitle } from "@/lib/pdf/fichaInstitucionalTextos";

const FETCH_ASSET_TIMEOUT_MS = 12_000;

async function fetchUrlToPngDataUrl(
  url: string | null,
  cache: RequestCache = "force-cache",
): Promise<string | null> {
  if (!url) return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_ASSET_TIMEOUT_MS);
  try {
    const res = await fetch(url, { mode: "cors", cache, signal: controller.signal });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blobToPngDataUrl(blob);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
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

function resolveAbsoluteAssetUrl(url: string, origin: string): string {
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${origin.replace(/\/+$/, "")}${trimmed}`;
  }
  return trimmed;
}

export function GenerateFichaPDF(props: GenerateFichaPDFProps) {
  const [cargando, setCargando] = useState(false);

  async function generar() {
    setCargando(true);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";

      const prepared = await prepareFichaPdfDataAction(
        props.leagueId,
        props.teamId,
        props.players.map((j) => j.id),
      );
      if (!prepared.ok) {
        toast.error(prepared.error);
        return;
      }

      const logosRes = prepared.logos;

      let ligaRaw = logosRes.ligaBase64;
      if (!ligaRaw && props.leagueLogoUrl?.trim()) {
        ligaRaw = await fetchUrlToPngDataUrl(
          resolveAbsoluteAssetUrl(props.leagueLogoUrl, base),
          "force-cache",
        );
      }

      const [fedRaw, clubRaw] = await Promise.all([
        Promise.resolve(logosRes.federacionBase64),
        fetchUrlToPngDataUrl(props.clubLogoUrl, "force-cache"),
      ]);

      if (!ligaRaw && props.leagueId?.trim()) {
        toast.warning(
          "Esta liga no tiene logo en configuración; el PDF usará el nombre correcto pero sin logo de liga. Súbelo en la ficha de la liga o en /liga/configuración/.",
        );
      }

      const [fedUrl, ligaUrl, clubLogoPdf] = await Promise.all([
        fedRaw ? escalarLogoParaPdf(fedRaw, 520) : null,
        ligaRaw ? escalarLogoParaPdf(ligaRaw, 900) : null,
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

      const playerUrls = prepared.playerUrls;

      const sinQr = ordenados.filter((j) => !playerUrls[j.id]);
      if (sinQr.length > 0) {
        toast.warning(
          `${sinQr.length} deportista(s) sin QR en la ficha. Revisa permisos o vuelve a intentar.`,
        );
      }

      const qrOptions = {
        errorCorrectionLevel: "M" as const,
        margin: 0,
        width: 180,
        color: { dark: "#111111", light: "#FFFFFF" },
      };

      // Fotos y QR en paralelo por jugador; URLs de validación en una sola petición al servidor.
      const jugadoresPdf: FichaPdfJugadorInput[] = await Promise.all(
        ordenados.map(async (j) => {
          const [fotoPng, validationQrPngDataUrl] = await Promise.all([
            j.photoUrl ? fetchUrlToPngDataUrl(j.photoUrl, "force-cache") : Promise.resolve(null),
            playerUrls[j.id]
              ? QRCode.toDataURL(playerUrls[j.id]!, qrOptions)
              : Promise.resolve<string | null>(null),
          ]);
          return {
            name: j.name,
            lastname: j.lastname,
            documentType: j.documentType,
            documentNumber: j.documentNumber,
            fechaNacimientoIso: j.fechaNacimientoIso,
            fotoPngDataUrl: fotoPng,
            jerseyNumber: j.jerseyNumber,
            validationQrPngDataUrl,
          };
        }),
      );

      const coachName = nombreCompleto(props.coachName, props.coachLastname);
      const delegateName = nombreCompleto(props.delegateName, props.delegateLastname);
      const generatedAtIso = new Date().toISOString();
      const validationUrl = prepared.categoryValidationUrl;
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
        logosRes.leagueDisplayName || props.leagueDisplayName,
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
      toast.success("Ficha PDF descargada.");
    } catch (error) {
      console.error("[GenerateFichaPDF]", error);
      toast.error(
        isServerActionNetworkError(error)
          ? serverActionNetworkMessage()
          : "No se pudo generar el PDF. Revisa tu conexión o vuelve a intentar en unos segundos.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void generar().catch((error: unknown) => {
          console.error("[GenerateFichaPDF] unhandled", error);
          setCargando(false);
          toast.error(
            isServerActionNetworkError(error)
              ? serverActionNetworkMessage()
              : "No se pudo generar el PDF.",
          );
        });
      }}
      disabled={cargando}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
    >
      {cargando ? "Generando PDF…" : "Descargar ficha PDF"}
    </button>
  );
}
