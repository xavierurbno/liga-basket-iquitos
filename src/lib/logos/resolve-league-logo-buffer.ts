import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { settingsRepository } from "@/repositories/settingsRepository";
import { resolveWatermarkLogoPath } from "@/lib/logos/resolve-watermark-logo";

async function fetchRemoteImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Logo PNG para marca de agua / PDF.
 * - Con `leagueId`: solo `login_logo_url` de esa liga (sin sustituir por Iquitos).
 * - Sin `leagueId`: archivo global en `public/logos` (liga principal).
 */
export async function resolveLeagueLogoBuffer(leagueId?: string | null): Promise<Buffer | null> {
  if (leagueId?.trim()) {
    const settings = await settingsRepository.getLeagueSettings(leagueId.trim());
    const url = settings?.loginLogoUrl?.trim();
    if (url) {
      const remote = await fetchRemoteImageBuffer(url);
      if (remote) {
        return await sharp(remote).png().toBuffer();
      }
    }
    return null;
  }

  const fallbackPath = await resolveWatermarkLogoPath();
  return fs.readFile(fallbackPath);
}

/** Data URL base64 para PDFs en cliente (federación fija + liga por id). */
export async function resolveLeagueLogoPngDataUrl(
  leagueId?: string | null,
  maxWidth = 300,
): Promise<string | null> {
  try {
    const buf = await resolveLeagueLogoBuffer(leagueId);
    if (!buf) return null;
    const processed = await sharp(buf).resize(maxWidth).png().toBuffer();
    return `data:image/png;base64,${processed.toString("base64")}`;
  } catch (e) {
    console.warn("[resolveLeagueLogoPngDataUrl]", e);
    return null;
  }
}

export async function resolveFederationLogoPngDataUrl(maxWidth = 200): Promise<string | null> {
  try {
    const logosDir = path.resolve(process.cwd(), "public", "logos");
    const fedPath = path.join(logosDir, "federacion.png");
    const buf = await fs.readFile(fedPath);
    const processed = await sharp(buf).resize(maxWidth).png().toBuffer();
    return `data:image/png;base64,${processed.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Imagen remota o data URL → PNG base64 para PDFs. */
export async function resolveImageUrlToPngDataUrl(
  url: string | null | undefined,
  maxWidth = 400,
): Promise<string | null> {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  try {
    let buf: Buffer | null = null;
    if (trimmed.startsWith("data:image")) {
      const base64 = trimmed.split(",")[1];
      if (!base64) return null;
      buf = Buffer.from(base64, "base64");
    } else {
      buf = await fetchRemoteImageBuffer(trimmed);
    }
    if (!buf) return null;
    const processed = await sharp(buf).resize(maxWidth).png().toBuffer();
    return `data:image/png;base64,${processed.toString("base64")}`;
  } catch (e) {
    console.warn("[resolveImageUrlToPngDataUrl]", e);
    return null;
  }
}

/**
 * Logo de federación: override por liga (`carnet_federation_logo_url`) o global en disco.
 */
export async function resolveFederationLogoForLeaguePngDataUrl(
  leagueId?: string | null,
  maxWidth = 200,
): Promise<string | null> {
  if (leagueId?.trim()) {
    const settings = await settingsRepository.getLeagueSettings(leagueId.trim());
    const override = settings?.carnetFederationLogoUrl?.trim();
    if (override) {
      const custom = await resolveImageUrlToPngDataUrl(override, maxWidth);
      if (custom) return custom;
    }
  }
  return resolveFederationLogoPngDataUrl(maxWidth);
}
