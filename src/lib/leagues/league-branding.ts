import type { CSSProperties } from "react";
import { resolveLeagueDisplayLogoUrl } from "@/lib/logos/resolve-public-league-logo.server";
import {
  DEFAULT_PORTAL_ACCENT,
  DEFAULT_PORTAL_PRIMARY,
  normalizePortalHexColor,
} from "@/lib/leagues/portal-colors";
import { settingsRepository } from "@/repositories/settingsRepository";

export { normalizePortalHexColor } from "@/lib/leagues/portal-colors";

/** Branding público de una liga (portal + login + PDF cuando aplica). */
export type LeaguePortalBranding = {
  /** UUID de la liga. Usar siempre este campo (no `id`: React RSC puede omitirlo al serializar). */
  leagueId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerText: string | null;
  portalPrimaryColor: string;
  portalAccentColor: string;
};

export async function loadLeaguePortalBranding(
  league: { id: string; name: string; slug: string },
): Promise<LeaguePortalBranding> {
  try {
    const settings = await settingsRepository.getLeagueSettings(league.id);
    return {
      leagueId: league.id,
      name: league.name,
      slug: league.slug,
      logoUrl: settings?.loginLogoUrl?.trim() || null,
      bannerText: settings?.bannerText?.trim() || null,
      portalPrimaryColor: normalizePortalHexColor(
        settings?.portalPrimaryColor,
        DEFAULT_PORTAL_PRIMARY,
      ),
      portalAccentColor: normalizePortalHexColor(settings?.portalAccentColor, DEFAULT_PORTAL_ACCENT),
    };
  } catch {
    const logoUrl = await resolveLeagueDisplayLogoUrl({ slug: league.slug });
    return {
      leagueId: league.id,
      name: league.name,
      slug: league.slug,
      logoUrl,
      bannerText: null,
      portalPrimaryColor: DEFAULT_PORTAL_PRIMARY,
      portalAccentColor: DEFAULT_PORTAL_ACCENT,
    };
  }
}

export function brandingToCssVars(b: Pick<LeaguePortalBranding, "portalPrimaryColor" | "portalAccentColor">) {
  return {
    "--portal-primary": b.portalPrimaryColor,
    "--portal-accent": b.portalAccentColor,
  } as CSSProperties;
}
