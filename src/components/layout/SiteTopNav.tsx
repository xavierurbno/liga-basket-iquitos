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
}: {
  variant?: PortalSiteHeaderVariant;
  hidePanelGestión?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <PortalSiteHeaderBar
          variant={variant}
          panelHref={DEFAULT_PORTAL_PANEL_HREF}
          hidePanelGestión={hidePanelGestión}
        />
      }
    >
      <PortalSiteHeader variant={variant} hidePanelGestión={hidePanelGestión} />
    </Suspense>
  );
}
