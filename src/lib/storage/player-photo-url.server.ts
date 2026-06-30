import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import {
  buildPlayerPhotoStoragePath,
  extractPlayerPhotoStoragePath,
  playersBucketName,
} from "@/lib/storage/player-photo-storage";

/** TTL por defecto para URLs firmadas en rutas públicas (/validar, Busqueda365). */
export const PLAYER_PHOTO_PUBLIC_SIGNED_TTL_SEC = 300;

/** TTL para panel intranet (listados, carnets admin). */
export const PLAYER_PHOTO_INTRANET_SIGNED_TTL_SEC = 3600;

export type PlayerPhotoUrlIntent = "public" | "intranet";

function signedTtlForIntent(intent: PlayerPhotoUrlIntent): number {
  return intent === "public"
    ? PLAYER_PHOTO_PUBLIC_SIGNED_TTL_SEC
    : PLAYER_PHOTO_INTRANET_SIGNED_TTL_SEC;
}

/**
 * Sube foto de jugador y devuelve el **path relativo** para persistir en `players.photo_url`.
 * No incluye DNI ni PII en el nombre del objeto.
 */
export async function uploadPlayerPhoto(
  supabase: SupabaseClient,
  leagueId: string,
  clubId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = buildPlayerPhotoStoragePath(leagueId, clubId, ext);
  const bucket = playersBucketName();

  const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(`Error al subir foto: ${error.message}`);
  }

  return storagePath;
}

/**
 * Resuelve URL de visualización para foto de jugador.
 * - Paths de Storage → URL firmada (bucket privado).
 * - URLs legacy absolutas → se devuelven tal cual (compatibilidad transitoria).
 */
export async function resolvePlayerPhotoUrl(
  stored: string | null | undefined,
  options?: { intent?: PlayerPhotoUrlIntent; expiresInSec?: number },
): Promise<string | null> {
  if (!stored?.trim()) return null;

  const trimmed = stored.trim();
  const storagePath = extractPlayerPhotoStoragePath(trimmed);

  if (!storagePath) {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return null;
  }

  const intent = options?.intent ?? "intranet";
  const expiresIn = options?.expiresInSec ?? signedTtlForIntent(intent);
  const bucket = playersBucketName();

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error("[resolvePlayerPhotoUrl]", error?.message ?? "sin signedUrl");
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("[resolvePlayerPhotoUrl]", err);
    return null;
  }
}

/** Sube imagen de jugador desde FormData si hay archivo; devuelve path o null. */
export async function uploadPlayerPhotoIfPresent(
  supabase: SupabaseClient,
  leagueId: string,
  clubId: string,
  field: FormDataEntryValue | null,
): Promise<string | null> {
  if (!(field instanceof File) || field.size <= 0) return null;
  return uploadPlayerPhoto(supabase, leagueId, clubId, field);
}
