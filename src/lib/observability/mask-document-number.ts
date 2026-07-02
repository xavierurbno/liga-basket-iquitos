/** Enmascara documento para vistas públicas (últimos 3 dígitos visibles: ***XXX). */
export function maskDocumentNumber(value: string | null | undefined): string {
  const v = value?.trim();
  if (!v) return "—";
  if (v.length <= 3) return `***${v}`;
  return `***${v.slice(-3)}`;
}
