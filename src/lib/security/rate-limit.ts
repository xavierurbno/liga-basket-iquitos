import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitScope =
  | "login"
  | "validar"
  | "validarAssets"
  | "documentos"
  | "normativas"
  | "busqueda365"
  | "settingsPublic";

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export const RATE_LIMITS: Record<RateLimitScope, RateLimitConfig> = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  validar: { limit: 60, windowMs: 10 * 60 * 1000 },
  validarAssets: { limit: 10, windowMs: 60 * 1000 },
  documentos: { limit: 30, windowMs: 60 * 1000 },
  normativas: { limit: 20, windowMs: 60 * 1000 },
  busqueda365: { limit: 40, windowMs: 60 * 1000 },
  settingsPublic: { limit: 60, windowMs: 60 * 1000 },
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let checksSinceCleanup = 0;

/** Upstash REST o variables KV de la integración Vercel (Redis.fromEnv las resuelve). */
function hasUpstashRedisEnv(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();
  return Boolean(url && token);
}

let redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  redisClient = hasUpstashRedisEnv() ? Redis.fromEnv() : null;
  return redisClient;
}

const limiterCache = new Map<RateLimitScope, Ratelimit>();

function isRateLimitDisabled(): boolean {
  if (process.env.SECURITY_RATE_LIMIT_DISABLED === "true") return true;
  if (process.env.SECURITY_RATE_LIMIT_DISABLED === "false") return false;
  /** Local: evita bloqueos tras muchos intentos de login en `npm run dev`. */
  if (process.env.APP_ENV?.trim().toLowerCase() === "development") return true;
  return false;
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

function buildLimiter(scope: RateLimitScope): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;
  let limiter = limiterCache.get(scope);
  if (!limiter) {
    const cfg = RATE_LIMITS[scope];
    limiter = new Ratelimit({
      redis,
      prefix: `rl:${scope}`,
      limiter: Ratelimit.slidingWindow(cfg.limit, `${cfg.windowMs} ms`),
    });
    limiterCache.set(scope, limiter);
  }
  return limiter;
}

/** Ventana fija en memoria (fallback sin Upstash o local). */
export function checkRateLimitInMemory(
  scope: RateLimitScope,
  clientKey: string,
  overrides?: Partial<RateLimitConfig>,
): RateLimitResult {
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

/**
 * Rate limit distribuido (Upstash) con fallback en memoria por instancia.
 */
export async function checkRateLimit(
  scope: RateLimitScope,
  clientKey: string,
  overrides?: Partial<RateLimitConfig>,
): Promise<RateLimitResult> {
  if (isRateLimitDisabled()) {
    const limit = overrides?.limit ?? RATE_LIMITS[scope].limit;
    return { allowed: true, retryAfterSec: 0, remaining: limit };
  }

  const limiter = buildLimiter(scope);
  if (!limiter) {
    return checkRateLimitInMemory(scope, clientKey, overrides);
  }

  try {
    const { success, reset, remaining } = await limiter.limit(`${scope}:${clientKey}`);
    if (success) {
      return {
        allowed: true,
        retryAfterSec: 0,
        remaining: Math.max(0, remaining),
      };
    }
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: false, retryAfterSec, remaining: 0 };
  } catch (error) {
    console.warn("[checkRateLimit] Upstash falló; usando memoria local:", error);
    return checkRateLimitInMemory(scope, clientKey, overrides);
  }
}

export function rateLimitExceededMessage(retryAfterSec: number): string {
  if (retryAfterSec >= 60) {
    const minutes = Math.ceil(retryAfterSec / 60);
    return `Demasiadas solicitudes. Espera ${minutes} minuto(s) e inténtalo de nuevo.`;
  }
  return `Demasiadas solicitudes. Espera ${retryAfterSec} segundo(s) e inténtalo de nuevo.`;
}

/** Reinicia buckets en memoria (solo tests). */
export function resetRateLimitStoreForTests(): void {
  buckets.clear();
  checksSinceCleanup = 0;
  limiterCache.clear();
  redisClient = undefined;
}
