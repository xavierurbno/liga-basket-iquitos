function supabaseHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

function supabaseOrigin(): string | null {
  const host = supabaseHost();
  return host ? `https://${host}` : null;
}

/**
 * CSP pragmática para Next.js (inline scripts/styles de runtime).
 * Complementa X-Frame-Options y Permissions-Policy en next.config.
 */
export function buildContentSecurityPolicy(): string {
  const supabase = supabaseOrigin();
  const connectSrc = ["'self'", supabase, supabase ? `wss://${supabaseHost()}` : null]
    .filter(Boolean)
    .join(" ");

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    supabase,
    "https://*.googleusercontent.com",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `connect-src ${connectSrc}`,
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
    "worker-src 'self' blob: https://unpkg.com",
  ].join("; ");
}

export function buildPermissionsPolicy(): string {
  return [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
  ].join(", ");
}

export function buildStrictTransportSecurity(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  return "max-age=63072000; includeSubDomains; preload";
}
