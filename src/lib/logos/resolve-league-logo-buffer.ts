import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { DEFAULT_PUBLIC_LEAGUE_LOGO } from "@/lib/logos/public-league-logo";
import { resolvePublicLeagueLogoUrlFromDisk } from "@/lib/logos/resolve-public-league-logo.server";
import { resolveWatermarkLogoPath } from "@/lib/logos/resolve-watermark-logo";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";
import { settingsRepository } from "@/repositories/settingsRepository";
import { leagueRepository } from "@/repositories/league.repository";

async function readPublicAssetBuffer(relativeUrl: string): Promise<Buffer | null> {
  const rel = relativeUrl.replace(/^\//, "");
  try {
    return await fs.readFile(path.join(process.cwd(), "public", rel));
  } catch {
    return null;
  }
}

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
 * - Con `leagueId`: `login_logo_url` de la liga; si falta y es la liga principal del portal,
 *   mismo fallback que la vista previa (`public/logos/…`).
 * - Sin `leagueId`: archivo global en `public/logos` (liga principal).
 */
export async function resolveLeagueLogoBuffer(leagueId?: string | null): Promise<Buffer | null> {
  if (leagueId?.trim()) {
    const id = leagueId.trim();
    const settings = await settingsRepository.getLeagueSettings(id);
    const url = settings?.loginLogoUrl?.trim();
    if (url) {
      const remote = await fetchRemoteImageBuffer(url);
      if (remote) {
        return await sharp(remote).png().toBuffer();
      }
    }

    const leagueRow = await leagueRepository.findById(id);
    if (leagueRow && isPrimaryPortalLeagueSlug(leagueRow.slug)) {
      const diskUrl = (await resolvePublicLeagueLogoUrlFromDisk()) ?? DEFAULT_PUBLIC_LEAGUE_LOGO;
      const localBuf = await readPublicAssetBuffer(diskUrl);
      if (localBuf) {
        return await sharp(localBuf).png().toBuffer();
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

/** Color obligatorio para anverso; no reutilizar el PNG B/N de `federacion-mono.png`. */
export const FEDERATION_COLOR_PUBLIC_PATHS = [
  "/logos/federacion-color.png",
  "/logos/federacion.png",
] as const;
const FEDERATION_MONO_PUBLIC_PATH = "/logos/federacion-mono.png";

async function publicAssetToPngDataUrl(
  relativeUrl: string,
  maxWidth: number,
): Promise<string | null> {
  const buf = await readPublicAssetBuffer(relativeUrl);
  if (!buf) return null;
  const processed = await sharp(buf).resize(maxWidth).png().toBuffer();
  return `data:image/png;base64,${processed.toString("base64")}`;
}

/** Logo de federación a color (`federacion.png` o `federacion-color.png`). */
export async function resolveFederationLogoPngDataUrl(maxWidth = 200): Promise<string | null> {
  for (const rel of FEDERATION_COLOR_PUBLIC_PATHS) {
    const dataUrl = await publicAssetToPngDataUrl(rel, maxWidth);
    if (dataUrl) return dataUrl;
  }
  return null;
}

/** Logo B/N de federación para reverso clásico. */
export async function resolveFederationMonoLogoPngDataUrl(
  maxWidth = 200,
): Promise<string | null> {
  return publicAssetToPngDataUrl(FEDERATION_MONO_PUBLIC_PATH, maxWidth);
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

/** Federación B/N: `public/logos/federacion-mono.png` (reverso clásico). */
export async function resolveFederationMonoLogoForLeaguePngDataUrl(
  leagueId?: string | null,
  maxWidth = 200,
): Promise<string | null> {
  const mono = await resolveFederationMonoLogoPngDataUrl(maxWidth);
  if (mono) return mono;
  return resolveFederationLogoForLeaguePngDataUrl(leagueId, maxWidth);
}

const LEAGUE_MONO_PUBLIC_PATH = "/logos/liga-mono.png";

/** Logo B/N global en `public/logos/liga-mono.png` (reverso clásico). */
export async function resolveLeagueMonoLogoPngDataUrl(
  maxWidth = 300,
): Promise<string | null> {
  try {
    const buf = await readPublicAssetBuffer(LEAGUE_MONO_PUBLIC_PATH);
    if (!buf) return null;
    const processed = await sharp(buf).resize(maxWidth).png().toBuffer();
    return `data:image/png;base64,${processed.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Logo B/N de liga para reverso clásico: override por liga o `public/logos/liga-mono.png`.
 */
export async function resolveLeagueMonoLogoForLeaguePngDataUrl(
  leagueId?: string | null,
  maxWidth = 300,
): Promise<string | null> {
  if (leagueId?.trim()) {
    const settings = await settingsRepository.getLeagueSettings(leagueId.trim());
    const override = settings?.carnetLeagueMonoLogoUrl?.trim();
    if (override) {
      const custom = await resolveImageUrlToPngDataUrl(override, maxWidth);
      if (custom) return custom;
    }
  }
  return resolveLeagueMonoLogoPngDataUrl(maxWidth);
}

/** Override en configuración de liga o archivo global en `public/logos/liga-mono.png`. */
export async function hasLeagueMonoLogoAvailable(
  leagueId?: string | null,
): Promise<boolean> {
  if (leagueId?.trim()) {
    const settings = await settingsRepository.getLeagueSettings(leagueId.trim());
    if (settings?.carnetLeagueMonoLogoUrl?.trim()) return true;
  }
  try {
    const rel = LEAGUE_MONO_PUBLIC_PATH.replace(/^\//, "");
    await fs.access(path.join(process.cwd(), "public", rel));
    return true;
  } catch {
    return false;
  }
}
