import { LDDBI_TEMPLATE } from "@/lib/carnet/lddbiTemplateLayout";
import type { LeagueSettings } from "@/lib/db/schema";

/** Firmas en el reverso del carnet CR80. */
export const CARNET_SIGNATURE_MODES = ["none", "president", "both"] as const;

export type CarnetSignatureMode = (typeof CARNET_SIGNATURE_MODES)[number];

export const CARNET_SIGNATURE_MODE_LABELS: Record<CarnetSignatureMode, string> = {
  none: "Sin firmas en el reverso",
  president: "Solo presidente",
  both: "Presidente y secretario",
};

export const DEFAULT_CARNET_SIGNATURE_MODE: CarnetSignatureMode = "both";

export function parseCarnetSignatureMode(
  raw: string | null | undefined,
): CarnetSignatureMode {
  const v = raw?.trim();
  if (v && (CARNET_SIGNATURE_MODES as readonly string[]).includes(v)) {
    return v as CarnetSignatureMode;
  }
  return DEFAULT_CARNET_SIGNATURE_MODE;
}

export type CarnetFirmaSlotInput = {
  cargo: "PRESIDENTE" | "SECRETARIO";
  nombre: string;
  firmaPngDataUrl: string | null;
  firmaUrl: string | null;
};

export function resolveCarnetFirmaSlots(
  mode: CarnetSignatureMode,
  input: {
    presidentDisplayName: string;
    secretaryDisplayName: string;
    presidentSignaturePngDataUrl?: string | null;
    secretarySignaturePngDataUrl?: string | null;
    presidentSignatureUrl?: string | null;
    secretarySignatureUrl?: string | null;
  },
): CarnetFirmaSlotInput[] {
  if (mode === "none") return [];

  const president: CarnetFirmaSlotInput = {
    cargo: "PRESIDENTE",
    nombre: input.presidentDisplayName,
    firmaPngDataUrl: input.presidentSignaturePngDataUrl ?? null,
    firmaUrl: input.presidentSignatureUrl ?? null,
  };

  if (mode === "president") return [president];

  return [
    president,
    {
      cargo: "SECRETARIO",
      nombre: input.secretaryDisplayName,
      firmaPngDataUrl: input.secretarySignaturePngDataUrl ?? null,
      firmaUrl: input.secretarySignatureUrl ?? null,
    },
  ];
}

export type CarnetFirmaLayoutSlot = CarnetFirmaSlotInput & {
  xMm: number;
  wMm: number;
};

/** Posiciones en mm del reverso LDDBI (PDF y vista previa HTML). */
export function layoutCarnetFirmaSlots(
  mode: CarnetSignatureMode,
  slots: CarnetFirmaSlotInput[],
): CarnetFirmaLayoutSlot[] {
  if (mode === "none" || slots.length === 0) return [];

  const F = LDDBI_TEMPLATE.reverso.firmas;
  const baseX = F.x;
  const colW = F.w;
  const gap = F.gap;

  if (slots.length === 1) {
    const wMm = colW;
    const xMm = baseX + (F.zoneW - wMm) / 2;
    return [{ ...slots[0], xMm, wMm }];
  }

  return slots.map((slot, index) => ({
    ...slot,
    xMm: baseX + index * (colW + gap),
    wMm: colW,
  }));
}

export function carnetSignatureModeRequiresPresident(mode: CarnetSignatureMode): boolean {
  return mode === "president" || mode === "both";
}

export function carnetSignatureModeRequiresSecretary(mode: CarnetSignatureMode): boolean {
  return mode === "both";
}

export function buildCarnetSignatureReadinessWarnings(
  settings: Partial<LeagueSettings> | null | undefined,
): Array<{ id: string; message: string }> {
  const mode = parseCarnetSignatureMode(settings?.carnetSignatureMode);
  const warnings: Array<{ id: string; message: string }> = [];

  if (carnetSignatureModeRequiresPresident(mode)) {
    if (!settings?.presidentSignatureUrl?.trim()) {
      warnings.push({
        id: "firma-presidente",
        message: "Falta la firma PNG del presidente en el reverso del carnet.",
      });
    }
    if (!settings?.presidentDisplayName?.trim()) {
      warnings.push({
        id: "nombre-presidente",
        message: "Falta el nombre impreso del presidente bajo la firma.",
      });
    }
  }

  if (carnetSignatureModeRequiresSecretary(mode)) {
    if (!settings?.secretarySignatureUrl?.trim()) {
      warnings.push({
        id: "firma-secretario",
        message: "Falta la firma PNG del secretario en el reverso del carnet.",
      });
    }
    if (!settings?.secretaryDisplayName?.trim()) {
      warnings.push({
        id: "nombre-secretario",
        message: "Falta el nombre impreso del secretario bajo la firma.",
      });
    }
  }

  return warnings;
}
