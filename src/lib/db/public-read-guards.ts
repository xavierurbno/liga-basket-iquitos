const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** Palabras seguras para `to_tsquery` (evita operadores `& | !` del usuario). */
export function sanitizeTsQueryInput(raw: string): string {
  const words = raw
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length >= 2);
  if (words.length === 0) return "";
  return words.map((w) => `${w}:*`).join(" & ");
}
