import { PortalSiteHeader, type PortalSiteHeaderVariant } from "@/components/layout/PortalSiteHeader";

export async function SiteTopNav({
  variant,
  hidePanelGestión,
}: {
  variant?: PortalSiteHeaderVariant;
  hidePanelGestión?: boolean;
}) {
  return <PortalSiteHeader variant={variant} hidePanelGestión={hidePanelGestión} />;
}
