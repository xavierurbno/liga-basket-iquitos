import type { ReactNode } from "react";
import type { LeaguePortalBranding } from "@/lib/leagues/league-branding";
import { brandingToCssVars } from "@/lib/leagues/league-branding";

type PortalLeagueThemeProps = {
  branding: LeaguePortalBranding;
  children: ReactNode;
  /** Si false, no muestra franja de banner (p. ej. home programa). */
  showBanner?: boolean;
};

/**
 * Variables CSS `--portal-primary` / `--portal-accent` para hijos con clases `portal-theme-*`.
 */
export function PortalLeagueTheme({
  branding,
  children,
  showBanner = true,
}: PortalLeagueThemeProps) {
  const style = brandingToCssVars(branding);

  return (
    <div className="portal-league-theme flex min-h-screen flex-1 flex-col" style={style}>
      {showBanner && branding.bannerText ? (
        <div
          className="border-b px-4 py-2.5 text-center text-sm font-medium italic text-white"
          style={{ backgroundColor: "var(--portal-primary)" }}
        >
          {branding.bannerText}
        </div>
      ) : null}
      {children}
    </div>
  );
}
