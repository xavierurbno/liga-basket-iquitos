import type { LeagueSettings } from "@/lib/db/schema";
import { resolveCarnetValidityLabel } from "@/lib/carnet/carnetInstitucionalText";
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

  if (
    (isLddbiCarnetPreset(carnetPreset) || settings?.carnetShowFederation !== false) &&
    !hasFederationLogo
  ) {
    warnings.push({
      id: "logo-federacion",
      message: "Sube el logo de la federación para el carnet LDDBI (cabecera derecha).",
      severity: "warning",
    });
  }

  if (!hasPresidentSignature) {
    warnings.push({
      id: "firma-presidente",
      message: "Falta la firma PNG del presidente en el reverso del carnet.",
      severity: "warning",
    });
  }
  if (!hasSecretarySignature) {
    warnings.push({
      id: "firma-secretario",
      message: "Falta la firma PNG del secretario en el reverso del carnet.",
      severity: "warning",
    });
  }
  if (!hasPresidentName) {
    warnings.push({
      id: "nombre-presidente",
      message: "Falta el nombre impreso del presidente bajo la firma.",
      severity: "warning",
    });
  }
  if (!hasSecretaryName) {
    warnings.push({
      id: "nombre-secretario",
      message: "Falta el nombre impreso del secretario bajo la firma.",
      severity: "warning",
    });
  }
  if (carnetPreset === "lddbi_template") {
    warnings.push({
      id: "lddbi-template-png",
      message:
        "Plantilla PNG: anverso-template.png y reverso-template.png en public/carnet/lddbi-template/ (1011×638 px). El sistema superpone logos, textos y datos sin modificar el diseño del PNG.",
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
