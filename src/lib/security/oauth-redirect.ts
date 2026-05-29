const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parseHostname(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function collectAllowedHosts(): Set<string> {
  const hosts = new Set<string>();

  for (const key of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
    "VERCEL_URL",
    "VERCEL_BRANCH_URL",
  ]) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    const hostname = parseHostname(raw.startsWith("http") ? raw : `https://${raw}`);
    if (hostname) hosts.add(hostname);
  }

  const extra = process.env.AUTH_ALLOWED_REDIRECT_HOSTS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const host = part.trim().toLowerCase();
      if (host) hosts.add(host);
    }
  }

  return hosts;
}

export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (LOCAL_DEV_HOSTS.has(host)) return true;
  return host.endsWith(".localhost");
}

export function isAllowedOAuthRedirectUrl(rawUrl: string): boolean {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (isLocalDevHost(hostname)) {
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  }

  if (parsed.protocol !== "https:") return false;

  const allowed = collectAllowedHosts();
  return allowed.has(hostname);
}

/** Valida callback OAuth relativo a un origen de confianza (p. ej. `window.location.origin`). */
export function buildSafeOAuthCallbackUrl(origin: string, nextPath: string): string | null {
  const trimmedOrigin = origin?.trim() ?? "";
  if (!trimmedOrigin.startsWith("http://") && !trimmedOrigin.startsWith("https://")) {
    return null;
  }

  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/liga/";
  const callbackUrl = `${trimmedOrigin.replace(/\/$/, "")}/auth/callback/?next=${encodeURIComponent(safeNext)}`;

  return isAllowedOAuthRedirectUrl(callbackUrl) ? callbackUrl : null;
}
