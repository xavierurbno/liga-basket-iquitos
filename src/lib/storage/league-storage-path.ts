/**
 * Paths de Storage multi-tenant bajo `leagues/{leagueId}/...`.
 * Solo aplica a uploads nuevos; objetos legacy conservan su URL en BD.
 */
export function leagueStoragePath(leagueId: string, ...segments: string[]): string {
  const lid = leagueId.trim();
  if (!lid) throw new Error("leagueId requerido para leagueStoragePath.");
  const safe = segments
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/[^a-zA-Z0-9._/-]/g, ""));
  if (safe.length === 0) {
    throw new Error("Segmentos de path inválidos para Storage.");
  }
  return `leagues/${lid}/${safe.join("/")}`;
}

/** Extrae el path relativo al bucket desde una URL pública de Supabase Storage. */
export function storageObjectPathFromPublicUrl(
  publicUrl: string,
  bucket: string,
): string | null {
  const trimmed = publicUrl.trim();
  if (!trimmed) return null;

  const marker = `/object/public/${bucket}/`;
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(trimmed.slice(idx + marker.length).split("?")[0] ?? "");
  }

  // Legacy: solo filename al final
  const fileName = trimmed.split("/").pop()?.split("?")[0];
  if (!fileName) return null;
  return `gallery/${fileName}`;
}
