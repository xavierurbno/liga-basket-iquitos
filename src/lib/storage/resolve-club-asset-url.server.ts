import "server-only";

import path from "path";
import fs from "fs/promises";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";

const ASSETS_BUCKET = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";

export const CLUB_ASSET_INTRANET_TTL_SEC = 3600;

/** Extrae el path relativo dentro del bucket `club-assets`. */
export function extractClubAssetStoragePath(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const trimmed = stored.trim();

  const markers = [
    `/storage/v1/object/public/${ASSETS_BUCKET}/`,
    `/storage/v1/object/sign/${ASSETS_BUCKET}/`,
    `/storage/v1/object/authenticated/${ASSETS_BUCKET}/`,
  ];
  for (const marker of markers) {
    const idx = trimmed.indexOf(marker);
    if (idx >= 0) {
      const objectPath = trimmed.slice(idx + marker.length).split("?")[0];
      return decodeURIComponent(objectPath);
    }
  }

  if (trimmed.startsWith(`${ASSETS_BUCKET}/`)) {
    return trimmed.slice(ASSETS_BUCKET.length + 1);
  }

  if (/^(leagues|clubs|logos|sponsors|directivos)\//.test(trimmed)) {
    return trimmed;
  }

  return null;
}

async function publicStaticAssetExists(relativeUrl: string): Promise<boolean> {
  try {
    await fs.access(path.join(process.cwd(), "public", relativeUrl.replace(/^\//, "")));
    return true;
  } catch {
    return false;
  }
}

/**
 * URL de visualización para logos/fotos en `club-assets` (bucket privado → firmada).
 * Rutas estáticas en `public/` se devuelven tal cual si el archivo existe.
 */
export async function resolveClubAssetUrl(
  stored: string | null | undefined,
  options?: { expiresInSec?: number },
): Promise<string | null> {
  if (!stored?.trim()) return null;
  const trimmed = stored.trim();

  if (trimmed.startsWith("/") && !trimmed.includes("/storage/v1/object/")) {
    return (await publicStaticAssetExists(trimmed)) ? trimmed : null;
  }

  const storagePath = extractClubAssetStoragePath(trimmed);
  if (!storagePath) {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return null;
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(ASSETS_BUCKET)
      .createSignedUrl(storagePath, options?.expiresInSec ?? CLUB_ASSET_INTRANET_TTL_SEC);

    if (error || !data?.signedUrl) {
      console.error("[resolveClubAssetUrl]", error?.message ?? "sin signedUrl", storagePath);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("[resolveClubAssetUrl]", err);
    return null;
  }
}
