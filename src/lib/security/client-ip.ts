/** Extrae IP del cliente desde cabeceras de proxy (Vercel / Next). */

const FORWARDED_LIST_HEADERS = ["x-vercel-forwarded-for", "x-forwarded-for"] as const;
const DIRECT_IP_HEADERS = ["x-real-ip", "cf-connecting-ip"] as const;

function firstForwardedIp(raw: string): string {
  return raw.split(",")[0]?.trim() ?? "";
}

function pickIp(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === "unknown") return null;
  return trimmed;
}

/** Variantes comparables (minúsculas, IPv4 mapeada en IPv6). */
export function expandIpVariantsForAllowlist(ip: string): string[] {
  const trimmed = ip.trim().toLowerCase();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);

  if (trimmed.startsWith("::ffff:")) {
    const mappedV4 = trimmed.slice("::ffff:".length);
    if (mappedV4) variants.add(mappedV4);
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(trimmed)) {
    variants.add(`::ffff:${trimmed}`);
  }

  const normalizedIpv6 = normalizeIpv6Address(trimmed);
  if (normalizedIpv6) variants.add(normalizedIpv6);

  return [...variants];
}

/** Normaliza IPv6 a 8 grupos hex de 4 dígitos (comparación estable). */
export function normalizeIpv6Address(ip: string): string | null {
  const lower = ip.trim().toLowerCase();
  if (!lower.includes(":")) return null;
  if (lower.startsWith("::ffff:")) return lower;

  const [head, tail = ""] = lower.split("::");
  const left = head ? head.split(":").filter(Boolean) : [];
  const right = tail ? tail.split(":").filter(Boolean) : [];
  if (left.length + right.length > 8) return null;

  const missing = 8 - left.length - right.length;
  if (missing < 0) return null;

  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) {
    return null;
  }

  return groups.map((g) => g.padStart(4, "0")).join(":");
}

export function getClientIpFromHeaders(
  headers: { get(name: string): string | null },
): string {
  for (const name of FORWARDED_LIST_HEADERS) {
    const raw = headers.get(name);
    const ip = pickIp(raw ? firstForwardedIp(raw) : null);
    if (ip) return ip;
  }

  for (const name of DIRECT_IP_HEADERS) {
    const ip = pickIp(headers.get(name));
    if (ip) return ip;
  }

  return "unknown";
}

/** Preferir `request.ip` (Vercel/Next edge) y luego cabeceras de proxy. */
export function getClientIpFromRequest(request: {
  ip?: string | null;
  headers: { get(name: string): string | null };
}): string {
  const fromNext = pickIp(request.ip ?? null);
  if (fromNext) return fromNext;
  return getClientIpFromHeaders(request.headers);
}
