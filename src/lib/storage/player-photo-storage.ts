import { randomUUID } from "node:crypto";
import { leagueStoragePath } from "./league-storage-path.ts";

/** Bucket de fotos de jugadores (privado en prod tras migración 0044). */
export function playersBucketName(): string {
  return process.env.NEXT_PUBLIC_BUCKET_PLAYERS?.trim() || "jugador-fotos";
}

/** Path relativo al bucket: `leagues/{leagueId}/clubs/{clubId}/players/{uuid}.ext` */
export function buildPlayerPhotoStoragePath(
  leagueId: string,
  clubId: string,
  ext: string,
): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const fileName = `${randomUUID()}.${safeExt}`;
  return leagueStoragePath(leagueId, "clubs", clubId, "players", fileName);
}

/** Indica si el valor almacenado en BD es un path de Storage (no URL absoluta legacy). */
export function isPlayerPhotoStoragePath(stored: string): boolean {
  const v = stored.trim();
  if (!v || v.startsWith("http://") || v.startsWith("https://")) return false;
  return (
    v.startsWith("leagues/") ||
    v.startsWith("clubs/") ||
    v.startsWith(`${playersBucketName()}/`)
  );
}

/**
 * Extrae el path relativo al bucket desde valor en BD (path crudo o URL pública/sign legacy).
 */
export function extractPlayerPhotoStoragePath(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const trimmed = stored.trim();
  const bucket = playersBucketName();

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    const path = trimmed.replace(/^\/+/, "");
    if (path.startsWith(`${bucket}/`)) {
      return path.slice(bucket.length + 1);
    }
    return path;
  }

  for (const segment of [`/object/public/${bucket}/`, `/object/sign/${bucket}/`]) {
    const idx = trimmed.indexOf(segment);
    if (idx !== -1) {
      const raw = trimmed.slice(idx + segment.length).split("?")[0] ?? "";
      return decodeURIComponent(raw);
    }
  }

  return null;
}
