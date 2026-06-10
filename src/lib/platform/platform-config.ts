/**
 * Configuración de plataforma multi-liga (Fase 4).
 * LDDBI ya no está acoplado a `/`; solo a `/l/{slug}/` vía PLATFORM_DEFAULT_LEAGUE_SLUG.
 */

export function getPlatformName(): string {
  return process.env.PLATFORM_NAME?.trim() || "Plataforma de ligas";
}

export function getPlatformDefaultLeagueSlug(): string | null {
  const slug = process.env.PLATFORM_DEFAULT_LEAGUE_SLUG?.trim();
  return slug || null;
}

export function getPlatformDefaultLeagueId(): string | null {
  const id = process.env.NEXT_PUBLIC_DEFAULT_LEAGUE_ID?.trim();
  return id || null;
}

/** Slug de la liga por defecto del programa (p. ej. LDDBI en transición). */
export function isPlatformDefaultLeagueSlug(slug: string | null | undefined): boolean {
  const n = slug?.trim().toLowerCase();
  if (!n) return false;
  const configured = getPlatformDefaultLeagueSlug()?.toLowerCase();
  if (configured) return n === configured;
  return false;
}
