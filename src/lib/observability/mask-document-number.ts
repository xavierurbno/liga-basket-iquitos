/** Enmascara documento para vistas públicas (últimos 4 dígitos visibles). */
export function maskDocumentNumber(value: string | null | undefined): string {
  const v = value?.trim();
  if (!v) return "—";
  if (v.length <= 4) return "****";
  return `${"*".repeat(Math.min(v.length - 4, 8))}${v.slice(-4)}`;
}
