import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Search, ShieldCheck } from "lucide-react";
import { PortalHeaderNavMenu } from "@/components/layout/PortalHeaderNavMenu";
import { canAccessIntranet } from "@/lib/auth/intranet-gate";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { buildPortalLoginHref, leaguePortalHome } from "@/lib/portal/league-portal-paths";
import { fetchPortalLeagueBranding, fetchPortalLeagueBySlug, resolveDefaultPortalLeagueId } from "@/lib/portal/portal-league-cache";
import { PROGRAM_LEAGUES_DIRECTORY_PATH } from "@/lib/portal/default-portal-league";
import { LeagueHeaderLogo } from "@/components/ui/LeagueHeaderLogo";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";
import { PortalSocialLinks } from "@/components/layout/PortalSocialLinks";
import { buildLeagueSocialLinks, type LeagueSocialLink } from "@/lib/leagues/league-social-links";
import { settingsRepository } from "@/repositories/settingsRepository";

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

async function resolvePortalSocialLinks(leagueSlug?: string): Promise<LeagueSocialLink[]> {
  try {
    if (leagueSlug?.trim()) {
      const league = await fetchPortalLeagueBySlug(leagueSlug.trim());
      if (!league) return [];
      const settings = await settingsRepository.getLeagueSettings(league.id);
      return buildLeagueSocialLinks(settings);
    }
    const leagueId = await resolveDefaultPortalLeagueId();
    if (!leagueId) return [];
    const settings = await settingsRepository.getLeagueSettings(leagueId);
    return buildLeagueSocialLinks(settings);
  } catch (e) {
    console.warn("[portal-header] resolvePortalSocialLinks:", e);
    return [];
  }
}

/** Cabecera pública (presentación); el `panelHref` debe obtenerse con `resolvePortalPanelHref`. */
export function PortalSiteHeaderBar({
  variant = "portal",
  panelHref = "/",
  hidePanelGestión = false,
  leagueSlug,
  leagueName,
  leagueLogoUrl,
  socialLinks = [],
}: {
  variant?: PortalSiteHeaderVariant;
  panelHref?: string;
  /** Si es true, oculta «Panel de gestión» en variantes que lo muestran por defecto (p. ej. busqueda365). */
  hidePanelGestión?: boolean;
  leagueSlug?: string;
  leagueName?: string;
  leagueLogoUrl?: string | null;
  socialLinks?: LeagueSocialLink[];
}) {
  const showGestiónLink =
    !hidePanelGestión && (variant === "busqueda365" || variant === "normativas");
  const homeHref = leagueSlug ? leaguePortalHome(leagueSlug) : "/";
  const campeonatosHref = leagueSlug ? `${homeHref}#campeonatos` : "/#campeonatos";
  const inLeaguePortal = Boolean(leagueSlug && leagueName);
  const portalLoginHref = leagueSlug
    ? buildPortalLoginHref({
        leagueSlug,
        next: panelHref.startsWith("/liga") ? panelHref : homeHref,
      })
    : panelHref;

  return (
    <header className="sticky top-0 z-50 w-full overflow-visible border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div
        className={`relative z-50 flex min-h-36 flex-wrap items-center justify-between gap-3 overflow-visible py-2.5 sm:py-3 ${PORTAL_SHELL_CLASS}`}
      >
        <LeagueHeaderLogo
          size="hero"
          priority
          className="min-w-0"
          href={homeHref}
          linkTitle={leagueName ? `Inicio — ${leagueName}` : "Inicio"}
          brandName={inLeaguePortal ? leagueName : undefined}
          logoUrl={leagueLogoUrl ?? undefined}
          leagueSlug={leagueSlug}
        />
        <nav className="relative z-20 flex shrink-0 flex-wrap items-center justify-end gap-2 overflow-visible" aria-label="Navegación principal">
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
              <PortalSocialLinks links={socialLinks} />
              <Link href="/busqueda-365/" className={navBtnClass}>
                <Search className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                Búsqueda 365
              </Link>
              <PortalHeaderNavMenu
                intranetHref={portalLoginHref}
                ligasHref={PROGRAM_LEAGUES_DIRECTORY_PATH}
                campeonatosHref={campeonatosHref}
              />
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
  leagueSlug,
  leagueName,
  leagueLogoUrl,
}: {
  variant?: PortalSiteHeaderVariant;
  hidePanelGestión?: boolean;
  leagueSlug?: string;
  leagueName?: string;
  leagueLogoUrl?: string | null;
}) {
  const panelHref = await resolvePortalPanelHref();
  const socialLinks = await resolvePortalSocialLinks(leagueSlug);
  let resolvedName = leagueName;
  let resolvedLogo = leagueLogoUrl;

  if (leagueSlug?.trim() && (!resolvedName || resolvedLogo === undefined)) {
    const branding = await fetchPortalLeagueBranding(leagueSlug.trim());
    if (branding) {
      resolvedName = resolvedName ?? branding.name;
      if (resolvedLogo === undefined) resolvedLogo = branding.logoUrl;
    }
  }

  return (
    <PortalSiteHeaderBar
      variant={variant}
      panelHref={panelHref}
      hidePanelGestión={hidePanelGestión}
      leagueSlug={leagueSlug}
      leagueName={resolvedName}
      leagueLogoUrl={resolvedLogo}
      socialLinks={socialLinks}
    />
  );
}
