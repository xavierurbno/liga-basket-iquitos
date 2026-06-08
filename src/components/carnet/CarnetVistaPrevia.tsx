"use client";

import { CarnetPdfVistaPrevia } from "@/components/carnet/CarnetPdfVistaPrevia";
import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";

export function CarnetVistaPrevia(props: CarnetVistaPreviaProps) {
  return <CarnetPdfVistaPrevia {...props} />;
}
