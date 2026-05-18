"use client";

import dynamic from "next/dynamic";
import type { MasterClockCounterProps } from "@/components/system/MasterClockCounter";

const MasterClockCounter = dynamic(
  () =>
    import("@/components/system/MasterClockCounter").then((m) => ({
      default: m.MasterClockCounter,
    })),
  { ssr: false }
);

/** Reloj de fichajes: solo en cliente para no bloquear la carga del portal. */
export function PublicPortalMasterClock(props: MasterClockCounterProps) {
  return <MasterClockCounter {...props} />;
}
