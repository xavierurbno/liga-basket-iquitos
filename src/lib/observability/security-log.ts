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
  | "auth.session.failure";

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

function emitToConsole(event: SecurityEvent, level: "warn" | "error") {
  const payload = {
    ts: new Date().toISOString(),
    level,
    domain: "security",
    ...event,
  };

  if (shouldEmitJson()) {
    const line = JSON.stringify(payload);
    if (level === "error") console.error(line);
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

/**
 * Registra un evento de seguridad. No lanza excepciones.
 */
export function logSecurityEvent(
  event: SecurityEvent,
  options?: { level?: "warn" | "error" },
): void {
  const minLevel = process.env.SECURITY_LOG_LEVEL === "error" ? "error" : "warn";
  const level = options?.level ?? "warn";
  if (minLevel === "error" && level === "warn") return;

  emitToConsole(event, level);
  void emitToSentry(event, level);
}
