"use client";

import { LigaOperationalNav } from "@/components/nav/LigaOperationalNav";

/**
 * Compatibilidad: antes vivía aquí la barra del panel /liga.
 * Reexporta el mismo UI vía {@link LigaOperationalNav} por si queda algún import o caché de bundler antigua.
 */
export function DashboardNav({
  userEmail = null,
  intranetNavLabel = null,
}: {
  userEmail?: string | null;
  intranetNavLabel?: string | null;
}) {
  return <LigaOperationalNav userEmail={userEmail} intranetNavLabel={intranetNavLabel} />;
}
