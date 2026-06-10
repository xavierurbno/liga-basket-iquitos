/**
 * Controles de signup self-service (Fase 6.4).
 */

function envFlag(name: string, defaultValue = false): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (!v) return defaultValue;
  return v === "true" || v === "1" || v === "yes";
}

export function isSignupEnabled(): boolean {
  return envFlag("SIGNUP_ENABLED", true);
}

export function isSignupInviteOnly(): boolean {
  return envFlag("SIGNUP_INVITE_ONLY", false);
}

/** Dominios permitidos separados por coma; vacío = todos. */
export function getSignupAllowedEmailDomains(): string[] {
  const raw = process.env.SIGNUP_ALLOWED_EMAIL_DOMAINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function getMasterSuperAdminEmail(): string {
  return process.env.MASTER_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export type SignupValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateSignupEmail(email: string): SignupValidationResult {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: "Indica un correo válido." };
  }

  const master = getMasterSuperAdminEmail();
  if (master && normalized === master) {
    return {
      ok: false,
      error: "Este correo está reservado para administración de plataforma.",
    };
  }

  const allowedDomains = getSignupAllowedEmailDomains();
  if (allowedDomains.length > 0) {
    const domain = normalized.split("@")[1];
    if (!domain || !allowedDomains.includes(domain)) {
      return {
        ok: false,
        error: `El registro está limitado a: ${allowedDomains.join(", ")}`,
      };
    }
  }

  return { ok: true };
}

export function validateSignupAccess(options?: {
  inviteToken?: string | null;
}): SignupValidationResult {
  if (!isSignupEnabled()) {
    return { ok: false, error: "El registro público está desactivado temporalmente." };
  }
  if (isSignupInviteOnly()) {
    const expected = process.env.SIGNUP_INVITE_TOKEN?.trim();
    const provided = options?.inviteToken?.trim();
    if (!expected || provided !== expected) {
      return { ok: false, error: "Se requiere invitación válida para registrarse." };
    }
  }
  return { ok: true };
}

export const ONBOARDING_PLAN_COOKIE = "onboarding_plan";
export const ONBOARDING_PLAN_COOKIE_MAX_AGE = 60 * 60 * 24;

export const BILLING_UPGRADE_PATH = "/onboarding/billing/";
