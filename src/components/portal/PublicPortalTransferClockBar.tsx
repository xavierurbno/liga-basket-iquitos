"use client";

import { PublicPortalMasterClock } from "@/components/portal/PublicPortalMasterClock";

/** Franja compacta bajo la cabecera del portal; invisible si el mercado no está activo. */
export function PublicPortalTransferClockBar({
  leagueId,
}: {
  leagueId: string;
}) {
  return <PublicPortalMasterClock variant="banner" leagueId={leagueId} />;
}
