import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { LayoutDashboard, Search, ShieldCheck, Trophy } from "lucide-react";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { LeagueHeaderLogo } from "@/components/ui/LeagueHeaderLogo";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";

const navBtnClass =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f]";

/** Mismo estilo que el botón resaltado en `LigaOperationalNav`. */
const panelGestiónBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#005CEE] bg-[#005CEE] px-3 py-2 text-xs font-bold tracking-wide text-white shadow-[0_10px_20px_-10px_rgba(0,92,238,0.7)] transition hover:bg-[#004bb5]";

export type PortalSiteHeaderVariant = "portal" | "busqueda365" | "normativas";

export const DEFAULT_PORTAL_PANEL_HREF = "/login/?next=%2Fliga%2F";

/**
 * Destino del botón Intranet / panel: solo `/liga/` si el JWT tiene rol de liga o es el correo maestro.
 * Si hay sesión de Google pero sin rol (público), se envía a login con `next` para evitar el rebote proxy → `/`.
 */
export async function resolvePortalPanelHref(): Promise<string> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url?.trim() || !anon?.trim()) {
      return DEFAULT_PORTAL_PANEL_HREF;
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* ignorar en RSC */
          }
        },
      },
    });
    const { data, error } = await withQueryTimeout(
      supabase.auth.getUser(),
      3_000,
      "portalAuthGetUser",
    );
    if (error && isInvalidRefreshTokenError(error)) {
      await supabase.auth.signOut();
      return DEFAULT_PORTAL_PANEL_HREF;
    }
    const user = data.user;
    if (!user) return DEFAULT_PORTAL_PANEL_HREF;
    const role = typeof user.app_metadata?.role === "string" ? user.app_metadata.role : undefined;
    return canAccessIntranet(user, role) ? "/liga/" : DEFAULT_PORTAL_PANEL_HREF;
  } catch (e) {
    console.error("[portal-header] resolvePortalPanelHref:", e);
    return DEFAULT_PORTAL_PANEL_HREF;
  }
}

/** Cabecera pública (presentación); el `panelHref` debe obtenerse con `resolvePortalPanelHref`. */
export function PortalSiteHeaderBar({
  variant = "portal",
  panelHref = "/",
  hidePanelGestión = false,
}: {
  variant?: PortalSiteHeaderVariant;
  panelHref?: string;
  /** Si es true, oculta «Panel de gestión» en variantes que lo muestran por defecto (p. ej. busqueda365). */
  hidePanelGestión?: boolean;
}) {
  const showGestiónLink =
    !hidePanelGestión && (variant === "busqueda365" || variant === "normativas");

  return (
    <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div
        className={`relative flex min-h-36 flex-wrap items-center justify-between gap-3 py-2.5 sm:py-3 ${PORTAL_SHELL_CLASS}`}
      >
        <LeagueHeaderLogo size="hero" priority className="min-w-0" />
        <nav className="relative z-20 flex shrink-0 flex-wrap items-center justify-end gap-2" aria-label="Navegación principal">
          {showGestiónLink ? (
            <Link
              href={panelHref}
              className={panelGestiónBtnClass}
              title="Volver al panel operativo de la liga"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Panel de gestión
            </Link>
          ) : variant === "portal" ? (
            <>
              <Link href="/#campeonatos" className={navBtnClass}>
                <Trophy className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                Campeonatos
              </Link>
              <Link href="/busqueda-365/" className={navBtnClass}>
                <Search className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                Búsqueda 365
              </Link>
              <Link href={panelHref} className={navBtnClass}>
                <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                Intranet
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

/**
 * Cabecera del portal público.
 * `busqueda365`: logo + «Panel de gestión» (salvo `hidePanelGestión`).
 * `normativas`: mismo botón solo si la página pasa `hidePanelGestión={false}` (admin con sesión).
 */
export async function PortalSiteHeader({
  variant = "portal",
  hidePanelGestión,
}: {
  variant?: PortalSiteHeaderVariant;
  hidePanelGestión?: boolean;
}) {
  const panelHref = await resolvePortalPanelHref();
  return <PortalSiteHeaderBar variant={variant} panelHref={panelHref} hidePanelGestión={hidePanelGestión} />;
}
