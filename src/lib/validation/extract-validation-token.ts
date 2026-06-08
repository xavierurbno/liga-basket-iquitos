/** Extrae el segmento token de una URL `/validar/{token}` o devuelve el token crudo. */
export function extractValidationTokenFromUrl(
  urlOrToken: string | null | undefined,
): string | null {
  const raw = urlOrToken?.trim();
  if (!raw) return null;

  if (raw.startsWith("v1.")) return raw;

  try {
    const parsed = raw.startsWith("http")
      ? new URL(raw)
      : new URL(raw, "https://validar.local");
    const parts = parsed.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("validar");
    if (idx >= 0 && parts[idx + 1]) {
      return decodeURIComponent(parts[idx + 1]!);
    }
  } catch {
    /* not a URL */
  }

  return null;
}
