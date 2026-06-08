import { Suspense } from "react";
import {
  DEFAULT_PORTAL_PANEL_HREF,
  PortalSiteHeader,
  PortalSiteHeaderBar,
  type PortalSiteHeaderVariant,
} from "@/components/layout/PortalSiteHeader";

export function SiteTopNav({
  variant,
  hidePanelGestión,
  leagueSlug,
  leagueName,
  leagueLogoUrl,
  leagueId,
}: {
  variant?: PortalSiteHeaderVariant;
  hidePanelGestión?: boolean;
  /** Contexto `/l/[slug]`: inicio y anclas de esa liga. */
  leagueSlug?: string;
  leagueName?: string;
  leagueLogoUrl?: string | null;
  leagueId?: string | null;
}) {
  return (
    <Suspense
      fallback={
        <PortalSiteHeaderBar
          variant={variant}
          panelHref={DEFAULT_PORTAL_PANEL_HREF}
          hidePanelGestión={hidePanelGestión}
          leagueSlug={leagueSlug}
          leagueName={leagueName}
          leagueLogoUrl={leagueLogoUrl}
          leagueId={leagueId}
        />
      }
    >
      <PortalSiteHeader
        variant={variant}
        hidePanelGestión={hidePanelGestión}
        leagueSlug={leagueSlug}
        leagueName={leagueName}
        leagueLogoUrl={leagueLogoUrl}
        leagueId={leagueId}
      />
    </Suspense>
  );
}
