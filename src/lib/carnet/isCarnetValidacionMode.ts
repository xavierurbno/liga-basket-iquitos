import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";

export function isCarnetValidacionMode(props: CarnetVistaPreviaProps): boolean {
  return props.presentationMode === "validacion";
}
