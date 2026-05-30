const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parseHostname(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function addHostFromEnvValue(hosts: Set<string>, raw: string | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed) return;
  const hostname = parseHostname(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  if (hostname) hosts.add(hostname);
}

function collectAllowedHosts(): Set<string> {
  const hosts = new Set<string>();

  for (const key of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_APP_URL",
    "VERCEL_URL",
    "VERCEL_BRANCH_URL",
  ]) {
    addHostFromEnvValue(hosts, process.env[key]);
  }

  for (const key of ["AUTH_ALLOWED_REDIRECT_HOSTS", "NEXT_PUBLIC_AUTH_ALLOWED_REDIRECT_HOSTS"]) {
    const extra = process.env[key]?.trim();
    if (!extra) continue;
    for (const part of extra.split(",")) {
      const host = part.trim().toLowerCase();
      if (host) hosts.add(host);
    }
  }

  return hosts;
}

/** Hosts permitidos para OAuth (servidor: incluye VERCEL_URL y env completos). */
export function getOAuthAllowedHosts(requestHost?: string | null): string[] {
  const hosts = collectAllowedHosts();
  const fromRequest = requestHost?.trim().split(":")[0]?.toLowerCase();
  if (fromRequest) hosts.add(fromRequest);
  return [...hosts];
}

export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (LOCAL_DEV_HOSTS.has(host)) return true;
  return host.endsWith(".localhost");
}

export function isAllowedOAuthRedirectUrl(
  rawUrl: string,
  extraAllowedHosts: readonly string[] = [],
): boolean {
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
  for (const host of extraAllowedHosts) {
    const normalized = host.trim().toLowerCase();
    if (normalized) allowed.add(normalized);
  }
  return allowed.has(hostname);
}

/** Valida callback OAuth relativo a un origen de confianza (p. ej. `window.location.origin`). */
export function buildSafeOAuthCallbackUrl(
  origin: string,
  nextPath: string,
  extraAllowedHosts: readonly string[] = [],
): string | null {
  const trimmedOrigin = origin?.trim() ?? "";
  if (!trimmedOrigin.startsWith("http://") && !trimmedOrigin.startsWith("https://")) {
    return null;
  }

  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/liga/";
  const callbackUrl = `${trimmedOrigin.replace(/\/$/, "")}/auth/callback/?next=${encodeURIComponent(safeNext)}`;

  return isAllowedOAuthRedirectUrl(callbackUrl, extraAllowedHosts) ? callbackUrl : null;
}
