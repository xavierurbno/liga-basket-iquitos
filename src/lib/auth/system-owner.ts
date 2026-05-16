/**
 * Propietario del sistema: correos en `SYSTEM_OWNER_EMAILS` (separados por comas)
 * pueden crear clubes y asignarse como administrador sin intervención en Supabase.
 * Solo se evalúa en el servidor.
 */
export function isSystemOwnerEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.SYSTEM_OWNER_EMAILS;
  if (!raw?.trim()) return false;
  const normalized = email.trim().toLowerCase();
  const list = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(normalized);
}
