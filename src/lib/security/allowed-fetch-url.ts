const PRIVATE_IPV4_BLOCKS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

function siteHostnames(): Set<string> {
  const hosts = new Set<string>();
  for (const envKey of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    const raw = process.env[envKey]?.trim();
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  return hosts;
}

function supabaseHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "::1") return true;
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80:")) return true;
  return PRIVATE_IPV4_BLOCKS.some((re) => re.test(h));
}

function isAllowedPublicRelativePath(url: string): boolean {
  if (!url.startsWith("/") || url.startsWith("//")) return false;
  if (url.includes("..")) return false;
  return true;
}

function isAllowedSupabasePublicStorage(url: URL, supabaseHost: string): boolean {
  if (url.hostname.toLowerCase() !== supabaseHost) return false;
  return url.pathname.includes("/storage/v1/object/public/");
}

function isAllowedSameSite(url: URL, allowedHosts: Set<string>): boolean {
  return allowedHosts.has(url.hostname.toLowerCase());
}

/**
 * URLs permitidas para logos/firmas institucionales (fetch servidor y persistencia).
 * - Rutas relativas en `public/` (`/logos/...`)
 * - Storage público del proyecto Supabase
 * - Mismo dominio del sitio desplegado
 */
export function isAllowedInstitutionalAssetUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith("data:image/")) return true;

  if (isAllowedPublicRelativePath(trimmed)) return true;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (isPrivateOrLocalHost(parsed.hostname)) return false;

  const supabaseHost = supabaseHostname();
  if (supabaseHost && isAllowedSupabasePublicStorage(parsed, supabaseHost)) {
    return true;
  }

  const hosts = siteHostnames();
  if (hosts.size > 0 && isAllowedSameSite(parsed, hosts)) {
    return true;
  }

  return false;
}

export function institutionalAssetUrlError(label: string): string {
  return `${label}: URL no permitida. Usa Storage del proyecto, rutas /logos/… o el dominio del sitio.`;
}
