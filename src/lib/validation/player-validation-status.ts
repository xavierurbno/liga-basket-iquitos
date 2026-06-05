import type { PlayerStatus } from "@/lib/db/schema";

export type ValidationStatusTone = "habilitado" | "suspendido" | "no_habilitado";

export type PlayerValidationStatusDisplay = {
  label: "HABILITADO" | "SUSPENDIDO" | "NO HABILITADO";
  tone: ValidationStatusTone;
  description: string;
};

/** Mapeo público para mesa de control (/validar). */
export function resolvePlayerValidationStatus(
  status: PlayerStatus | null | undefined,
): PlayerValidationStatusDisplay {
  switch (status) {
    case "ACTIVO":
      return {
        label: "HABILITADO",
        tone: "habilitado",
        description: "Habilitado para participar según el registro oficial de la liga.",
      };
    case "SUSPENDIDO":
      return {
        label: "SUSPENDIDO",
        tone: "suspendido",
        description: "No habilitado. Comunicar con la mesa de control o el club.",
      };
    case "PENDIENTE_PAGO":
      return {
        label: "NO HABILITADO",
        tone: "no_habilitado",
        description: "Pendiente de pago o trámite administrativo.",
      };
    case "INACTIVO":
      return {
        label: "NO HABILITADO",
        tone: "no_habilitado",
        description: "Inactivo en el registro de la liga.",
      };
    default:
      return {
        label: "NO HABILITADO",
        tone: "no_habilitado",
        description: "Estado no confirmado en el registro.",
      };
  }
}

/** Badge compacto en filas de plantilla (/validar equipo). */
export const VALIDATION_STATUS_ROW_UI: Record<
  ValidationStatusTone,
  { pill: string; dot: string }
> = {
  habilitado: {
    pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  suspendido: {
    pill: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  no_habilitado: {
    pill: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
};

export const VALIDATION_STATUS_UI: Record<
  ValidationStatusTone,
  { banner: string; badge: string; ring: string }
> = {
  habilitado: {
    banner: "border-emerald-300 bg-emerald-50",
    badge: "bg-emerald-600 text-white",
    ring: "ring-emerald-200",
  },
  suspendido: {
    banner: "border-red-300 bg-red-50",
    badge: "bg-red-600 text-white",
    ring: "ring-red-200",
  },
  no_habilitado: {
    banner: "border-amber-300 bg-amber-50",
    badge: "bg-amber-600 text-white",
    ring: "ring-amber-200",
  },
};
