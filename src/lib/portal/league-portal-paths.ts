/** Rutas públicas del portal por liga (`/l/[slug]/...`). */

export function leaguePortalHome(slug: string): string {
  return `/l/${slug}/`;
}

/** Slug de liga desde rutas públicas (`/l/[slug]/...`). */
export function parseLeagueSlugFromPortalPath(path: string): string | null {
  const trimmed = path.trim();
  const match = /^\/l\/([^/]+)(?:\/|$)/.exec(trimmed);
  const slug = match?.[1]?.trim();
  return slug || null;
}

/** Login contextual: conserva marca de la liga (`l`) y destino post-auth (`next`). */
export function buildPortalLoginHref(opts?: {
  leagueSlug?: string | null;
  next?: string | null;
}): string {
  const slug = opts?.leagueSlug?.trim() || null;
  const next =
    opts?.next?.trim() ||
    (slug ? leaguePortalHome(slug) : "/liga/");
  const params = new URLSearchParams();
  params.set("next", next);
  if (slug) params.set("l", slug);
  return `/login/?${params.toString()}`;
}

export function leaguePortalInstitutionalGallery(slug: string): string {
  return `/l/${slug}/galeria-institucional/`;
}

export function leaguePortalClubGallery(slug: string, clubId: string): string {
  return `/l/${slug}/galeria/club/${clubId}/`;
}

export function leaguePortalTournament(slug: string, tournamentSlug: string): string {
  return `/l/${slug}/torneos/${tournamentSlug}/`;
}

export function leaguePortalNormativas(slug: string): string {
  return `/l/${slug}/normativas/`;
}

function resolveSiteOrigin(override?: string): string {
  const explicit = override?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "";
}

/** URL absoluta para copiar en portapapeles (super-admin). */
export function leaguePortalPublicUrl(slug: string, siteOrigin?: string): string {
  const base = resolveSiteOrigin(siteOrigin);
  const path = leaguePortalHome(slug);
  return base ? `${base}${path}` : path;
}
