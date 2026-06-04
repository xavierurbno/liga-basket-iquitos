/**
 * Eventos de seguridad estructurados (stdout JSON + opcional Sentry).
 *
 * Variables:
 *   SECURITY_LOG_JSON=1        — fuerza JSON en desarrollo
 *   SENTRY_DSN                 — envía eventos a Sentry (captureMessage)
 *   SECURITY_LOG_LEVEL=warn    — mínimo nivel (warn | error), default warn
 */

export type SecurityEventType =
  | "auth.denied"
  | "auth.tenant.club_mismatch"
  | "auth.tenant.league_mismatch"
  | "auth.route.forbidden"
  | "auth.session.failure"
  | "rate_limit.blocked"
  | "treasury.create"
  | "player.create";

export type SecurityLogLevel = "info" | "warn" | "error";

export type SecurityEvent = {
  type: SecurityEventType;
  message: string;
  userId?: string;
  role?: string;
  clubId?: string;
  leagueId?: string;
  attemptedClubId?: string;
  route?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

function shouldEmitJson(): boolean {
  return (
    process.env.SECURITY_LOG_JSON === "1" ||
    process.env.SECURITY_LOG_JSON === "true" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1"
  );
}

function emitToConsole(event: SecurityEvent, level: SecurityLogLevel) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    domain: "security",
    ...event,
  };

  if (shouldEmitJson()) {
    const line = JSON.stringify(payload);
    if (level === "error") console.error(line);
    else if (level === "info") console.log(line);
    else console.warn(line);
    return;
  }

  const prefix = `[SECURITY] ${event.type}`;
  const detail = [
    event.message,
    event.userId ? `user=${event.userId}` : null,
    event.role ? `role=${event.role}` : null,
    event.attemptedClubId ? `attemptedClub=${event.attemptedClubId}` : null,
    event.clubId ? `club=${event.clubId}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (level === "error") console.error(prefix, detail);
  else if (level === "info") console.log(prefix, detail);
  else console.warn(prefix, detail);
}

async function emitToSentry(event: SecurityEvent, level: "warn" | "error") {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    // Paquete opcional (@sentry/nextjs no está en package.json por defecto).
    const sentryModuleId = ["@sentry", "nextjs"].join("/");
    const Sentry = await import(/* webpackIgnore: true */ sentryModuleId);
    Sentry.captureMessage(event.message, {
      level: level === "error" ? "error" : "warning",
      tags: {
        security_event: event.type,
        role: event.role ?? "unknown",
      },
      extra: {
        userId: event.userId,
        clubId: event.clubId,
        leagueId: event.leagueId,
        attemptedClubId: event.attemptedClubId,
        route: event.route,
        ...event.meta,
      },
    });
  } catch {
    /* @sentry/nextjs no instalado o fallo de red — solo stdout */
  }
}

function resolveMinLevel(): SecurityLogLevel {
  const raw = process.env.SECURITY_LOG_LEVEL?.trim().toLowerCase();
  if (raw === "error") return "error";
  if (raw === "info") return "info";
  return "warn";
}

function shouldEmitLevel(requested: SecurityLogLevel, min: SecurityLogLevel): boolean {
  if (requested === "info" && shouldEmitJson()) {
    return true;
  }
  const order: SecurityLogLevel[] = ["info", "warn", "error"];
  return order.indexOf(requested) >= order.indexOf(min);
}

/**
 * Registra un evento de seguridad. No lanza excepciones.
 *
 * SECURITY_LOG_LEVEL: `info` (todo) | `warn` (default, sin info) | `error` (solo errores)
 */
export function logSecurityEvent(
  event: SecurityEvent,
  options?: { level?: SecurityLogLevel },
): void {
  const minLevel = resolveMinLevel();
  const level = options?.level ?? "warn";
  if (!shouldEmitLevel(level, minLevel)) return;

  emitToConsole(event, level);
  if (level !== "info") {
    void emitToSentry(event, level);
  }
}

/** Rate limit excedido (proxy o server action). */
export function logRateLimitBlocked(
  scope: string,
  clientIp: string,
  retryAfterSec: number,
  route?: string,
): void {
  logSecurityEvent(
    {
      type: "rate_limit.blocked",
      message: `Rate limit (${scope})`,
      route,
      meta: { scope, retryAfterSec, clientIp },
    },
    { level: "warn" },
  );
}
