/**
 * Clave estable para listas y AnimatePresence.
 * Trata `""` como ausente (evita duplicados al animar salida/entrada).
 */
export function reactListKey(
  id: string | undefined | null,
  index: number,
  prefix: string,
  fallback?: string,
): string {
  const trimmed = id?.trim();
  if (trimmed) return trimmed;
  const fb = fallback?.trim();
  if (fb) return `${prefix}-${fb}`;
  return `${prefix}-${index}`;
}
