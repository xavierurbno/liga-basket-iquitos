export type RateLimitScope =
  | "login"
  | "validar"
  | "validarAssets"
  | "documentos"
  | "normativas"
  | "busqueda365";

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export const RATE_LIMITS: Record<RateLimitScope, RateLimitConfig> = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  validar: { limit: 60, windowMs: 10 * 60 * 1000 },
  /** Server action pública de assets del carnet en /validar. */
  validarAssets: { limit: 10, windowMs: 60 * 1000 },
  /** Búsqueda y emisión en /liga/documentos/. */
  documentos: { limit: 30, windowMs: 60 * 1000 },
  normativas: { limit: 20, windowMs: 60 * 1000 },
  busqueda365: { limit: 40, windowMs: 60 * 1000 },
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let checksSinceCleanup = 0;

function isRateLimitDisabled(): boolean {
  return process.env.SECURITY_RATE_LIMIT_DISABLED === "true";
}

function cleanupExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSec: number;
  remaining: number;
};

/**
 * Ventana fija en memoria (por instancia/serverless).
 * En producción multi-instancia conviene complementar con Vercel Firewall o Upstash.
 */
export function checkRateLimit(
  scope: RateLimitScope,
  clientKey: string,
  overrides?: Partial<RateLimitConfig>,
): RateLimitResult {
  if (isRateLimitDisabled()) {
    const limit = overrides?.limit ?? RATE_LIMITS[scope].limit;
    return { allowed: true, retryAfterSec: 0, remaining: limit };
  }

  const config = { ...RATE_LIMITS[scope], ...overrides };
  const key = `${scope}:${clientKey}`;
  const now = Date.now();

  checksSinceCleanup += 1;
  if (checksSinceCleanup >= 256) {
    checksSinceCleanup = 0;
    cleanupExpired(now);
  }

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.windowMs };
    buckets.set(key, bucket);
  }

  if (bucket.count >= config.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    retryAfterSec: 0,
    remaining: Math.max(0, config.limit - bucket.count),
  };
}

export function rateLimitExceededMessage(retryAfterSec: number): string {
  if (retryAfterSec >= 60) {
    const minutes = Math.ceil(retryAfterSec / 60);
    return `Demasiadas solicitudes. Espera ${minutes} minuto(s) e inténtalo de nuevo.`;
  }
  return `Demasiadas solicitudes. Espera ${retryAfterSec} segundo(s) e inténtalo de nuevo.`;
}

/** Reinicia buckets (solo tests). */
export function resetRateLimitStoreForTests(): void {
  buckets.clear();
  checksSinceCleanup = 0;
}
