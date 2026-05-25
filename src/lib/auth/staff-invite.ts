import type { SupabaseClient } from "@supabase/supabase-js";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

const DEFAULT_POST_LOGIN = "/liga/";

function resolveSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3001";
}

/** Ruta interna tras aceptar invitación (misma que OAuth: `/auth/callback/`). */
export function resolveStaffInvitePostLoginPath(leagueSlug?: string | null): string {
  const slug = leagueSlug?.trim();
  if (slug) return leaguePortalHome(slug);
  return DEFAULT_POST_LOGIN;
}

/**
 * URL absoluta para `redirectTo` de Supabase Invite (debe estar en Redirect URLs del proyecto).
 * No modifica `/login/` ni otras rutas públicas.
 */
export function buildStaffInviteRedirectUrl(opts?: {
  leagueSlug?: string | null;
  postLogin?: string | null;
}): string {
  const origin = resolveSiteOrigin();
  const next = opts?.postLogin?.trim() || resolveStaffInvitePostLoginPath(opts?.leagueSlug);
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : DEFAULT_POST_LOGIN;
  return `${origin}/auth/callback/?next=${encodeURIComponent(safeNext)}`;
}

export type InviteStaffUserResult =
  | { ok: true; userId: string; emailed: true }
  | { ok: false; error: string };

/**
 * Invita por correo (cualquier dominio). Crea el usuario en Auth si no existe y envía el email de Supabase.
 */
export async function inviteStaffUserByEmail(
  admin: SupabaseClient,
  opts: {
    email: string;
    fullName: string;
    appMetadata: Record<string, unknown>;
    leagueSlug?: string | null;
    postLogin?: string | null;
  },
): Promise<InviteStaffUserResult> {
  const emailNorm = opts.email.trim().toLowerCase();
  const redirectTo = buildStaffInviteRedirectUrl({
    leagueSlug: opts.leagueSlug,
    postLogin: opts.postLogin,
  });

  const { data, error } = await admin.auth.admin.inviteUserByEmail(emailNorm, {
    redirectTo,
    data: {
      full_name: opts.fullName,
    },
  });

  if (error) {
    if (/already|registered|exist/i.test(error.message)) {
      return {
        ok: false,
        error:
          "Este correo ya está registrado. Si ya tiene cuenta, asígnalo desde perfiles sin crear uno nuevo.",
      };
    }
    return { ok: false, error: error.message || "No se pudo enviar la invitación." };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { ok: false, error: "Supabase no devolvió el usuario invitado." };
  }

  const invitedAt = new Date().toISOString();
  const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { full_name: opts.fullName },
    app_metadata: {
      ...opts.appMetadata,
      invited_at: invitedAt,
    },
  });

  if (metaErr) {
    return {
      ok: false,
      error: metaErr.message ?? "Invitación enviada pero falló la asignación de rol en Auth.",
    };
  }

  return { ok: true, userId, emailed: true };
}

export type ResendStaffInviteResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Reenvía acceso: invitación si nunca inició sesión; restablecimiento de contraseña si ya activó cuenta.
 */
export async function resendStaffInvitation(
  admin: SupabaseClient,
  opts: {
    email: string;
    userId?: string;
    leagueSlug?: string | null;
  },
): Promise<ResendStaffInviteResult> {
  const emailNorm = opts.email.trim().toLowerCase();
  const redirectTo = buildStaffInviteRedirectUrl({ leagueSlug: opts.leagueSlug });
  const origin = resolveSiteOrigin();

  let hasSignedIn = false;
  if (opts.userId) {
    const { data } = await admin.auth.admin.getUserById(opts.userId);
    hasSignedIn = Boolean(data?.user?.last_sign_in_at);
  }

  if (!hasSignedIn) {
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(emailNorm, {
      redirectTo,
    });
    if (!inviteErr) {
      return {
        ok: true,
        message: "Invitación reenviada por correo. Revisa también la carpeta de spam.",
      };
    }
    if (!/already|registered|exist/i.test(inviteErr.message)) {
      return { ok: false, error: inviteErr.message };
    }
  }

  const { error: resetErr } = await admin.auth.resetPasswordForEmail(emailNorm, {
    redirectTo: `${origin}/auth/reset-password/`,
  });

  if (resetErr) {
    return {
      ok: false,
      error: resetErr.message ?? "No se pudo reenviar el correo de acceso.",
    };
  }

  return {
    ok: true,
    message: hasSignedIn
      ? "Se envió un correo para restablecer la contraseña."
      : "Se envió un correo de acceso (invitación o restablecimiento). Revisa spam si no llega.",
  };
}
