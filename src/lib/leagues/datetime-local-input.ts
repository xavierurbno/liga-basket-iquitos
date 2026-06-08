/** Convierte `Date` o ISO a valor `datetime-local` (hora local del navegador/servidor). */
export function toDatetimeLocalInputValue(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parsea `datetime-local` del formulario a `Date` o null si vacío/inválido. */
export function parseDatetimeLocalInput(
  value: string | null | undefined,
): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}
