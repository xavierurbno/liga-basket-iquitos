import type { LeagueSettings } from "@/lib/db/schema";
import { resolveCarnetValidityLabel } from "@/lib/carnet/carnetInstitucionalText";
import { isClasicaReversoCarnetPreset } from "@/lib/carnet/carnetPresetConfig";
import { buildCarnetSignatureReadinessWarnings } from "@/lib/carnet/carnetSignatureMode";
import { isLddbiCarnetPreset } from "@/lib/carnet/lddbiTemplateLayout";
import type { CarnetThemePreset } from "@/lib/carnet/carnetTheme";

export type CarnetReadinessWarning = {
  id: string;
  message: string;
  severity: "info" | "warning";
};

export type CarnetLeagueReadiness = {
  /** Sin advertencias de severidad warning. */
  ready: boolean;
  warnings: CarnetReadinessWarning[];
  checklist: {
    hasLeagueLogo: boolean;
    hasPresidentSignature: boolean;
    hasSecretarySignature: boolean;
    hasPresidentName: boolean;
    hasSecretaryName: boolean;
    hasExplicitValidity: boolean;
  };
};

export function buildCarnetLeagueReadiness(
  settings: Partial<LeagueSettings> | null,
  hasLeagueLogo: boolean,
  hasFederationLogo = true,
  carnetPreset?: CarnetThemePreset,
  hasLeagueMonoLogo = false,
): CarnetLeagueReadiness {
  const warnings: CarnetReadinessWarning[] = [];

  const hasPresidentSignature = Boolean(settings?.presidentSignatureUrl?.trim());
  const hasSecretarySignature = Boolean(settings?.secretarySignatureUrl?.trim());
  const hasPresidentName = Boolean(settings?.presidentDisplayName?.trim());
  const hasSecretaryName = Boolean(settings?.secretaryDisplayName?.trim());
  const hasExplicitValidity = Boolean(settings?.carnetValidityLabel?.trim());

  if (!hasLeagueLogo) {
    warnings.push({
      id: "logo",
      message: "Sube el logo de la liga (se usa en login, portal y carnet).",
      severity: "warning",
    });
  }

  const showFederation = settings?.carnetShowFederation !== false;
  if (showFederation && !hasFederationLogo) {
    warnings.push({
      id: "logo-federacion",
      message: isLddbiCarnetPreset(carnetPreset)
        ? "Sube el logo de la federación para el carnet LDDBI (cabecera derecha), o activa el logo por defecto del sistema."
        : "Sube el logo de la federación para el carnet (cabecera).",
      severity: "warning",
    });
  }

  for (const sigWarn of buildCarnetSignatureReadinessWarnings(settings)) {
    warnings.push({ ...sigWarn, severity: "warning" });
  }
  if (carnetPreset && isClasicaReversoCarnetPreset(carnetPreset) && !hasLeagueMonoLogo) {
    warnings.push({
      id: "logo-liga-mono",
      message:
        "Plantilla con reverso clásico: sube el logo B/N de la liga o coloca liga-mono.png en public/logos/ (ahorra cinta color en ZC300).",
      severity: "warning",
    });
  }

  if (isLddbiCarnetPreset(carnetPreset)) {
    warnings.push({
      id: "carnet-template-png",
      message:
        "Plantilla PNG CR80 (1011×638 px). El sistema superpone logos, datos del jugador, DNI, correlativo y QR según el diseño elegido en configuración.",
      severity: "info",
    });
  }

  if (!hasExplicitValidity) {
    const fallback = resolveCarnetValidityLabel(null, settings?.seasonName);
    warnings.push({
      id: "vigencia",
      message: `La vigencia usará «${fallback}». Define una vigencia explícita (ej. 03/2026 - 03/2027).`,
      severity: "info",
    });
  }

  const ready = warnings.every((w) => w.severity !== "warning");

  return {
    ready,
    warnings,
    checklist: {
      hasLeagueLogo,
      hasPresidentSignature,
      hasSecretarySignature,
      hasPresidentName,
      hasSecretaryName,
      hasExplicitValidity,
    },
  };
}

export function buildPlayerCarnetWarnings(input: {
  hasPhoto: boolean;
  hasCarnetNumber: boolean;
}): CarnetReadinessWarning[] {
  const warnings: CarnetReadinessWarning[] = [];
  if (!input.hasPhoto) {
    warnings.push({
      id: "foto",
      message: "El jugador no tiene foto: el carnet se generará con el recuadro «SIN FOTO».",
      severity: "warning",
    });
  }
  if (!input.hasCarnetNumber) {
    warnings.push({
      id: "numero",
      message:
        "Aún no hay número de carnet en el sistema (común en jugadores registrados antes). Se asignará automáticamente al emitir, o usa «Generar número de carnet».",
      severity: "info",
    });
  }
  return warnings;
}
