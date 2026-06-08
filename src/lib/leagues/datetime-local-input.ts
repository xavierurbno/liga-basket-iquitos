/** Zona horaria operativa de las ligas del programa (Perú). */
export const LEAGUE_OPERATION_TIMEZONE = "America/Lima";

/** Offset fijo de Lima (sin horario de verano). */
const LIMA_UTC_OFFSET = "-05:00";

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/;

/**
 * Convierte un instante UTC a valor `datetime-local` en hora de Lima.
 * Evita que el SSR en Vercel (UTC) muestre horas distintas al administrador.
 */
export function toDatetimeLocalInputValue(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LEAGUE_OPERATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = get("hour");
  const minute = get("minute");

  if (hour === "24") hour = "00";

  return `${year}-${month}-${day}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/**
 * Interpreta `datetime-local` como reloj de pared en Lima y devuelve el instante UTC.
 * En Vercel `new Date("YYYY-MM-DDTHH:mm")` usa UTC del servidor, no la hora peruana.
 */
export function parseDatetimeLocalInput(
  value: string | null | undefined,
): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const match = DATETIME_LOCAL_PATTERN.exec(trimmed);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const isoWithOffset = `${year}-${month}-${day}T${hour}:${minute}:${second ?? "00"}${LIMA_UTC_OFFSET}`;
  const d = new Date(isoWithOffset);
  return Number.isNaN(d.getTime()) ? null : d;
}
